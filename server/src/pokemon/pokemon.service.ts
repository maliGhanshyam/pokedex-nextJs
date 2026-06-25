import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Pokemon, PokemonDocument } from '../entities/pokemon.entity';
import {
  PokemonDetailsDto,
  PokemonListResponseDto,
  PaginationQueryDto,
} from '../common/dto/pokemon.dto';

@Injectable()
export class PokemonService {
  private readonly logger = new Logger(PokemonService.name);
  private readonly pokeApiBaseUrl: string;

  constructor(
    @InjectModel(Pokemon.name)
    private pokemonModel: Model<PokemonDocument>,
    private httpService: HttpService,
    private configService: ConfigService,
    @InjectConnection()
    private connection: Connection,
  ) {
    this.pokeApiBaseUrl =
      this.configService.get<string>('POKEAPI_BASE_URL') ||
      'https://pokeapi.co/api/v2';
  }

  async hasData(): Promise<boolean> {
    try {
      const count = await this.pokemonModel.countDocuments();
      return count > 0;
    } catch (error) {
      this.logger.warn(`Failed to check pokemon data: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async getCount(): Promise<number> {
    try {
      return await this.pokemonModel.countDocuments();
    } catch (error) {
      this.logger.warn(`Failed to count pokemon: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }

  async needsIncrementalSync(): Promise<boolean> {
    try {
      const count = await this.pokemonModel.countDocuments();
      const expectedMinCount = 1000;
      return count < expectedMinCount;
    } catch (error) {
      this.logger.warn(`Failed to check sync status: ${error instanceof Error ? error.message : String(error)}`);
      return true;
    }
  }

  async syncPokemonIncremental(): Promise<{ synced: number; errors: number }> {
    this.logger.log('Starting incremental Pokémon sync job...');

    let synced = 0;
    let errors = 0;
    const batchSize = 20;
    let offset = 0;
    let hasMore = true;
    const maxSyncLimit = 10000;

    try {
      while (hasMore && offset < maxSyncLimit) {
        try {
          const listResponse = await this.fetchPokemonList(offset, batchSize);
          const pokemonList = listResponse.results;

          if (pokemonList.length === 0) {
            hasMore = false;
            break;
          }

          for (const pokemonResult of pokemonList) {
            try {
              const pokemonIdMatch = pokemonResult.url.match(/\/pokemon\/(\d+)\//);
              if (!pokemonIdMatch) {
                this.logger.warn(`Could not extract ID from URL: ${pokemonResult.url}`);
                continue;
              }
              const pokemonId = parseInt(pokemonIdMatch[1], 10);

              const existing = await this.pokemonModel.findOne({ id: pokemonId });
              if (existing) {
                continue;
              }

              await this.syncSinglePokemon(pokemonResult.url);
              synced++;

              if (synced % 50 === 0) {
                this.logger.log(`Incremental sync: Synced ${synced} new Pokémon so far...`);
              }

              await this.sleep(600);
            } catch (error) {
              errors++;
              this.logger.error(
                `Error syncing ${pokemonResult.name}: ${error instanceof Error ? error.message : String(error)}`,
              );

              if (errors > 10 && synced === 0) {
                this.logger.error('Too many errors, stopping sync.');
                hasMore = false;
                break;
              }
            }
          }

          if (!listResponse.next) {
            hasMore = false;
          } else {
            offset += batchSize;
          }
        } catch (error) {
          this.logger.error(
            `Error fetching Pokémon list at offset ${offset}: ${error instanceof Error ? error.message : String(error)}`,
          );
          errors++;
          hasMore = false;
        }
      }

      this.logger.log(
        `Incremental Pokémon sync completed. Synced: ${synced}, Errors: ${errors}`,
      );
      return { synced, errors };
    } catch (error) {
      this.logger.error(
        `Fatal error in incremental Pokémon sync: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async clearAllTables(): Promise<void> {
    try {
      this.logger.log('Clearing all database collections...');
      const collections = ['favorite_pokemon', 'battles', 'contacts', 'pokemon', 'users'];

      for (const name of collections) {
        try {
          await this.connection.collection(name).deleteMany({});
          this.logger.debug(`Cleared collection: ${name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Failed to clear collection ${name}: ${errorMessage}`);
        }
      }

      this.logger.log('All database collections cleared successfully.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Error clearing collections: ${errorMessage}`);
    }
  }

  async findAll(query: PaginationQueryDto) {
    const { limit = 20, offset = 0 } = query;

    try {
      const [pokemon, total] = await Promise.all([
        this.pokemonModel
          .find({}, { id: 1, name: 1, sprite: 1, sprites: 1 })
          .sort({ id: 1 })
          .skip(offset)
          .limit(limit)
          .lean()
          .exec(),
        this.pokemonModel.countDocuments(),
      ]);

      const results = pokemon.map((p) => {
        const officialArtworkUrl =
          p.sprites?.other?.['official-artwork']?.front_default ||
          p.sprite ||
          '';

        const defaultSpriteUrl = p.sprites?.front_default || p.sprite || '';

        return {
          name: p.name,
          url: `${this.pokeApiBaseUrl}/pokemon/${p.name}`,
          id: p.id.toString(),
          image: defaultSpriteUrl,
          imageOfficial: officialArtworkUrl,
        };
      });

      const totalPages = Math.ceil(total / limit);
      const currentPage = Math.floor(offset / limit) + 1;

      return {
        count: total,
        next:
          currentPage < totalPages
            ? `/pokemon?limit=${limit}&offset=${offset + limit}`
            : null,
        previous:
          offset > 0
            ? `/pokemon?limit=${limit}&offset=${Math.max(0, offset - limit)}`
            : null,
        results,
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch pokemon list: ${error instanceof Error ? error.message : String(error)}`);
      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };
    }
  }

  async findOne(name: string): Promise<PokemonDetailsDto> {
    const pokemon = await this.pokemonModel
      .findOne({ name: name.toLowerCase() })
      .lean()
      .exec();

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with name ${name} not found`);
    }

    return this.mapToPokemonDetailsDto(pokemon as Pokemon);
  }

  async findAllTypes(): Promise<string[]> {
    try {
      const pokemon = await this.pokemonModel.find({}, { types: 1 }).lean().exec();

      const typeSet = new Set<string>();
      pokemon.forEach((p) => {
        p.types?.forEach((type) => {
          typeSet.add(type.type.name);
        });
      });

      return Array.from(typeSet).sort();
    } catch (error) {
      this.logger.warn(`Failed to fetch types: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async syncPokemon(): Promise<{ synced: number; errors: number }> {
    this.logger.log('Starting Pokémon sync job...');

    let synced = 0;
    let errors = 0;
    const batchSize = 20;
    let offset = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        try {
          const listResponse = await this.fetchPokemonList(offset, batchSize);
          const pokemonList = listResponse.results;

          if (pokemonList.length === 0) {
            hasMore = false;
            break;
}

          for (const pokemonResult of pokemonList) {
            try {
              await this.syncSinglePokemon(pokemonResult.url);
              synced++;
              if (synced % 50 === 0) {
                this.logger.log(`Synced ${synced} Pokémon so far...`);
              }
              await this.sleep(600);
            } catch (error) {
              errors++;
              this.logger.error(
                `Error syncing ${pokemonResult.name}: ${error instanceof Error ? error.message : String(error)}`,
              );

              if (errors > 10 && synced === 0) {
                this.logger.error('Too many errors, stopping sync.');
                hasMore = false;
                break;
              }
            }
          }

          if (!listResponse.next) {
            hasMore = false;
          } else {
            offset += batchSize;
          }
        } catch (error) {
          this.logger.error(
            `Error fetching Pokémon list at offset ${offset}: ${error instanceof Error ? error.message : String(error)}`,
          );
          errors++;
          hasMore = false;
        }
      }

      this.logger.log(
        `Pokémon sync completed. Synced: ${synced}, Errors: ${errors}`,
      );
      return { synced, errors };
    } catch (error) {
      this.logger.error(
        `Fatal error in Pokémon sync: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isRateLimit =
          error?.response?.status === 429 ||
          error?.status === 429 ||
          error?.message?.includes('429');

        if (isRateLimit && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          this.logger.warn(
            `Rate limited (429). Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError || new Error('Failed after retries');
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchPokemonList(
    offset: number,
    limit: number,
  ): Promise<PokemonListResponseDto> {
    const url = `${this.pokeApiBaseUrl}/pokemon?limit=${limit}&offset=${offset}`;

    return this.retryWithBackoff(async () => {
      const response = await firstValueFrom(
        this.httpService.get<PokemonListResponseDto>(url),
      );
      return response.data;
    });
  }

  private async syncSinglePokemon(url: string): Promise<void> {
    try {
      const pokemonData = await this.retryWithBackoff(async () => {
        const response = await firstValueFrom(
          this.httpService.get<PokemonDetailsDto>(url),
        );
        return response.data;
      });

      const pokemonId = pokemonData.id;
      const pokemonName = pokemonData.name.toLowerCase();

      const spriteUrl = pokemonData.sprites?.front_default || '';
      const officialArtworkUrl =
        pokemonData.sprites?.other?.['official-artwork']?.front_default || '';

      await this.pokemonModel.findOneAndUpdate(
        { id: pokemonId },
        {
          id: pokemonId,
          name: pokemonName,
          height: pokemonData.height,
          weight: pokemonData.weight,
          stats: pokemonData.stats || [],
          types: pokemonData.types || [],
          sprite: spriteUrl,
          sprites: pokemonData.sprites,
          abilities: pokemonData.abilities || [],
          species: pokemonData.species || { name: pokemonName },
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      this.logger.error(
        `Error syncing Pokémon from ${url}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private mapToPokemonDetailsDto(pokemon: Pokemon): PokemonDetailsDto {
    return {
      id: pokemon.id,
      name: pokemon.name,
      height: pokemon.height,
      weight: pokemon.weight,
      stats: pokemon.stats || [],
      types: pokemon.types || [],
      sprites: pokemon.sprites || {
        front_default: pokemon.sprite,
        other: {
          'official-artwork': {
            front_default: pokemon.sprite,
            front_shiny: pokemon.sprite,
          },
        },
      },
      abilities: pokemon.abilities || [],
      species: pokemon.species || { name: pokemon.name },
    };
  }
}

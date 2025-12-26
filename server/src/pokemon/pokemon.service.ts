import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Pokemon } from '../entities/pokemon.entity';
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
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.pokeApiBaseUrl =
      this.configService.get<string>('POKEAPI_BASE_URL') ||
      'https://pokeapi.co/api/v2';
  }

  async hasData(): Promise<boolean> {
    const count = await this.pokemonRepository.count();
    return count > 0;
  }

  async findAll(query: PaginationQueryDto) {
    const { limit = 20, offset = 0 } = query;

    const [pokemon, total] = await this.pokemonRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { id: 'ASC' },
    });

    const results = pokemon.map((p) => ({
      name: p.name,
      url: `${this.pokeApiBaseUrl}/pokemon/${p.name}`,
      id: p.id.toString(),
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`,
      imageOfficial: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
    }));

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
  }

  async findOne(name: string): Promise<PokemonDetailsDto> {
    const pokemon = await this.pokemonRepository.findOne({
      where: { name: name.toLowerCase() },
    });

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with name ${name} not found`);
    }

    return this.mapToPokemonDetailsDto(pokemon);
  }

  async findAllTypes(): Promise<string[]> {
    const pokemon = await this.pokemonRepository.find({
      select: ['types'],
    });

    const typeSet = new Set<string>();
    pokemon.forEach((p) => {
      p.types.forEach((type) => {
        typeSet.add(type.type.name);
      });
    });

    return Array.from(typeSet).sort();
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
              this.logger.debug(`Synced: ${pokemonResult.name}`);
            } catch (error) {
              errors++;
              this.logger.error(
                `Error syncing ${pokemonResult.name}: ${error instanceof Error ? error.message : String(error)}`,
              );
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

  private async fetchPokemonList(
    offset: number,
    limit: number,
  ): Promise<PokemonListResponseDto> {
    const url = `${this.pokeApiBaseUrl}/pokemon?limit=${limit}&offset=${offset}`;
    const response = await firstValueFrom(
      this.httpService.get<PokemonListResponseDto>(url),
    );
    return response.data;
  }

  private async syncSinglePokemon(url: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<PokemonDetailsDto>(url),
      );
      const pokemonData = response.data;

      const pokemonId = pokemonData.id;
      const pokemonName = pokemonData.name.toLowerCase();

      const spriteUrl = pokemonData.sprites?.front_default || '';
      const officialArtworkUrl =
        pokemonData.sprites?.other?.['official-artwork']?.front_default || '';

      await this.pokemonRepository.upsert(
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
        ['id'],
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


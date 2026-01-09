import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    this.pokeApiBaseUrl =
      this.configService.get<string>('POKEAPI_BASE_URL') ||
      'https://pokeapi.co/api/v2';
  }

  async hasData(): Promise<boolean> {
    try {
      const count = await this.pokemonRepository.count();
      return count > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // If table doesn't exist, return false (no data exists)
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        return false;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Check if incremental sync is needed
   * Returns true if we have less than expected Pokemon count (e.g., < 1000)
   */
  async needsIncrementalSync(): Promise<boolean> {
    try {
      const count = await this.pokemonRepository.count();
      // If we have less than 1000 Pokemon, we likely need to sync more
      // PokeAPI has ~1000+ Pokemon, so this is a reasonable threshold
      const expectedMinCount = 1000;
      return count < expectedMinCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        return true; // Need sync if table doesn't exist
      }
      throw error;
    }
  }

  /**
   * Incremental sync - only syncs Pokemon that don't exist in the database
   */
  async syncPokemonIncremental(): Promise<{ synced: number; errors: number }> {
    this.logger.log('Starting incremental Pokémon sync job...');
    
    // First, verify that the pokemon table exists
    try {
      await this.pokemonRepository.count();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        this.logger.error('Cannot sync: pokemon table does not exist. Please enable DB_SYNCHRONIZE=true and redeploy.');
        throw new Error('Database tables do not exist. Please enable DB_SYNCHRONIZE=true in environment variables.');
      }
      throw error;
    }
    
    let synced = 0;
    let errors = 0;
    const batchSize = 20;
    let offset = 0;
    let hasMore = true;
    const maxSyncLimit = 10000; // Safety limit to prevent infinite loops

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
              // Extract Pokemon ID from URL (e.g., "https://pokeapi.co/api/v2/pokemon/1/")
              const pokemonIdMatch = pokemonResult.url.match(/\/pokemon\/(\d+)\//);
              if (!pokemonIdMatch) {
                this.logger.warn(`Could not extract ID from URL: ${pokemonResult.url}`);
                continue;
              }
              const pokemonId = parseInt(pokemonIdMatch[1], 10);

              // Check if Pokemon already exists in database
              const existing = await this.pokemonRepository.findOne({
                where: { id: pokemonId },
              });

              if (existing) {
                // Skip if already exists
                continue;
              }

              // Sync only if missing
              await this.syncSinglePokemon(pokemonResult.url);
              synced++;
              
              // Log progress every 50 pokemon
              if (synced % 50 === 0) {
                this.logger.log(`Incremental sync: Synced ${synced} new Pokémon so far...`);
              }
              
              // Add delay between requests to avoid rate limiting
              await this.sleep(600);
            } catch (error) {
              errors++;
              const errorMessage = error instanceof Error ? error.message : String(error);
              
              // If table doesn't exist, stop syncing immediately
              if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
                this.logger.error(`Cannot continue sync: pokemon table does not exist. Stopped at ${synced} Pokémon.`);
                hasMore = false;
                break;
              }
              
              this.logger.error(
                `Error syncing ${pokemonResult.name}: ${errorMessage}`,
              );
              
              // Stop if too many errors occur
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
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Error fetching Pokémon list at offset ${offset}: ${errorMessage}`,
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
      this.logger.log('Clearing all database tables...');
      
      // Check if tables exist first (using information_schema)
      const tablesToCheck = ['favorite_pokemon', 'battles', 'contacts', 'pokemon', 'users'];
      const existingTables: string[] = [];
      
      for (const table of tablesToCheck) {
        try {
          const result = await this.dataSource.query(
            `SELECT 1 FROM information_schema.tables WHERE table_name = $1`,
            [table]
          );
          if (result && result.length > 0) {
            existingTables.push(table);
          }
        } catch (error) {
          // If information_schema query fails, try direct query
          try {
            await this.dataSource.query(`SELECT 1 FROM ${table} LIMIT 1`);
            existingTables.push(table);
          } catch (err) {
            // Table doesn't exist, skip it
          }
        }
      }
      
      if (existingTables.length === 0) {
        this.logger.log('No tables exist yet, skipping clear operation.');
        return;
      }
      
      // Clear tables using safe TypeORM methods
      // Order matters: clear child tables first, then parent tables
      const tablesToClear = ['favorite_pokemon', 'battles', 'contacts', 'pokemon', 'users'];
      
      // Use TypeORM repositories to safely clear data
      for (const table of tablesToClear) {
        if (existingTables.includes(table)) {
          try {
            // Use safe TypeORM query with CASCADE for foreign key handling
            await this.dataSource.query(`TRUNCATE TABLE ${table} CASCADE;`);
            this.logger.debug(`Cleared table: ${table}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to clear table ${table}: ${errorMessage}`);
          }
        }
      }
      
      this.logger.log('All database tables cleared successfully.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // If tables don't exist yet, that's okay - they'll be created by synchronize
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        this.logger.log('Tables do not exist yet, skipping clear operation.');
        return;
      }
      // For other errors, log but don't throw (non-critical operation)
      this.logger.warn(`Error clearing tables: ${errorMessage}`);
    }
  }

  async findAll(query: PaginationQueryDto) {
    const { limit = 20, offset = 0 } = query;

    try {
      // Optimize query by selecting only needed fields
      const [pokemon, total] = await this.pokemonRepository.findAndCount({
        select: ['id', 'name', 'sprite', 'sprites'],
        take: limit,
        skip: offset,
        order: { id: 'ASC' },
      });

      const results = pokemon.map((p) => {
        // Use stored sprite URLs from database - these contain the correct PokeAPI URLs
        // The sprites field is populated during sync with data from PokeAPI
        const officialArtworkUrl = p.sprites?.other?.['official-artwork']?.front_default || 
          p.sprite || 
          '';
        
        const defaultSpriteUrl = p.sprites?.front_default || 
          p.sprite || 
          '';

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        this.logger.warn('Pokemon table does not exist yet. Returning empty results.');
        // Return empty result set if table doesn't exist
        return {
          count: 0,
          next: null,
          previous: null,
          results: [],
        };
      }
      throw error;
    }
  }

  async findOne(name: string): Promise<PokemonDetailsDto> {
    try {
      const pokemon = await this.pokemonRepository.findOne({
        where: { name: name.toLowerCase() },
      });

      if (!pokemon) {
        throw new NotFoundException(`Pokemon with name ${name} not found`);
      }

      return this.mapToPokemonDetailsDto(pokemon);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        this.logger.warn('Pokemon table does not exist yet.');
        throw new NotFoundException(`Pokemon with name ${name} not found`);
      }
      throw error;
    }
  }

  async findAllTypes(): Promise<string[]> {
    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        this.logger.warn('Pokemon table does not exist yet. Returning empty types array.');
        return [];
      }
      throw error;
    }
  }

  async syncPokemon(): Promise<{ synced: number; errors: number }> {
    this.logger.log('Starting Pokémon sync job...');
    
    // First, verify that the pokemon table exists
    try {
      await this.pokemonRepository.count();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        this.logger.error('Cannot sync: pokemon table does not exist. Please enable DB_SYNCHRONIZE=true and redeploy.');
        throw new Error('Database tables do not exist. Please enable DB_SYNCHRONIZE=true in environment variables.');
      }
      throw error;
    }
    
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
              // Log progress every 50 pokemon
              if (synced % 50 === 0) {
                this.logger.log(`Synced ${synced} Pokémon so far...`);
              }
              
              // Add delay between requests to avoid rate limiting
              // PokeAPI allows ~100 requests per minute, so ~600ms delay is safe
              await this.sleep(600);
            } catch (error) {
              errors++;
              const errorMessage = error instanceof Error ? error.message : String(error);
              
              // If table doesn't exist, stop syncing immediately
              if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
                this.logger.error(`Cannot continue sync: pokemon table does not exist. Stopped at ${synced} Pokémon.`);
                hasMore = false;
                break;
              }
              
              this.logger.error(
                `Error syncing ${pokemonResult.name}: ${errorMessage}`,
              );
              
              // Stop if too many errors occur (more than 10 consecutive errors)
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
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Error fetching Pokémon list at offset ${offset}: ${errorMessage}`,
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

  /**
   * Retry helper with exponential backoff for handling rate limits
   */
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
        
        // Check if it's a rate limit error (429)
        const isRateLimit = error?.response?.status === 429 || 
                           error?.status === 429 ||
                           error?.message?.includes('429');
        
        if (isRateLimit && attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = baseDelay * Math.pow(2, attempt);
          this.logger.warn(
            `Rate limited (429). Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        
        // For non-rate-limit errors or final attempt, throw immediately
        throw error;
      }
    }

    throw lastError || new Error('Failed after retries');
  }

  /**
   * Sleep helper for rate limiting
   */
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


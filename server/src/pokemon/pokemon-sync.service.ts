import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PokemonService } from './pokemon.service';

@Injectable()
export class PokemonSyncService implements OnModuleInit {
  private readonly logger = new Logger(PokemonSyncService.name);
  private isRunning = false;
  private lastRun: Date | null = null;
  private lastStatus: {
    synced: number;
    errors: number;
    timestamp: Date;
  } | null = null;

  constructor(private pokemonService: PokemonService) {}

  async onModuleInit() {
    this.logger.log('Application started, checking database...');
    
    // Make startup lightweight - don't block app startup
    // Run sync check asynchronously after a short delay
    setTimeout(async () => {
      try {
      // Check if tables exist and if there's data
      const hasData = await this.pokemonService.hasData();
      if (!hasData) {
          this.logger.log('No Pokémon data found in database, triggering background sync...');
          // Run sync in background - don't await to avoid blocking startup
          this.triggerStartupSync().catch((error) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Background sync failed: ${errorMessage}`);
          });
      } else {
        this.logger.log('Pokémon data already exists in database, skipping startup sync.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if error is due to missing tables (database not initialized)
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        this.logger.warn(
          '⚠️  Database tables do not exist yet. To create them:',
        );
        this.logger.warn(
          '   1. Go to your backend service on Render → Settings → Environment',
        );
        this.logger.warn(
          '   2. Add: DB_SYNCHRONIZE=true',
        );
        this.logger.warn(
          '   3. Save and wait for redeploy',
        );
        this.logger.warn(
          '   Once tables are created, the sync will run automatically on next startup.',
        );
      } else {
          this.logger.error(`Startup check failed: ${errorMessage}`);
        }
      }
    }, 2000); // Short delay to ensure DB connection is ready, but don't block startup
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    if (this.isRunning) {
      this.logger.warn('Pokémon sync job is already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting scheduled Pokémon sync job...');

    try {
      // Check if data exists before syncing
      const hasData = await this.pokemonService.hasData();
      if (!hasData) {
        this.logger.log('No Pokémon data found in database, starting sync...');
        const result = await this.pokemonService.syncPokemon();
        this.lastStatus = {
          ...result,
          timestamp: new Date(),
        };
        this.lastRun = new Date();
        this.logger.log(
          `Scheduled sync completed. Synced: ${result.synced}, Errors: ${result.errors}`,
        );
      } else {
        // Check if we need to sync missing data (incremental sync)
        const needsSync = await this.pokemonService.needsIncrementalSync();
        if (needsSync) {
          this.logger.log('Incremental sync needed, syncing missing Pokémon...');
          const result = await this.pokemonService.syncPokemonIncremental();
          this.lastStatus = {
            ...result,
            timestamp: new Date(),
          };
          this.lastRun = new Date();
          this.logger.log(
            `Incremental sync completed. Synced: ${result.synced}, Errors: ${result.errors}`,
          );
        } else {
          this.logger.log('Database is up to date, skipping sync.');
          this.lastStatus = {
            synced: 0,
            errors: 0,
            timestamp: new Date(),
          };
          this.lastRun = new Date();
        }
      }
    } catch (error) {
      this.logger.error(
        `Scheduled sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.lastStatus = {
        synced: 0,
        errors: 1,
        timestamp: new Date(),
      };
    } finally {
      this.isRunning = false;
    }
  }

  private async triggerStartupSync() {
    if (this.isRunning) {
      this.logger.warn('Sync already running, skipping startup sync...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting startup Pokémon sync job...');

    try {
      const result = await this.pokemonService.syncPokemon();
      this.lastStatus = {
        ...result,
        timestamp: new Date(),
      };
      this.lastRun = new Date();
      this.logger.log(
        `Startup sync completed. Synced: ${result.synced}, Errors: ${result.errors}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Startup sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.lastStatus = {
        synced: 0,
        errors: 1,
        timestamp: new Date(),
      };
    } finally {
      this.isRunning = false;
    }
  }

  async triggerManualSync() {
    if (this.isRunning) {
      throw new Error('Pokémon sync job is already running');
    }

    this.isRunning = true;
    this.logger.log('Starting manual Pokémon sync job...');

    try {
      const result = await this.pokemonService.syncPokemon();
      this.lastStatus = {
        ...result,
        timestamp: new Date(),
      };
      this.lastRun = new Date();
      return result;
    } catch (error) {
      this.logger.error(
        `Manual sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      lastStatus: this.lastStatus,
    };
  }
}


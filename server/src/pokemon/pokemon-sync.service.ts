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
    this.logger.log('Application started, checking if Pokémon data exists...');
    
    // Wait a bit to ensure database connection and schema synchronization is complete
    // This is important when DB_SYNCHRONIZE=true is enabled
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const hasData = await this.pokemonService.hasData();
      if (!hasData) {
        this.logger.log('No Pokémon data found in database, triggering initial sync...');
        await this.triggerStartupSync();
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
        this.logger.error(`Startup sync check failed: ${errorMessage}`);
      }
    }
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
      const result = await this.pokemonService.syncPokemon();
      this.lastStatus = {
        ...result,
        timestamp: new Date(),
      };
      this.lastRun = new Date();
      this.logger.log(
        `Scheduled sync completed. Synced: ${result.synced}, Errors: ${result.errors}`,
      );
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


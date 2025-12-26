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
    try {
      const hasData = await this.pokemonService.hasData();
      if (!hasData) {
        this.logger.log('No Pokémon data found in database, triggering initial sync...');
        await this.triggerStartupSync();
      } else {
        this.logger.log('Pokémon data already exists in database, skipping startup sync.');
      }
    } catch (error) {
      this.logger.error(
        `Startup sync check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
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


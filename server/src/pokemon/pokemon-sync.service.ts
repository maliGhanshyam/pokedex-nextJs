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

    setTimeout(() => {
      this.triggerBackgroundSyncOnStartup().catch((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Startup sync check failed: ${errorMessage}`);
      });
    }, 2000);
  }

  private async triggerBackgroundSyncOnStartup() {
    const hasData = await this.pokemonService.hasData();

    if (!hasData) {
      this.logger.log('No Pokémon data found in database, triggering full background sync...');
      this.runFullSyncInBackground();
      return;
    }

    const needsSync = await this.pokemonService.needsIncrementalSync();
    if (needsSync) {
      const count = await this.pokemonService.getCount();
      this.logger.log(
        `Database has ${count} Pokémon but sync is incomplete, triggering incremental background sync...`,
      );
      this.runIncrementalSyncInBackground();
      return;
    }

    this.logger.log('Pokémon database is up to date, skipping startup sync.');
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

  private runFullSyncInBackground() {
    if (this.isRunning) {
      this.logger.warn('Sync already running, skipping full background sync...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting full Pokémon background sync...');

    this.pokemonService
      .syncPokemon()
      .then((result) => {
        this.lastStatus = { ...result, timestamp: new Date() };
        this.lastRun = new Date();
        this.logger.log(
          `Full background sync completed. Synced: ${result.synced}, Errors: ${result.errors}`,
        );
      })
      .catch((error) => {
        this.logger.error(
          `Full background sync failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        this.lastStatus = { synced: 0, errors: 1, timestamp: new Date() };
      })
      .finally(() => {
        this.isRunning = false;
      });
  }

  private runIncrementalSyncInBackground() {
    if (this.isRunning) {
      this.logger.warn('Sync already running, skipping incremental background sync...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting incremental Pokémon background sync...');

    this.pokemonService
      .syncPokemonIncremental()
      .then((result) => {
        this.lastStatus = { ...result, timestamp: new Date() };
        this.lastRun = new Date();
        this.logger.log(
          `Incremental background sync completed. Synced: ${result.synced}, Errors: ${result.errors}`,
        );
      })
      .catch((error) => {
        this.logger.error(
          `Incremental background sync failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        this.lastStatus = { synced: 0, errors: 1, timestamp: new Date() };
      })
      .finally(() => {
        this.isRunning = false;
      });
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

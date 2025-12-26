import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { PokemonSyncService } from '../pokemon/pokemon-sync.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private pokemonSyncService: PokemonSyncService) {}

  @Post('sync-pokemon')
  async triggerSync() {
    const result = await this.pokemonSyncService.triggerManualSync();
    return {
      message: 'Pokemon sync triggered successfully',
      ...result,
    };
  }

  @Get('cron-status')
  getCronStatus() {
    return this.pokemonSyncService.getStatus();
  }
}


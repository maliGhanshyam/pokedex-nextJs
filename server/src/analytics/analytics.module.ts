import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Pokemon } from '../entities/pokemon.entity';
import { FavoritePokemon } from '../entities/favorite-pokemon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pokemon, FavoritePokemon])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}


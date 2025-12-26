import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { Pokemon } from '../entities/pokemon.entity';
import { FavoritePokemon } from '../entities/favorite-pokemon.entity';
import { Battle } from '../entities/battle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pokemon, FavoritePokemon, Battle])],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}


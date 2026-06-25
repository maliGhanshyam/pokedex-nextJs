import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { Pokemon, PokemonSchema } from '../entities/pokemon.entity';
import { FavoritePokemon, FavoritePokemonSchema } from '../entities/favorite-pokemon.entity';
import { Battle, BattleSchema } from '../entities/battle.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pokemon.name, schema: PokemonSchema },
      { name: FavoritePokemon.name, schema: FavoritePokemonSchema },
      { name: Battle.name, schema: BattleSchema },
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}

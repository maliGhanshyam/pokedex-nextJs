import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Pokemon, PokemonSchema } from '../entities/pokemon.entity';
import { FavoritePokemon, FavoritePokemonSchema } from '../entities/favorite-pokemon.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pokemon.name, schema: PokemonSchema },
      { name: FavoritePokemon.name, schema: FavoritePokemonSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { FavoritePokemon, FavoritePokemonSchema } from '../entities/favorite-pokemon.entity';
import { Pokemon, PokemonSchema } from '../entities/pokemon.entity';
import { GuestModule } from '../guest/guest.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FavoritePokemon.name, schema: FavoritePokemonSchema },
      { name: Pokemon.name, schema: PokemonSchema },
    ]),
    GuestModule,
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}

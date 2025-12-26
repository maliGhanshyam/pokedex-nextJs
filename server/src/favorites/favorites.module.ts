import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { FavoritePokemon } from '../entities/favorite-pokemon.entity';
import { Pokemon } from '../entities/pokemon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FavoritePokemon, Pokemon])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}


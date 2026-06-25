import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pokemon, PokemonDocument } from '../entities/pokemon.entity';
import { FavoritePokemon, FavoritePokemonDocument } from '../entities/favorite-pokemon.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Pokemon.name)
    private pokemonModel: Model<PokemonDocument>,
    @InjectModel(FavoritePokemon.name)
    private favoritesModel: Model<FavoritePokemonDocument>,
  ) {}

  async getStats() {
    const totalPokemon = await this.pokemonModel.countDocuments();
    const totalFavorites = await this.favoritesModel.countDocuments();

    const mostFavoritePokemon = await this.favoritesModel.aggregate([
      { $group: { _id: '$pokemonId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { pokemonId: '$_id', count: 1, _id: 0 } },
    ]);

    return {
      totalPokemon,
      totalFavorites,
      mostFavoritePokemon,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { FavoritePokemon } from '../entities/favorite-pokemon.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,
    @InjectRepository(FavoritePokemon)
    private favoritesRepository: Repository<FavoritePokemon>,
  ) {}

  async getStats() {
    const totalPokemon = await this.pokemonRepository.count();
    const totalFavorites = await this.favoritesRepository.count();

    const mostFavoritePokemon = await this.favoritesRepository
      .createQueryBuilder('favorite')
      .select('favorite.pokemonId', 'pokemonId')
      .addSelect('COUNT(favorite.id)', 'count')
      .groupBy('favorite.pokemonId')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalPokemon,
      totalFavorites,
      mostFavoritePokemon,
    };
  }
}


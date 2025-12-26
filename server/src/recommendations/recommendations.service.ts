import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { FavoritePokemon } from '../entities/favorite-pokemon.entity';
import { Battle } from '../entities/battle.entity';
import { PokemonDetailsDto } from '../common/dto/pokemon.dto';
import { getPokemonTypes } from '../common/utils/type-effectiveness';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,
    @InjectRepository(FavoritePokemon)
    private favoritesRepository: Repository<FavoritePokemon>,
    @InjectRepository(Battle)
    private battleRepository: Repository<Battle>,
  ) {}

  async getRecommendations(userId: string, limit = 10): Promise<PokemonDetailsDto[]> {
    // Get user's favorites
    const favorites = await this.favoritesRepository.find({
      where: { userId },
      relations: ['pokemon'],
    });

    // Get battle history
    const battles = await this.battleRepository.find({
      where: { userId },
      relations: ['pokemon1', 'pokemon2'],
      take: 20,
    });

    // Analyze preferences
    const favoriteTypes = this.extractPreferredTypes(favorites);
    const battleTypes = this.extractBattleTypes(battles);

    // Combine preferences
    const allPreferredTypes = [
      ...favoriteTypes,
      ...battleTypes,
    ];

    // Get all pokemon
    const allPokemon = await this.pokemonRepository.find({
      take: 1000,
    });

    // Score and rank pokemon
    const scored = allPokemon
      .map((pokemon) => {
        const types = getPokemonTypes(pokemon);
        const typeMatchScore = types.reduce((score, type) => {
          return score + (allPreferredTypes.includes(type) ? 10 : 0);
        }, 0);

        // Bonus for high total stats
        const totalStats = this.calculateTotalStats(pokemon);
        const statScore = Math.min(totalStats / 50, 20);

        // Penalty if already favorited
        const isFavorite = favorites.some((f) => f.pokemonId === pokemon.id);
        const favoritePenalty = isFavorite ? -50 : 0;

        return {
          pokemon,
          score: typeMatchScore + statScore + favoritePenalty,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.pokemon);

    return scored.map((p) => this.mapToPokemonDetailsDto(p));
  }

  private mapToPokemonDetailsDto(pokemon: Pokemon): PokemonDetailsDto {
    return {
      id: pokemon.id,
      name: pokemon.name,
      height: pokemon.height,
      weight: pokemon.weight,
      stats: pokemon.stats || [],
      types: pokemon.types || [],
      sprites: pokemon.sprites || {
        front_default: pokemon.sprite,
        other: {
          'official-artwork': {
            front_default: pokemon.sprite,
            front_shiny: pokemon.sprite,
          },
        },
      },
      abilities: pokemon.abilities || [],
      species: pokemon.species || { name: pokemon.name },
    };
  }

  private extractPreferredTypes(
    favorites: FavoritePokemon[],
  ): string[] {
    const typeCounts: Record<string, number> = {};

    favorites.forEach((fav) => {
      if (fav.pokemon) {
        const types = getPokemonTypes(fav.pokemon);
        types.forEach((type) => {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }
    });

    // Return top 3 types
    return Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  private extractBattleTypes(battles: Battle[]): string[] {
    const typeCounts: Record<string, number> = {};

    battles.forEach((battle) => {
      if (battle.pokemon1) {
        const types = getPokemonTypes(battle.pokemon1);
        types.forEach((type) => {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }
      if (battle.pokemon2) {
        const types = getPokemonTypes(battle.pokemon2);
        types.forEach((type) => {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }
    });

    return Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  private calculateTotalStats(pokemon: Pokemon): number {
    return pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
  }
}


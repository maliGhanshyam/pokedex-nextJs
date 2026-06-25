import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pokemon, PokemonDocument } from '../entities/pokemon.entity';
import { FavoritePokemon, FavoritePokemonDocument } from '../entities/favorite-pokemon.entity';
import { Battle, BattleDocument } from '../entities/battle.entity';
import { PokemonDetailsDto } from '../common/dto/pokemon.dto';
import { getPokemonTypes } from '../common/utils/type-effectiveness';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Pokemon.name)
    private pokemonModel: Model<PokemonDocument>,
    @InjectModel(FavoritePokemon.name)
    private favoritesModel: Model<FavoritePokemonDocument>,
    @InjectModel(Battle.name)
    private battleModel: Model<BattleDocument>,
  ) {}

  async getRecommendations(userId: string, limit = 10): Promise<PokemonDetailsDto[]> {
    const favorites = await this.favoritesModel.find({ userId }).lean().exec();

    const battles = await this.battleModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();

    const favoritePokemonIds = favorites.map((f) => f.pokemonId);
    const battlePokemonIds = battles.flatMap((b) => [b.pokemon1Id, b.pokemon2Id]);
    const relatedPokemonIds = [...new Set([...favoritePokemonIds, ...battlePokemonIds])];

    const relatedPokemon = relatedPokemonIds.length
      ? await this.pokemonModel.find({ id: { $in: relatedPokemonIds } }).lean().exec()
      : [];

    const favoriteTypes = this.extractPreferredTypes(favorites, relatedPokemon as Pokemon[]);
    const battleTypes = this.extractBattleTypes(battles, relatedPokemon as Pokemon[]);

    const allPreferredTypes = [...favoriteTypes, ...battleTypes];

    const allPokemon = await this.pokemonModel.find().limit(1000).lean().exec();

    const favoriteIdSet = new Set(favoritePokemonIds);

    const scored = allPokemon
      .map((pokemon) => {
        const types = getPokemonTypes(pokemon as Pokemon);
        const typeMatchScore = types.reduce((score, type) => {
          return score + (allPreferredTypes.includes(type) ? 10 : 0);
        }, 0);

        const totalStats = this.calculateTotalStats(pokemon as Pokemon);
        const statScore = Math.min(totalStats / 50, 20);

        const isFavorite = favoriteIdSet.has(pokemon.id);
        const favoritePenalty = isFavorite ? -50 : 0;

        return {
          pokemon,
          score: typeMatchScore + statScore + favoritePenalty,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.pokemon);

    return scored.map((p) => this.mapToPokemonDetailsDto(p as Pokemon));
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
    pokemonList: Pokemon[],
  ): string[] {
    const typeCounts: Record<string, number> = {};
    const pokemonMap = new Map(pokemonList.map((p) => [p.id, p]));

    favorites.forEach((fav) => {
      const pokemon = pokemonMap.get(fav.pokemonId);
      if (pokemon) {
        const types = getPokemonTypes(pokemon);
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

  private extractBattleTypes(battles: Battle[], pokemonList: Pokemon[]): string[] {
    const typeCounts: Record<string, number> = {};
    const pokemonMap = new Map(pokemonList.map((p) => [p.id, p]));

    battles.forEach((battle) => {
      const pokemon1 = pokemonMap.get(battle.pokemon1Id);
      const pokemon2 = pokemonMap.get(battle.pokemon2Id);

      if (pokemon1) {
        getPokemonTypes(pokemon1).forEach((type) => {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }
      if (pokemon2) {
        getPokemonTypes(pokemon2).forEach((type) => {
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

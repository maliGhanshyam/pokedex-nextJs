import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FavoritePokemon, FavoritePokemonDocument } from '../entities/favorite-pokemon.entity';
import { Pokemon, PokemonDocument } from '../entities/pokemon.entity';
import { PokemonDetailsDto } from '../common/dto/pokemon.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(FavoritePokemon.name)
    private favoritesModel: Model<FavoritePokemonDocument>,
    @InjectModel(Pokemon.name)
    private pokemonModel: Model<PokemonDocument>,
  ) {}

  async addFavorite(userId: string, pokemonId: number): Promise<void> {
    const pokemon = await this.pokemonModel.findOne({ id: pokemonId }).exec();

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with ID ${pokemonId} not found`);
    }

    const existingFavorite = await this.favoritesModel
      .findOne({ userId, pokemonId })
      .exec();

    if (existingFavorite) {
      throw new ConflictException('Pokemon is already in favorites');
    }

    await this.favoritesModel.create({ userId, pokemonId });
  }

  async removeFavorite(userId: string, pokemonId: number): Promise<void> {
    const favorite = await this.favoritesModel
      .findOne({ userId, pokemonId })
      .exec();

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoritesModel.deleteOne({ _id: favorite._id }).exec();
  }

  async getUserFavorites(userId: string): Promise<PokemonDetailsDto[]> {
    const favorites = await this.favoritesModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const pokemonIds = favorites.map((f) => f.pokemonId);
    const pokemonList = await this.pokemonModel
      .find({ id: { $in: pokemonIds } })
      .lean()
      .exec();

    const pokemonMap = new Map(pokemonList.map((p) => [p.id, p]));

    return favorites
      .map((fav) => pokemonMap.get(fav.pokemonId))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((pokemon) => this.mapToPokemonDetailsDto(pokemon as Pokemon));
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
}

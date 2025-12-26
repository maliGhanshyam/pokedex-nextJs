import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoritePokemon } from '../entities/favorite-pokemon.entity';
import { Pokemon } from '../entities/pokemon.entity';
import { User } from '../entities/user.entity';
import { PokemonDetailsDto } from '../common/dto/pokemon.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoritePokemon)
    private favoritesRepository: Repository<FavoritePokemon>,
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,
  ) {}

  async addFavorite(userId: string, pokemonId: number): Promise<void> {
    const pokemon = await this.pokemonRepository.findOne({
      where: { id: pokemonId },
    });

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with ID ${pokemonId} not found`);
    }

    const existingFavorite = await this.favoritesRepository.findOne({
      where: { userId, pokemonId },
    });

    if (existingFavorite) {
      throw new ConflictException('Pokemon is already in favorites');
    }

    const favorite = this.favoritesRepository.create({
      userId,
      pokemonId,
    });

    await this.favoritesRepository.save(favorite);
  }

  async removeFavorite(userId: string, pokemonId: number): Promise<void> {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, pokemonId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoritesRepository.remove(favorite);
  }

  async getUserFavorites(userId: string): Promise<PokemonDetailsDto[]> {
    const favorites = await this.favoritesRepository.find({
      where: { userId },
      relations: ['pokemon'],
      order: { createdAt: 'DESC' },
    });

    return favorites.map((fav) => this.mapToPokemonDetailsDto(fav.pokemon));
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


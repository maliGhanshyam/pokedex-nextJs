import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { PokemonDetailsDto } from '../common/dto/pokemon.dto';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  async getUserFavorites(
    @CurrentUser() user: User,
  ): Promise<PokemonDetailsDto[]> {
    return this.favoritesService.getUserFavorites(user.id);
  }

  @Post(':pokemonId')
  async addFavorite(
    @CurrentUser() user: User,
    @Param('pokemonId', ParseIntPipe) pokemonId: number,
  ): Promise<{ message: string }> {
    await this.favoritesService.addFavorite(user.id, pokemonId);
    return { message: 'Pokemon added to favorites' };
  }

  @Delete(':pokemonId')
  async removeFavorite(
    @CurrentUser() user: User,
    @Param('pokemonId', ParseIntPipe) pokemonId: number,
  ): Promise<{ message: string }> {
    await this.favoritesService.removeFavorite(user.id, pokemonId);
    return { message: 'Pokemon removed from favorites' };
  }
}


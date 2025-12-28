import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FavoritesService } from '../favorites/favorites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private favoritesService: FavoritesService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    const userData = await this.usersService.findOne(user.id);
    if (!userData) {
      return null;
    }

    const favorites = await this.favoritesService.getUserFavorites(user.id);

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      username: userData.username,
      createdAt: userData.createdAt,
      favorites,
    };
  }
}

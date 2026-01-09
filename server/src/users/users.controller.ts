import {
  Controller,
  Get,
  UseGuards,
  NotFoundException,
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
    try {
    const userData = await this.usersService.findOne(user.id);
    if (!userData) {
        throw new NotFoundException('User profile not found');
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
    } catch (error) {
      // Re-throw known exceptions, wrap others
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

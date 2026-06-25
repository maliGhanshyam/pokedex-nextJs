import {
  Controller,
  Get,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FavoritesService } from '../favorites/favorites.service';
import { BattleService } from '../battle/battle.service';
import { GuestService } from '../guest/guest.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private favoritesService: FavoritesService,
    private battleService: BattleService,
    private guestService: GuestService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    const userData = await this.usersService.findOne(user.id);
    if (!userData) {
      throw new NotFoundException('User profile not found');
    }

    const [favorites, battles] = await Promise.all([
      this.favoritesService.getUserFavorites(user.id),
      this.battleService.getBattleHistory(user.id, 20),
    ]);

    const profile: Record<string, unknown> = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      username: userData.username,
      isGuest: userData.isGuest ?? false,
      createdAt: userData.createdAt,
      favorites,
      battles,
    };

    if (userData.isGuest) {
      profile.usage = await this.guestService.getUsage(user.id);
    }

    return profile;
  }
}

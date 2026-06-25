import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GuestActivity, GuestActivityDocument } from './guest-activity.entity';
import { GuestAction, GUEST_ACTION_LIMIT } from './guest.constants';
import { UserDocument } from '../entities/user.entity';
import { Battle, BattleDocument } from '../entities/battle.entity';
import {
  FavoritePokemon,
  FavoritePokemonDocument,
} from '../entities/favorite-pokemon.entity';
import { User, UserDocument as UserDoc } from '../entities/user.entity';

type GuestUser = { id?: string; isGuest?: boolean };

export interface GuestUsageDto {
  battles: number;
  favorites: number;
  compares: number;
  teamAnalyzes: number;
  limit: number;
}

@Injectable()
export class GuestService {
  constructor(
    @InjectModel(GuestActivity.name)
    private activityModel: Model<GuestActivityDocument>,
    @InjectModel(Battle.name)
    private battleModel: Model<BattleDocument>,
    @InjectModel(FavoritePokemon.name)
    private favoritesModel: Model<FavoritePokemonDocument>,
    @InjectModel(User.name)
    private usersModel: Model<UserDoc>,
  ) {}

  isGuest(user: GuestUser): boolean {
    return !!user.isGuest;
  }

  async getUsage(userId: string): Promise<GuestUsageDto> {
    const [battles, favorites, compares, teamAnalyzes] = await Promise.all([
      this.countBattles(userId),
      this.favoritesModel.countDocuments({ userId }).exec(),
      this.activityModel.countDocuments({ userId, action: 'compare' }).exec(),
      this.activityModel.countDocuments({ userId, action: 'team_analyze' }).exec(),
    ]);

    return {
      battles,
      favorites,
      compares,
      teamAnalyzes,
      limit: GUEST_ACTION_LIMIT,
    };
  }

  async assertGuestCanPerform(
    user: GuestUser,
    action: GuestAction,
  ): Promise<void> {
    if (!this.isGuest(user)) return;

    const usage = await this.getUsage(user.id!);
    const counts: Record<GuestAction, number> = {
      battle: usage.battles,
      favorite: usage.favorites,
      compare: usage.compares,
      team_analyze: usage.teamAnalyzes,
    };

    if (counts[action] >= GUEST_ACTION_LIMIT) {
      throw new ForbiddenException({
        statusCode: 403,
        message: `Guest limit reached for ${action}. Sign up to continue.`,
        code: 'GUEST_LIMIT_EXCEEDED',
        action,
        limit: GUEST_ACTION_LIMIT,
      });
    }
  }

  async recordActivity(userId: string, action: GuestAction): Promise<void> {
    await this.activityModel.create({ userId, action });
  }

  async recordBattle(user: GuestUser): Promise<void> {
    if (!this.isGuest(user)) return;
    await this.assertGuestCanPerform(user, 'battle');
    await this.recordActivity(user.id!, 'battle');
  }

  private async countBattles(userId: string): Promise<number> {
    const [saved, played] = await Promise.all([
      this.battleModel.countDocuments({ userId }).exec(),
      this.activityModel.countDocuments({ userId, action: 'battle' }).exec(),
    ]);
    return Math.max(saved, played);
  }

  async wipeGuest(userId: string): Promise<void> {
    await Promise.all([
      this.battleModel.deleteMany({ userId }).exec(),
      this.favoritesModel.deleteMany({ userId }).exec(),
      this.activityModel.deleteMany({ userId }).exec(),
      this.usersModel.findByIdAndDelete(userId).exec(),
    ]);
  }
}

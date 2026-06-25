import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ForbiddenException,
} from '@nestjs/common';
import { BattleService } from './battle.service';
import { BattleRequestDto, BattleResponseDto, SaveBattleDto } from '../common/dto/battle.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { GuestService } from '../guest/guest.service';
import { GUEST_ACTION_LIMIT } from '../guest/guest.constants';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Battle, BattleDocument } from '../entities/battle.entity';

@Controller('battle')
@UseGuards(JwtAuthGuard)
export class BattleController {
  constructor(
    private battleService: BattleService,
    private guestService: GuestService,
    @InjectModel(Battle.name)
    private battleModel: Model<BattleDocument>,
  ) {}

  @Post('simulate')
  async simulateBattle(
    @CurrentUser() user: User,
    @Body() battleDto: BattleRequestDto,
  ): Promise<BattleResponseDto> {
    return this.battleService.simulateBattle(user.id, battleDto);
  }

  @Post('record')
  async recordBattle(@CurrentUser() user: User) {
    await this.guestService.recordBattle(user);
    const usage = await this.guestService.getUsage(user.id);
    return { recorded: true, usage };
  }

  @Post('save')
  async saveBattle(
    @CurrentUser() user: User,
    @Body() saveDto: SaveBattleDto,
  ): Promise<{ saved: boolean; message: string }> {
    if (user.isGuest) {
      const savedCount = await this.battleModel.countDocuments({ userId: user.id }).exec();
      if (savedCount >= GUEST_ACTION_LIMIT) {
        throw new ForbiddenException({
          statusCode: 403,
          message: 'Guest limit reached for battle. Sign up to continue.',
          code: 'GUEST_LIMIT_EXCEEDED',
          action: 'battle',
          limit: GUEST_ACTION_LIMIT,
        });
      }
    }
    await this.battleService.saveBattleResult(user.id, saveDto);
    return { saved: true, message: 'Battle saved to your history' };
  }

  @Get('history')
  async getBattleHistory(
    @CurrentUser() user: User,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.battleService.getBattleHistory(user.id, limit);
  }
}

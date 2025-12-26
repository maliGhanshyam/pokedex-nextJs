import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { BattleService } from './battle.service';
import { BattleRequestDto, BattleResponseDto } from '../common/dto/battle.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('battle')
@UseGuards(JwtAuthGuard)
export class BattleController {
  constructor(private battleService: BattleService) {}

  @Post('simulate')
  async simulateBattle(
    @CurrentUser() user: User,
    @Body() battleDto: BattleRequestDto,
  ): Promise<BattleResponseDto> {
    return this.battleService.simulateBattle(user.id, battleDto);
  }

  @Get('history')
  async getBattleHistory(
    @CurrentUser() user: User,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.battleService.getBattleHistory(user.id, limit);
  }
}


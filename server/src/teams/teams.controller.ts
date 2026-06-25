import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamEvaluateDto, TeamResponseDto } from '../common/dto/team.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { GuestService } from '../guest/guest.service';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(
    private teamsService: TeamsService,
    private guestService: GuestService,
  ) {}

  @Post('evaluate')
  async evaluateTeam(
    @CurrentUser() user: User,
    @Body() teamDto: TeamEvaluateDto,
  ): Promise<TeamResponseDto> {
    await this.guestService.assertGuestCanPerform(user, 'team_analyze');
    const result = await this.teamsService.evaluateTeam(teamDto);
    if (user.isGuest) {
      await this.guestService.recordActivity(user.id, 'team_analyze');
    }
    return result;
  }
}

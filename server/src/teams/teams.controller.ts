import { Controller, Post, Body } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamEvaluateDto, TeamResponseDto } from '../common/dto/team.dto';

@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post('evaluate')
  async evaluateTeam(@Body() teamDto: TeamEvaluateDto): Promise<TeamResponseDto> {
    return this.teamsService.evaluateTeam(teamDto);
  }
}


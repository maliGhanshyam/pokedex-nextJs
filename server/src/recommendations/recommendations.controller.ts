import { Controller, Get, UseGuards, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { PokemonDetailsDto } from '../common/dto/pokemon.dto';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Get()
  async getRecommendations(
    @CurrentUser() user: User,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PokemonDetailsDto[]> {
    return this.recommendationsService.getRecommendations(user.id, limit);
  }
}


import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CompareService } from './compare.service';
import { CompareRequestDto, CompareResponseDto } from '../common/dto/compare.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { GuestService } from '../guest/guest.service';

@Controller('compare')
@UseGuards(JwtAuthGuard)
export class CompareController {
  constructor(
    private compareService: CompareService,
    private guestService: GuestService,
  ) {}

  @Post()
  async compare(
    @CurrentUser() user: User,
    @Body() compareDto: CompareRequestDto,
  ): Promise<CompareResponseDto> {
    await this.guestService.assertGuestCanPerform(user, 'compare');
    const result = await this.compareService.comparePokemon(compareDto);
    if (user.isGuest) {
      await this.guestService.recordActivity(user.id, 'compare');
    }
    return result;
  }
}

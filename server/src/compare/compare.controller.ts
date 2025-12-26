import { Controller, Post, Body } from '@nestjs/common';
import { CompareService } from './compare.service';
import { CompareRequestDto, CompareResponseDto } from '../common/dto/compare.dto';

@Controller('compare')
export class CompareController {
  constructor(private compareService: CompareService) {}

  @Post()
  async compare(@Body() compareDto: CompareRequestDto): Promise<CompareResponseDto> {
    return this.compareService.comparePokemon(compareDto);
  }
}


import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import {
  PokemonListResponseDto,
  PokemonDetailsDto,
  PaginationQueryDto,
} from '../common/dto/pokemon.dto';

@Controller('pokemon')
export class PokemonController {
  constructor(private pokemonService: PokemonService) {}

  @Get()
  async findAll(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ): Promise<PokemonListResponseDto> {
    return this.pokemonService.findAll({ limit, offset });
  }

  @Get('types')
  async findAllTypes(): Promise<string[]> {
    return this.pokemonService.findAllTypes();
  }

  @Get(':name')
  async findOne(@Param('name') name: string): Promise<PokemonDetailsDto> {
    return this.pokemonService.findOne(name);
  }
}


import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Header,
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
  @Header('Cache-Control', 'public, max-age=300') // Cache for 5 minutes
  async findAll(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ): Promise<PokemonListResponseDto> {
    // Limit max page size to prevent large queries
    const maxLimit = 100;
    const safeLimit = Math.min(limit || 20, maxLimit);
    return this.pokemonService.findAll({ limit: safeLimit, offset: offset || 0 });
  }

  @Get('count')
  @Header('Cache-Control', 'no-store')
  async getCount(): Promise<{ count: number }> {
    const count = await this.pokemonService.getCount();
    return { count };
  }

  @Get('types')
  @Header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour (types don't change often)
  async findAllTypes(): Promise<string[]> {
    return this.pokemonService.findAllTypes();
  }

  @Get(':name')
  @Header('Cache-Control', 'public, max-age=1800') // Cache for 30 minutes
  async findOne(@Param('name') name: string): Promise<PokemonDetailsDto> {
    return this.pokemonService.findOne(name);
  }
}


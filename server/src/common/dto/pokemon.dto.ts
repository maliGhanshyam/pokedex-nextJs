import { IsString, IsInt, IsArray, IsObject, ValidateNested, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PokemonStatDto {
  @IsInt()
  base_stat: number;

  @IsInt()
  effort: number;

  @IsObject()
  stat: { name: string };
}

export class PokemonTypeDto {
  @IsObject()
  type: { name: string };
}

export class PokemonSpritesDto {
  front_default: string;
  other: {
    ['official-artwork']: {
      front_default: string;
      front_shiny: string;
    };
  };
}

export class PokemonDetailsDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PokemonSpritesDto)
  sprites: PokemonSpritesDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PokemonTypeDto)
  types: PokemonTypeDto[];

  @IsInt()
  height: number;

  @IsInt()
  weight: number;

  @IsArray()
  @IsOptional()
  abilities?: { ability: { name: string } }[];

  @IsObject()
  @IsOptional()
  species?: { name: string };

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PokemonStatDto)
  stats: PokemonStatDto[];
}

export class PokemonListResultDto {
  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsString()
  id: string;

  @IsString()
  image: string;

  @IsString()
  imageOfficial: string;
}

export class PokemonListResponseDto {
  @IsInt()
  count: number;

  @IsString()
  @IsOptional()
  next?: string;

  @IsString()
  @IsOptional()
  previous?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PokemonListResultDto)
  results: PokemonListResultDto[];
}

export class PaginationQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;
}


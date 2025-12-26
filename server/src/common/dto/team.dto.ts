import { IsArray, IsInt, Min, Max, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class TeamEvaluateDto {
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(6)
  @IsInt({ each: true })
  pokemonIds: number[];
}

export class TeamResponseDto {
  team: {
    id: number;
    name: string;
    types: string[];
  }[];
  typeCoverage: {
    covered: string[];
    missing: string[];
    coverageScore: number;
  };
  weaknesses: {
    type: string;
    weakPokemon: string[];
    count: number;
  }[];
  strengths: {
    type: string;
    strongPokemon: string[];
    count: number;
  }[];
  overallScore: number;
  recommendations: string[];
}


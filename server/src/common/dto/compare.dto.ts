import { IsInt, IsNotEmpty } from 'class-validator';

export class CompareRequestDto {
  @IsInt()
  @IsNotEmpty()
  pokemon1Id: number;

  @IsInt()
  @IsNotEmpty()
  pokemon2Id: number;
}

export class CompareResponseDto {
  pokemon1: {
    id: number;
    name: string;
    totalStats: number;
    stats: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
    };
    types: string[];
  };
  pokemon2: {
    id: number;
    name: string;
    totalStats: number;
    stats: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
    };
    types: string[];
  };
  strengths: {
    pokemon1Advantages: string[];
    pokemon2Advantages: string[];
  };
  weaknesses: {
    pokemon1Weaknesses: string[];
    pokemon2Weaknesses: string[];
  };
  winProbability: {
    pokemon1: number;
    pokemon2: number;
  };
}


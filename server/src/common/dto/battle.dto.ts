import { IsInt, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BattleRequestDto {
  @IsInt()
  @IsNotEmpty()
  pokemon1Id: number;

  @IsInt()
  @IsNotEmpty()
  pokemon2Id: number;
}

export class BattleLogEntryDto {
  turn: number;
  attacker: string;
  defender: string;
  move: string;
  damage: number;
  typeMultiplier: number;
  attackerHp: number;
  defenderHp: number;
}

export class BattleResponseDto {
  winnerId: number;
  winnerName: string;
  loserId: number;
  loserName: string;
  turns: number;
  battleLog: BattleLogEntryDto[];
  pokemon1Stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  pokemon2Stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
}


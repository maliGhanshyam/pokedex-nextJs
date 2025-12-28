import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Battle } from '../entities/battle.entity';
import { Pokemon } from '../entities/pokemon.entity';
import { BattleRequestDto, BattleResponseDto, BattleLogEntryDto } from '../common/dto/battle.dto';
import {
  getTypeEffectiveness,
  getPokemonTypes,
  calculateDamage,
} from '../common/utils/type-effectiveness';

@Injectable()
export class BattleService {
  constructor(
    @InjectRepository(Battle)
    private battleRepository: Repository<Battle>,
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,
  ) {}

  async simulateBattle(
    userId: string,
    battleDto: BattleRequestDto,
  ): Promise<BattleResponseDto> {
    try {
      const pokemon1 = await this.pokemonRepository.findOne({
        where: { id: battleDto.pokemon1Id },
      });
      const pokemon2 = await this.pokemonRepository.findOne({
        where: { id: battleDto.pokemon2Id },
      });

      if (!pokemon1) {
        throw new NotFoundException(`Pokémon with ID ${battleDto.pokemon1Id} not found`);
      }
      
      if (!pokemon2) {
        throw new NotFoundException(`Pokémon with ID ${battleDto.pokemon2Id} not found`);
      }

    const stats1 = this.extractStats(pokemon1);
    const stats2 = this.extractStats(pokemon2);
    const types1 = getPokemonTypes(pokemon1);
    const types2 = getPokemonTypes(pokemon2);

    let hp1 = stats1.hp;
    let hp2 = stats2.hp;
    const battleLog: BattleLogEntryDto[] = [];
    let turn = 0;
    let currentAttacker = stats1.speed >= stats2.speed ? 1 : 2;

    while (hp1 > 0 && hp2 > 0 && turn < 50) {
      turn++;
      const attacker = currentAttacker === 1 ? pokemon1 : pokemon2;
      const defender = currentAttacker === 1 ? pokemon2 : pokemon1;
      const attackerStats = currentAttacker === 1 ? stats1 : stats2;
      const defenderStats = currentAttacker === 1 ? stats2 : stats1;
      const attackerTypes = currentAttacker === 1 ? types1 : types2;
      const defenderTypes = currentAttacker === 1 ? types2 : types1;
      let attackerHp = currentAttacker === 1 ? hp1 : hp2;
      let defenderHp = currentAttacker === 1 ? hp2 : hp1;

      // Determine attack type (use first type of attacker)
      const attackType = attackerTypes[0];
      const typeMultiplier = getTypeEffectiveness(attackType, defenderTypes);

      // Calculate damage
      const damage = calculateDamage(
        attackerStats.attack,
        defenderStats.defense,
        typeMultiplier,
      );

      defenderHp = Math.max(0, defenderHp - damage);

      if (currentAttacker === 1) {
        hp2 = defenderHp;
      } else {
        hp1 = defenderHp;
      }

      battleLog.push({
        turn,
        attacker: attacker.name,
        defender: defender.name,
        move: `${attackType} attack`,
        damage,
        typeMultiplier,
        attackerHp: currentAttacker === 1 ? hp1 : hp2,
        defenderHp,
      });

      // Switch attacker
      currentAttacker = currentAttacker === 1 ? 2 : 1;
    }

    const winner = hp1 > 0 ? pokemon1 : pokemon2;
    const loser = hp1 > 0 ? pokemon2 : pokemon1;

      // Save battle to database
      try {
        await this.battleRepository.save({
          userId,
          pokemon1Id: pokemon1.id,
          pokemon2Id: pokemon2.id,
          winnerId: winner.id,
          battleLog,
          turns: turn,
        });
      } catch (dbError) {
        // Log database error but don't fail the battle simulation
        console.error('Failed to save battle to database:', dbError);
      }

      return {
        winnerId: winner.id,
        winnerName: winner.name,
        loserId: loser.id,
        loserName: loser.name,
        turns: turn,
        battleLog,
        pokemon1Stats: stats1,
        pokemon2Stats: stats2,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Re-throw as a more user-friendly error
      throw new Error(`Failed to simulate battle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractStats(pokemon: Pokemon) {
    const statsMap: Record<string, number> = {};
    pokemon.stats.forEach((stat) => {
      const statName = stat.stat.name.toLowerCase().replace('-', '');
      statsMap[statName] = stat.base_stat;
    });

    return {
      hp: statsMap.hp || 100,
      attack: statsMap.attack || 50,
      defense: statsMap.defense || 50,
      speed: statsMap.speed || 50,
    };
  }

  async getBattleHistory(userId: string, limit = 10) {
    try {
      return await this.battleRepository.find({
        where: { userId },
        relations: ['pokemon1', 'pokemon2', 'winner'],
        order: { createdAt: 'DESC' },
        take: limit,
      });
    } catch (error) {
      throw new Error(`Failed to retrieve battle history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Battle, BattleDocument } from '../entities/battle.entity';
import { Pokemon, PokemonDocument } from '../entities/pokemon.entity';
import { BattleRequestDto, BattleResponseDto, BattleLogEntryDto } from '../common/dto/battle.dto';
import {
  getTypeEffectiveness,
  getPokemonTypes,
  calculateDamage,
} from '../common/utils/type-effectiveness';

@Injectable()
export class BattleService {
  constructor(
    @InjectModel(Battle.name)
    private battleModel: Model<BattleDocument>,
    @InjectModel(Pokemon.name)
    private pokemonModel: Model<PokemonDocument>,
  ) {}

  async simulateBattle(
    userId: string,
    battleDto: BattleRequestDto,
  ): Promise<BattleResponseDto> {
    try {
      const pokemon1 = await this.pokemonModel.findOne({ id: battleDto.pokemon1Id }).lean().exec();
      const pokemon2 = await this.pokemonModel.findOne({ id: battleDto.pokemon2Id }).lean().exec();

      if (!pokemon1) {
        throw new NotFoundException(`Pokémon with ID ${battleDto.pokemon1Id} not found`);
      }

      if (!pokemon2) {
        throw new NotFoundException(`Pokémon with ID ${battleDto.pokemon2Id} not found`);
      }

      const stats1 = this.extractStats(pokemon1 as Pokemon);
      const stats2 = this.extractStats(pokemon2 as Pokemon);
      const types1 = getPokemonTypes(pokemon1 as Pokemon);
      const types2 = getPokemonTypes(pokemon2 as Pokemon);

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
        let defenderHp = currentAttacker === 1 ? hp2 : hp1;

        const attackType = attackerTypes[0];
        const typeMultiplier = getTypeEffectiveness(attackType, defenderTypes);

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

        currentAttacker = currentAttacker === 1 ? 2 : 1;
      }

      const winner = hp1 > 0 ? pokemon1 : pokemon2;
      const loser = hp1 > 0 ? pokemon2 : pokemon1;

      try {
        await this.battleModel.create({
          userId,
          pokemon1Id: pokemon1.id,
          pokemon2Id: pokemon2.id,
          winnerId: winner.id,
          battleLog,
          turns: turn,
        });
      } catch (dbError) {
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
      const battles = await this.battleModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      const pokemonIds = new Set<number>();
      battles.forEach((b) => {
        pokemonIds.add(b.pokemon1Id);
        pokemonIds.add(b.pokemon2Id);
        pokemonIds.add(b.winnerId);
      });

      const pokemonList = await this.pokemonModel
        .find({ id: { $in: Array.from(pokemonIds) } })
        .lean()
        .exec();

      const pokemonMap = new Map(pokemonList.map((p) => [p.id, p]));

      return battles.map((battle) => ({
        ...battle,
        pokemon1: pokemonMap.get(battle.pokemon1Id) || null,
        pokemon2: pokemonMap.get(battle.pokemon2Id) || null,
        winner: pokemonMap.get(battle.winnerId) || null,
      }));
    } catch (error) {
      throw new Error(`Failed to retrieve battle history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

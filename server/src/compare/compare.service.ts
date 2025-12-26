import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import {
  CompareRequestDto,
  CompareResponseDto,
} from '../common/dto/compare.dto';
import {
  getTypeEffectiveness,
  getPokemonTypes,
} from '../common/utils/type-effectiveness';

@Injectable()
export class CompareService {
  constructor(
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,
  ) {}

  async comparePokemon(
    compareDto: CompareRequestDto,
  ): Promise<CompareResponseDto> {
    const pokemon1 = await this.pokemonRepository.findOne({
      where: { id: compareDto.pokemon1Id },
    });
    const pokemon2 = await this.pokemonRepository.findOne({
      where: { id: compareDto.pokemon2Id },
    });

    if (!pokemon1 || !pokemon2) {
      throw new NotFoundException('One or both Pokémon not found');
    }

    const stats1 = this.extractStats(pokemon1);
    const stats2 = this.extractStats(pokemon2);
    const types1 = getPokemonTypes(pokemon1);
    const types2 = getPokemonTypes(pokemon2);

    const totalStats1 = stats1.hp + stats1.attack + stats1.defense + stats1.speed;
    const totalStats2 = stats2.hp + stats2.attack + stats2.defense + stats2.speed;

    // Calculate type advantages
    const pokemon1Advantages = this.getAdvantages(types1, types2);
    const pokemon2Advantages = this.getAdvantages(types2, types1);
    const pokemon1Weaknesses = this.getWeaknesses(types1, types2);
    const pokemon2Weaknesses = this.getWeaknesses(types2, types1);

    // Calculate win probability (simplified)
    const winProbability1 = this.calculateWinProbability(
      stats1,
      stats2,
      types1,
      types2,
    );
    const winProbability2 = 100 - winProbability1;

    return {
      pokemon1: {
        id: pokemon1.id,
        name: pokemon1.name,
        totalStats: totalStats1,
        stats: stats1,
        types: types1,
      },
      pokemon2: {
        id: pokemon2.id,
        name: pokemon2.name,
        totalStats: totalStats2,
        stats: stats2,
        types: types2,
      },
      strengths: {
        pokemon1Advantages,
        pokemon2Advantages,
      },
      weaknesses: {
        pokemon1Weaknesses,
        pokemon2Weaknesses,
      },
      winProbability: {
        pokemon1: winProbability1,
        pokemon2: winProbability2,
      },
    };
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

  private getAdvantages(
    attackerTypes: string[],
    defenderTypes: string[],
  ): string[] {
    const advantages: string[] = [];
    for (const attackType of attackerTypes) {
      for (const defenseType of defenderTypes) {
        const multiplier = getTypeEffectiveness(attackType, [defenseType]);
        if (multiplier > 1) {
          advantages.push(`${attackType} > ${defenseType}`);
        }
      }
    }
    return [...new Set(advantages)];
  }

  private getWeaknesses(
    defenderTypes: string[],
    attackerTypes: string[],
  ): string[] {
    const weaknesses: string[] = [];
    for (const attackType of attackerTypes) {
      for (const defenseType of defenderTypes) {
        const multiplier = getTypeEffectiveness(attackType, [defenseType]);
        if (multiplier > 1) {
          weaknesses.push(`${defenseType} weak to ${attackType}`);
        }
      }
    }
    return [...new Set(weaknesses)];
  }

  private calculateWinProbability(
    stats1: { hp: number; attack: number; defense: number; speed: number },
    stats2: { hp: number; attack: number; defense: number; speed: number },
    types1: string[],
    types2: string[],
  ): number {
    // Simplified win probability calculation
    const totalStats1 = stats1.hp + stats1.attack + stats1.defense + stats1.speed;
    const totalStats2 = stats2.hp + stats2.attack + stats2.defense + stats2.speed;

    // Type advantage bonus
    let typeBonus1 = 0;
    for (const type1 of types1) {
      const multiplier = getTypeEffectiveness(type1, types2);
      if (multiplier > 1) typeBonus1 += (multiplier - 1) * 10;
    }

    let typeBonus2 = 0;
    for (const type2 of types2) {
      const multiplier = getTypeEffectiveness(type2, types1);
      if (multiplier > 1) typeBonus2 += (multiplier - 1) * 10;
    }

    const score1 = totalStats1 + typeBonus1;
    const score2 = totalStats2 + typeBonus2;
    const totalScore = score1 + score2;

    return Math.round((score1 / totalScore) * 100);
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pokemon } from '../entities/pokemon.entity';
import { TeamEvaluateDto, TeamResponseDto } from '../common/dto/team.dto';
import {
  getTypeEffectiveness,
  getPokemonTypes,
} from '../common/utils/type-effectiveness';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Pokemon)
    private pokemonRepository: Repository<Pokemon>,
  ) {}

  async evaluateTeam(teamDto: TeamEvaluateDto): Promise<TeamResponseDto> {
    try {
      if (!teamDto.pokemonIds || teamDto.pokemonIds.length === 0) {
        throw new NotFoundException('No Pokémon IDs provided');
      }

      const pokemonList = await Promise.all(
        teamDto.pokemonIds.map((id) =>
          this.pokemonRepository.findOne({ where: { id } }),
        ),
      );

      const missingIndices: number[] = [];
      pokemonList.forEach((p, index) => {
        if (!p) {
          missingIndices.push(teamDto.pokemonIds[index]);
        }
      });

      if (missingIndices.length > 0) {
        throw new NotFoundException(
          `Pokémon with IDs ${missingIndices.join(', ')} not found`
        );
      }

    const teamData = pokemonList.map((p) => ({
      id: p!.id,
      name: p!.name,
      types: getPokemonTypes(p!),
    }));

    // Calculate type coverage
    const allTypes = new Set<string>();
    teamData.forEach((p) => {
      p.types.forEach((type) => allTypes.add(type));
    });

    const allPokemonTypes = [
      'normal', 'fire', 'water', 'electric', 'grass', 'ice',
      'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
      'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
    ];

    const covered = Array.from(allTypes);
    const missing = allPokemonTypes.filter((t) => !allTypes.has(t));
    const coverageScore = Math.round((covered.length / allPokemonTypes.length) * 100);

    // Calculate weaknesses
    const weaknesses = this.calculateWeaknesses(teamData);

    // Calculate strengths (type advantages)
    const strengths = this.calculateStrengths(teamData);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      teamData,
      coverageScore,
      weaknesses,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      missing,
      weaknesses,
      teamData,
    );

    return {
      team: teamData,
      typeCoverage: {
        covered,
        missing,
        coverageScore,
      },
      weaknesses,
      strengths,
      overallScore,
      recommendations,
    };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to evaluate team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateWeaknesses(
    team: { types: string[] }[],
  ): { type: string; weakPokemon: string[]; count: number }[] {
    const weaknessMap: Record<string, string[]> = {};

    team.forEach((pokemon) => {
      const types = pokemon.types;
      // Check which types are super effective against this pokemon's types
      for (const defenderType of types) {
        for (const attackType of [
          'normal', 'fire', 'water', 'electric', 'grass', 'ice',
          'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
          'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
        ]) {
          const multiplier = getTypeEffectiveness(attackType, [defenderType]);
          if (multiplier > 1) {
            if (!weaknessMap[attackType]) {
              weaknessMap[attackType] = [];
            }
            weaknessMap[attackType].push(`${pokemon.types.join('/')} type`);
          }
        }
      }
    });

    return Object.entries(weaknessMap)
      .map(([type, weakPokemon]) => ({
        type,
        weakPokemon: [...new Set(weakPokemon)],
        count: weakPokemon.length,
      }))
      .filter((w) => w.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  private calculateStrengths(
    team: { types: string[] }[],
  ): { type: string; strongPokemon: string[]; count: number }[] {
    const strengthMap: Record<string, string[]> = {};

    team.forEach((pokemon) => {
      const types = pokemon.types;
      types.forEach((attackType) => {
        for (const defenderType of [
          'normal', 'fire', 'water', 'electric', 'grass', 'ice',
          'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
          'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
        ]) {
          const multiplier = getTypeEffectiveness(attackType, [defenderType]);
          if (multiplier > 1) {
            if (!strengthMap[attackType]) {
              strengthMap[attackType] = [];
            }
            strengthMap[attackType].push(defenderType);
          }
        }
      });
    });

    return Object.entries(strengthMap)
      .map(([type, strongPokemon]) => ({
        type,
        strongPokemon: [...new Set(strongPokemon)],
        count: strongPokemon.length,
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateOverallScore(
    team: { types: string[] }[],
    coverageScore: number,
    weaknesses: { count: number }[],
  ): number {
    const weaknessPenalty = weaknesses.reduce((sum, w) => sum + w.count, 0) * 2;
    const coverageBonus = coverageScore * 2;
    const teamSizeBonus = team.length * 5;

    let score = 50 + coverageBonus + teamSizeBonus - weaknessPenalty;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateRecommendations(
    missing: string[],
    weaknesses: { type: string; count: number }[],
    team: { types: string[] }[],
  ): string[] {
    const recommendations: string[] = [];

    if (missing.length > 0 && missing.length <= 3) {
      recommendations.push(
        `Consider adding ${missing.slice(0, 2).join(' or ')} type Pokémon for better coverage`,
      );
    }

    const topWeakness = weaknesses[0];
    if (topWeakness && topWeakness.count >= 2) {
      recommendations.push(
        `Your team is weak to ${topWeakness.type} type. Consider adding a counter`,
      );
    }

    if (team.length < 6) {
      recommendations.push('Add more Pokémon to your team for better balance');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your team looks well-balanced!');
    }

    return recommendations;
  }
}


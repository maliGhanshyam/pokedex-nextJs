import api from './api';

export interface BattleRequest {
  pokemon1Id: number;
  pokemon2Id: number;
}

export interface BattleLogEntry {
  turn: number;
  attacker: string;
  defender: string;
  move: string;
  damage: number;
  typeMultiplier: number;
  attackerHp: number;
  defenderHp: number;
}

export interface BattleResponse {
  winnerId: number;
  winnerName: string;
  loserId: number;
  loserName: string;
  turns: number;
  battleLog: BattleLogEntry[];
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

export interface CompareRequest {
  pokemon1Id: number;
  pokemon2Id: number;
}

export interface CompareResponse {
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

export interface TeamEvaluateRequest {
  pokemonIds: number[];
}

export interface TeamResponse {
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

export const battleApi = {
  simulate: async (battle: BattleRequest): Promise<BattleResponse> => {
    const response = await api.post<BattleResponse>('/battle/simulate', battle);
    return response.data;
  },
  getHistory: async (limit = 10) => {
    const response = await api.get(`/battle/history?limit=${limit}`);
    return response.data;
  },
};

export const compareApi = {
  compare: async (compare: CompareRequest): Promise<CompareResponse> => {
    const response = await api.post<CompareResponse>('/compare', compare);
    return response.data;
  },
};

export const teamsApi = {
  evaluate: async (team: TeamEvaluateRequest): Promise<TeamResponse> => {
    const response = await api.post<TeamResponse>('/teams/evaluate', team);
    return response.data;
  },
};

export const recommendationsApi = {
  getRecommendations: async (limit = 10) => {
    const response = await api.get(`/recommendations?limit=${limit}`);
    return response.data;
  },
};


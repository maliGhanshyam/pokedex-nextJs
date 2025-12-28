import api from './api';

// Type guard for Axios errors
const isAxiosError = (error: unknown): error is { 
  response?: { status: number; data?: any; statusText?: string };
  request?: any;
  code?: string;
  message: string;
  config?: { url?: string };
} => {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
};

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

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      if (status === 400) {
        return data.message || 'Invalid request. Please check your input.';
      }
      
      if (status === 401) {
        return 'Authentication required. Please log in.';
      }
      
      if (status === 403) {
        return 'You do not have permission to perform this action.';
      }
      
      if (status === 404) {
        return data.message || 'Resource not found.';
      }
      
      if (status === 500) {
        return 'Server error. Please try again later.';
      }
      
      if (status === 502 || status === 503) {
        return 'Service temporarily unavailable. Please try again in a moment.';
      }
      
      return data.message || `Request failed with status ${status}`;
    }
    
    if (error.request) {
      return 'No response from server. Please check your connection and try again.';
    }
    
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return defaultMessage;
};

export const battleApi = {
  simulate: async (battle: BattleRequest): Promise<BattleResponse> => {
    try {
      const response = await api.post<BattleResponse>('/battle/simulate', battle);
      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to simulate battle. Please try again.');
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },
  getHistory: async (limit = 10) => {
    try {
      const response = await api.get(`/battle/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to load battle history. Please try again.');
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },
};

export const compareApi = {
  compare: async (compare: CompareRequest): Promise<CompareResponse> => {
    try {
      const response = await api.post<CompareResponse>('/compare', compare);
      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to compare Pokémon. Please try again.');
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },
};

export const teamsApi = {
  evaluate: async (team: TeamEvaluateRequest): Promise<TeamResponse> => {
    try {
      const response = await api.post<TeamResponse>('/teams/evaluate', team);
      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to evaluate team. Please try again.');
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },
};

export const recommendationsApi = {
  getRecommendations: async (limit = 10) => {
    try {
      const response = await api.get(`/recommendations?limit=${limit}`);
      return response.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to load recommendations. Please try again.');
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }
  },
};


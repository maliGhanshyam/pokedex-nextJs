import axios from "axios";
import type {
  PokemonListResponse,
  PokemonDetails,
  PokemonListResult,
} from "@/types/pokemon";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

/**
 * Fetch the list of Pokémon with optional pagination
 */
// export const getPokemonList = async (
//   limit = 20,
//   offset = 0
// ): Promise<PokemonListResponse> => {
//   try {
//     const response = await api.get<PokemonListResponse>(
//       `/pokemon?limit=${limit}&offset=${offset}`
//     );
//     return response.data;
//   } catch (err: unknown) {
//     if (err instanceof Error) {
//       console.error("Error fetching Pokémon list:", err.message);
//     } else {
//       console.error("Error fetching Pokémon list:", err);
//     }
//     throw new Error("Failed to fetch Pokémon list.");
//   }
// };

export const getPokemonList = async (
  limit = 20,
  offset = 0
): Promise<
  Omit<PokemonListResponse, "results"> & {
    results: (PokemonListResult & { id: string; image: string; imageOfficial: string })[];
  }
> => {
  try {
    const response = await api.get(
      `/pokemon?limit=${limit}&offset=${offset}`
    );

    // Backend returns the correct format
    return response.data;
  } catch (err: unknown) {
    let errorMessage = "Failed to fetch Pokémon list from backend.";
    
    if (err && typeof err === 'object' && 'code' in err) {
      const axiosError = err as { code?: string; message?: string };
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
        errorMessage = "Cannot connect to backend server. Please ensure the backend is running on http://localhost:3001";
      }
    }
    
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosError = err as { response?: { status?: number; data?: any } };
      if (axiosError.response?.status === 404) {
        errorMessage = "Pokémon data not found. Please ensure the backend sync has completed.";
      } else if (axiosError.response?.status) {
        errorMessage = `Backend returned error ${axiosError.response.status}`;
      }
    } else if (err && typeof err === 'object' && 'message' in err) {
      const errorMsg = (err as Error).message;
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Network Error')) {
        errorMessage = "Cannot connect to backend server. Please ensure the backend is running on http://localhost:3001";
      } else {
        errorMessage = errorMsg;
      }
    }
    
    console.error("Error fetching Pokémon list:", err);
    throw new Error(errorMessage);
  }
};

/**
 * Fetch types for a specific Pokémon by ID or name
 */
export const getPokemonTypes = async (
  idOrName: string
): Promise<{ type: { name: string } }[]> => {
  try {
    const response = await api.get<PokemonDetails>(`/pokemon/${idOrName}`);
    return response.data.types || [];
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error fetching types for ${idOrName}:`, err.message);
    } else {
      console.error(`Error fetching types for ${idOrName}:`, err);
    }
    return [];
  }
};

/**
 * Fetch types for multiple Pokémon in parallel
 */
export const getPokemonTypesBatch = async (
  pokemonList: (PokemonListResult & { id: string; image: string })[]
): Promise<Map<string, { type: { name: string } }[]>> => {
  try {
    const typePromises = pokemonList.map(async (pokemon) => {
      const types = await getPokemonTypes(pokemon.id);
      return { id: pokemon.id, types };
    });

    const results = await Promise.all(typePromises);
    const typesMap = new Map<string, { type: { name: string } }[]>();
    
    results.forEach(({ id, types }) => {
      typesMap.set(id, types);
    });

    return typesMap;
  } catch (err: unknown) {
    console.error("Error fetching types batch:", err);
    return new Map();
  }
};

/**
 * Fetch detailed info for a specific Pokémon by name
 */
export const getPokemonDetails = async (
  name: string
): Promise<PokemonDetails> => {
  try {
    const response = await api.get<PokemonDetails>(`/pokemon/${name}`);
    return response.data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error fetching details for ${name}:`, err.message);
    } else {
      console.error(`Error fetching details for ${name}:`, err);
    }
    throw new Error(`Failed to fetch details for Pokémon: ${name}`);
  }
};

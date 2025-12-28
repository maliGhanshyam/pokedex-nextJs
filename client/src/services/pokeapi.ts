import axios, { AxiosError } from "axios";
import type {
  PokemonListResponse,
  PokemonDetails,
  PokemonListResult,
} from "@/types/pokemon";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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
    
    // Handle axios errors properly
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        errorMessage = "Cannot connect to backend server. Please ensure the backend is running on http://localhost:3001";
      } else if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        if (status === 404) {
          errorMessage = "Pokémon data not found. Please ensure the backend sync has completed.";
        } else {
          errorMessage = `Backend returned error ${status}: ${err.response.data?.message || err.message}`;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "No response from backend server. Please ensure the backend is running on http://localhost:3001";
      } else {
        errorMessage = err.message || "An error occurred while fetching Pokémon list.";
      }
    } else if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    
    console.error("Error fetching Pokémon list:", err);
    const error = new Error(errorMessage);
    // Preserve original error for debugging
    (error as any).originalError = err;
    throw error;
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

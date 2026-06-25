import axios from "axios";
import type {
  PokemonListResponse,
  PokemonDetails,
  PokemonListResult,
} from "@/types/pokemon";

// Get API base URL from environment variable
// In production, this should be set via NEXT_PUBLIC_API_URL
// Never use localhost in production code
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin.replace(/:\d+$/, ':3001') : 'http://localhost:3001');
// Increase timeout for Render.com free tier which can take 30-60 seconds to wake up
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "60000", 10);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
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
    return response.data as Omit<PokemonListResponse, "results"> & {
      results: (PokemonListResult & { id: string; image: string; imageOfficial: string })[];
    };
  } catch (err: unknown) {
    let errorMessage = "Failed to fetch Pokémon list from backend.";
    
    // Handle axios errors properly
    const isAxiosError = (error: unknown): error is { 
      response?: { status: number; data?: any; statusText?: string };
      request?: any;
      code?: string;
      message: string;
      config?: { url?: string };
    } => {
      return typeof error === 'object' && error !== null && 'isAxiosError' in error;
    };
    
    if (isAxiosError(err) || (err && typeof err === 'object' && 'response' in err)) {
      const errCode = (err as any).code;
      if (errCode === 'ECONNREFUSED' || errCode === 'ERR_NETWORK' || errCode === 'ECONNABORTED') {
        if (errCode === 'ECONNABORTED') {
          errorMessage = `Request timed out after ${API_TIMEOUT}ms. The backend server at ${API_BASE_URL} may be starting up (Render.com free tier can take 30-60 seconds to wake up). Please try again in a moment.`;
        } else {
          errorMessage = `Cannot connect to backend server. Please ensure the backend is running on ${API_BASE_URL}`;
        }
      } else if ((err as any).response) {
        // Server responded with error status
        const response = (err as any).response;
        const status = response.status;
        
        // Handle 502 Bad Gateway (Render server down/crashing)
        if (status === 502) {
          errorMessage = "Backend server is temporarily unavailable (502 Bad Gateway). This usually means the server is starting up, crashed, or is experiencing issues. Please wait a moment and try again. Render.com free tier services can take 30-60 seconds to wake up from sleep.";
        } else if (status === 503) {
          errorMessage = "Backend server is temporarily unavailable (503 Service Unavailable). The server may be overloaded or under maintenance. Please try again in a moment.";
        } else if (status === 504) {
          errorMessage = `Request timed out (504 Gateway Timeout). The backend server at ${API_BASE_URL} took too long to respond. This may happen on Render.com free tier during cold starts. Please try again.`;
        } else if (status === 429) {
          errorMessage = "Rate limit exceeded (429). The API is temporarily rate-limited. Please wait a moment and try again. The system will automatically retry with backoff.";
        } else if (status === 404) {
          errorMessage = "Pokémon data not found. Please ensure the backend sync has completed.";
        } else if (status >= 500) {
          errorMessage = `Backend server error (${status}). The server encountered an internal error. Please try again later.`;
        } else {
          // For other 4xx errors, try to extract a meaningful message
          const responseData = response.data;
          let detailMessage = '';
          
          // Check if response is HTML (like Render's error page)
          if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE html>')) {
            detailMessage = ' (Server returned an error page)';
          } else if (responseData?.message) {
            detailMessage = `: ${responseData.message}`;
          }
          
          errorMessage = `Backend returned error ${status}${detailMessage}`;
        }
      } else if ((err as any).request) {
        // Request was made but no response received
        errorMessage = `No response from backend server. Please ensure the backend is running on ${API_BASE_URL}`;
      } else {
        errorMessage = (err as any).message || "An error occurred while fetching Pokémon list.";
      }
    } else if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    
    // Log error without the full HTML response to reduce noise
    const axiosErr = err as any;
    if (axiosErr?.response?.status === 502) {
      console.error("Error fetching Pokémon list: 502 Bad Gateway - Backend server unavailable");
    } else {
      // Only log essential error info, not the full response
      const logError = axiosErr?.response || axiosErr?.request
        ? { 
            message: axiosErr?.message || 'Unknown error', 
            status: axiosErr?.response?.status, 
            code: axiosErr?.code,
            url: axiosErr?.config?.url 
          }
        : err;
      console.error("Error fetching Pokémon list:", logError);
    }
    
    const error = new Error(errorMessage);
    // Preserve original error for debugging (but don't include large HTML responses)
    if (axiosErr?.response?.data && typeof axiosErr.response.data === 'string' && axiosErr.response.data.length > 1000) {
      (error as any).originalError = {
        message: axiosErr?.message || 'Unknown error',
        status: axiosErr.response.status,
        statusText: axiosErr.response.statusText,
        code: axiosErr?.code,
        url: axiosErr?.config?.url,
        dataPreview: 'HTML error page (truncated)'
      };
    } else {
      (error as any).originalError = err;
    }
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

/** Lightweight count poll for live pagination while background sync runs */
export const getPokemonCount = async (): Promise<number> => {
  const response = await api.get<{ count: number }>('/pokemon/count');
  return response.data.count;
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

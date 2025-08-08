import axios from "axios";
import type {
  PokemonListResponse,
  PokemonDetails,
  PokemonListResult,
} from "@/types/pokemon";

const BASE_URL = "https://pokeapi.co/api/v2";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
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
    results: (PokemonListResult & { id: string; image: string })[];
  }
> => {
  try {
    const response = await api.get<PokemonListResponse>(
      `/pokemon?limit=${limit}&offset=${offset}`
    );

    const modifiedResults = response.data.results.map((pokemon) => {
      const id = pokemon.url.split("/").filter(Boolean).pop() || "";
      const image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

      return {
        ...pokemon,
        id,
        image,
      };
    });

    return {
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
      results: modifiedResults,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error fetching Pokémon list:", err.message);
    } else {
      console.error("Error fetching Pokémon list:", err);
    }
    throw new Error("Failed to fetch Pokémon list.");
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

export interface PokemonListResult {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string;
  previous: string;
  results: PokemonListResult[];
}

export interface PokemonDetails {
  id: number;
  name: string;
  image?: string;
  imageOfficial?: string;
  sprites?: {
    front_default: string;
    other: {
      ["official-artwork"]: {
        front_default: string;
        front_shiny: string;
      };
    };
  };
  types: { type: { name: string } }[];
  height?: number;
  weight?: number;
  abilities?: { ability: { name: string } }[];
  species?: { name: string };
  stats?: {
    base_stat: number;
    effort: number;
    stat: { name: string };
  }[];
}

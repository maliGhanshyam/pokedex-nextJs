export interface PokemonPageProps {
  params: Promise<{ name: string }>;
}

export interface SearchParams {
  searchParams: Promise<{ page?: string; search?: string }>;
}

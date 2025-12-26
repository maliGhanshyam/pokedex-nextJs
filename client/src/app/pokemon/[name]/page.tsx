import PokemonCard from "@/components/PokemonCard";
import { getPokemonDetails } from "@/services/pokeapi";
import { PokemonDetails } from "@/types/pokemon";

interface PokemonPageProps {
  params: Promise<{ name: string }>;
}

export default async function PokemonPage({ params }: PokemonPageProps) {
  const { name } = await params;
  const pokemon: PokemonDetails = await getPokemonDetails(name);
  return <PokemonCard pokemon={pokemon} />;
}

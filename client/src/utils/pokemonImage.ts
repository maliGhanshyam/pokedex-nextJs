import { PokemonDetails } from '@/types/pokemon';

export function getPokemonImage(pokemon: PokemonDetails | null | undefined): string {
  if (!pokemon) return '';
  
  // If imageOfficial or image fields exist, use them
  if (pokemon.imageOfficial) return pokemon.imageOfficial;
  if (pokemon.image) return pokemon.image;
  
  // Otherwise, use sprites structure
  if (pokemon.sprites?.other?.['official-artwork']?.front_default) {
    return pokemon.sprites.other['official-artwork'].front_default;
  }
  
  if (pokemon.sprites?.front_default) {
    return pokemon.sprites.front_default;
  }
  
  return '';
}


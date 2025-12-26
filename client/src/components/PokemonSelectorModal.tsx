'use client';

import { useState, useEffect } from 'react';
import { getPokemonList, getPokemonDetails } from '@/services/pokeapi';
import { PokemonDetails } from '@/types/pokemon';
import Image from 'next/image';

interface PokemonSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pokemon: PokemonDetails) => void;
  title: string;
}

export default function PokemonSelectorModal({
  isOpen,
  onClose,
  onSelect,
  title,
}: PokemonSelectorModalProps) {
  const [pokemonList, setPokemonList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectingPokemon, setSelectingPokemon] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPokemon();
    }
  }, [isOpen]);

  const loadPokemon = async () => {
    setIsLoading(true);
    try {
      const data = await getPokemonList(200, 0);
      setPokemonList(data.results);
    } catch (error) {
      console.error('Error loading pokemon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPokemon = pokemonList.filter((pokemon) =>
    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <input
            type="text"
            placeholder="Search Pokémon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />

          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredPokemon.map((pokemon) => (
                <div
                  key={pokemon.name}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('=== POKEMON CLICKED ===', pokemon.name);
                    console.log('selectingPokemon state:', selectingPokemon);
                    console.log('onSelect function:', onSelect);
                    
                    if (selectingPokemon) {
                      console.log('Already selecting, ignoring click');
                      return;
                    }
                    
                    const handleSelection = async () => {
                      setSelectingPokemon(pokemon.name);
                      
                      try {
                        console.log('Fetching details for:', pokemon.name);
                        const fullDetails = await getPokemonDetails(pokemon.name);
                        console.log('Details fetched:', fullDetails);
                        console.log('Calling onSelect...');
                        onSelect(fullDetails);
                        console.log('onSelect called successfully');
                      } catch (error) {
                        console.error('Error in handleSelection:', error);
                        // Use basic data from the list
                        const basicPokemon: PokemonDetails = {
                          id: parseInt(pokemon.id),
                          name: pokemon.name,
                          image: pokemon.image,
                          imageOfficial: pokemon.imageOfficial,
                          types: [],
                        };
                        console.log('Using basic pokemon data:', basicPokemon);
                        onSelect(basicPokemon);
                      } finally {
                        setSelectingPokemon(null);
                      }
                    };
                    
                    handleSelection();
                  }}
                  className="bg-gray-50 hover:bg-orange-50 rounded-xl p-4 transition-all transform hover:scale-105 border border-gray-200 hover:border-orange-400 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.currentTarget.click();
                    }
                  }}
                >
                  <Image
                    src={pokemon.imageOfficial || pokemon.image}
                    alt={pokemon.name}
                    width={80}
                    height={80}
                    className="mx-auto pointer-events-none select-none"
                    draggable={false}
                    unoptimized
                  />
                  <div className="text-center mt-2 text-sm font-semibold capitalize pointer-events-none select-none">
                    {pokemon.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { compareApi, CompareResponse, CompareRequest } from '@/services/gameApi';
import { pokemonTypeStyles } from '@/utils/pokemonTypes';
import { PokemonDetails } from '@/types/pokemon';
import { getPokemonImage } from '@/utils/pokemonImage';
import Image from 'next/image';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemon1: PokemonDetails | null;
  pokemon2: PokemonDetails | null;
  onSelectPokemon1: () => void;
  onSelectPokemon2: () => void;
}

export default function CompareModal({
  isOpen,
  onClose,
  pokemon1,
  pokemon2,
  onSelectPokemon1,
  onSelectPokemon2,
}: CompareModalProps) {
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompare = async () => {
    if (!pokemon1 || !pokemon2) return;

    setIsLoading(true);
    try {
      const compareRequest: CompareRequest = {
        pokemon1Id: pokemon1.id,
        pokemon2Id: pokemon2.id,
      };
      const result = await compareApi.compare(compareRequest);
      setCompareResult(result);
    } catch (error) {
      console.error('Compare error:', error);
      alert('Failed to compare Pokémon');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
          <h2 className="text-3xl font-bold text-gray-800">⚖️ Compare Pokémon</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {!compareResult ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    pokemon1
                      ? 'border-green-500 bg-green-50'
                      : 'border-dashed border-gray-300 hover:border-orange-400'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPokemon1();
                  }}
                >
                  {pokemon1 ? (
                    <div className="text-center">
                      <Image
                        src={getPokemonImage(pokemon1)}
                        alt={pokemon1.name}
                        width={120}
                        height={120}
                        className="mx-auto"
                      />
                      <h3 className="text-xl font-bold capitalize mt-2">
                        {pokemon1.name}
                      </h3>
                      <div className="text-xs text-gray-500 mt-1">Click to change</div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">➕</div>
                      <div>Select Pokémon 1</div>
                    </div>
                  )}
                </div>

                <div
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    pokemon2
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-dashed border-gray-300 hover:border-orange-400'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPokemon2();
                  }}
                >
                  {pokemon2 ? (
                    <div className="text-center">
                      <Image
                        src={getPokemonImage(pokemon2)}
                        alt={pokemon2.name}
                        width={120}
                        height={120}
                        className="mx-auto"
                      />
                      <h3 className="text-xl font-bold capitalize mt-2">
                        {pokemon2.name}
                      </h3>
                      <div className="text-xs text-gray-500 mt-1">Click to change</div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">➕</div>
                      <div>Select Pokémon 2</div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleCompare}
                disabled={!pokemon1 || !pokemon2 || isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {isLoading ? 'Comparing...' : '⚖️ Compare'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                  <div className="text-center mb-4">
                    <Image
                      src={getPokemonImage(pokemon1)}
                      alt={compareResult.pokemon1.name}
                      width={100}
                      height={100}
                      className="mx-auto"
                    />
                    <h3 className="text-2xl font-bold capitalize mt-2">
                      {compareResult.pokemon1.name}
                    </h3>
                    <div className="flex gap-2 justify-center mt-2">
                      {compareResult.pokemon1.types.map((type) => (
                        <span
                          key={type}
                          className="px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{
                            backgroundColor: pokemonTypeStyles[type]?.bg || '#gray',
                          }}
                        >
                          {type.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>HP:</span>
                      <span className="font-bold">{compareResult.pokemon1.stats.hp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attack:</span>
                      <span className="font-bold">{compareResult.pokemon1.stats.attack}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Defense:</span>
                      <span className="font-bold">{compareResult.pokemon1.stats.defense}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span className="font-bold">{compareResult.pokemon1.stats.speed}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{compareResult.pokemon1.totalStats}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="text-center mb-4">
                    <Image
                      src={getPokemonImage(pokemon2)}
                      alt={compareResult.pokemon2.name}
                      width={100}
                      height={100}
                      className="mx-auto"
                    />
                    <h3 className="text-2xl font-bold capitalize mt-2">
                      {compareResult.pokemon2.name}
                    </h3>
                    <div className="flex gap-2 justify-center mt-2">
                      {compareResult.pokemon2.types.map((type) => (
                        <span
                          key={type}
                          className="px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{
                            backgroundColor: pokemonTypeStyles[type]?.bg || '#gray',
                          }}
                        >
                          {type.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>HP:</span>
                      <span className="font-bold">{compareResult.pokemon2.stats.hp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attack:</span>
                      <span className="font-bold">{compareResult.pokemon2.stats.attack}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Defense:</span>
                      <span className="font-bold">{compareResult.pokemon2.stats.defense}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span className="font-bold">{compareResult.pokemon2.stats.speed}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{compareResult.pokemon2.totalStats}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Win Probability */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-center">Win Probability</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold capitalize">
                        {compareResult.pokemon1.name}
                      </span>
                      <span className="font-bold">{compareResult.winProbability.pokemon1}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${compareResult.winProbability.pokemon1}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold capitalize">
                        {compareResult.pokemon2.name}
                      </span>
                      <span className="font-bold">{compareResult.winProbability.pokemon2}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${compareResult.winProbability.pokemon2}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 rounded-xl p-4">
                  <h4 className="font-bold mb-2">Strengths</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold capitalize">
                        {compareResult.pokemon1.name}:
                      </span>
                      <div className="text-sm text-gray-600 mt-1">
                        {compareResult.strengths.pokemon1Advantages.length > 0
                          ? compareResult.strengths.pokemon1Advantages.join(', ')
                          : 'None'}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold capitalize">
                        {compareResult.pokemon2.name}:
                      </span>
                      <div className="text-sm text-gray-600 mt-1">
                        {compareResult.strengths.pokemon2Advantages.length > 0
                          ? compareResult.strengths.pokemon2Advantages.join(', ')
                          : 'None'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-xl p-4">
                  <h4 className="font-bold mb-2">Weaknesses</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold capitalize">
                        {compareResult.pokemon1.name}:
                      </span>
                      <div className="text-sm text-gray-600 mt-1">
                        {compareResult.weaknesses.pokemon1Weaknesses.length > 0
                          ? compareResult.weaknesses.pokemon1Weaknesses.join(', ')
                          : 'None'}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold capitalize">
                        {compareResult.pokemon2.name}:
                      </span>
                      <div className="text-sm text-gray-600 mt-1">
                        {compareResult.weaknesses.pokemon2Weaknesses.length > 0
                          ? compareResult.weaknesses.pokemon2Weaknesses.join(', ')
                          : 'None'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCompareResult(null)}
                className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Compare Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


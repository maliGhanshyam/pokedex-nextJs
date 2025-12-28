'use client';

import { useState, useRef } from 'react';
import BattleModal from '@/components/BattleModal';
import CompareModal from '@/components/CompareModal';
import PokemonSelectorModal from '@/components/PokemonSelectorModal';
import { PokemonDetails } from '@/types/pokemon';

export default function GamesPage() {
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showPokemonSelector, setShowPokemonSelector] = useState(false);
  const [selectorTitle, setSelectorTitle] = useState('');
  const [selectorCallback, setSelectorCallback] = useState<
    ((pokemon: PokemonDetails) => void) | null
  >(null);
  const [whichModal, setWhichModal] = useState<'battle' | 'compare' | null>(null);
  const selectorCallbackRef = useRef<((pokemon: PokemonDetails) => void) | null>(null);

  const [battlePokemon1, setBattlePokemon1] = useState<PokemonDetails | null>(null);
  const [battlePokemon2, setBattlePokemon2] = useState<PokemonDetails | null>(null);
  const [comparePokemon1, setComparePokemon1] = useState<PokemonDetails | null>(null);
  const [comparePokemon2, setComparePokemon2] = useState<PokemonDetails | null>(null);

  const handleSelectBattlePokemon1 = () => {
    setSelectorTitle('Select Pokémon 1 for Battle');
    setWhichModal('battle');
    const callback = (pokemon: PokemonDetails) => {
      setBattlePokemon1(pokemon);
    };
    selectorCallbackRef.current = callback;
    setSelectorCallback(() => callback);
    // Don't close battle modal, just overlay selector on top
    setShowPokemonSelector(true);
  };

  const handleSelectBattlePokemon2 = () => {
    setSelectorTitle('Select Pokémon 2 for Battle');
    setWhichModal('battle');
    const callback = (pokemon: PokemonDetails) => {
      setBattlePokemon2(pokemon);
    };
    selectorCallbackRef.current = callback;
    setSelectorCallback(() => callback);
    // Don't close battle modal, just overlay selector on top
    setShowPokemonSelector(true);
  };

  const handleSelectComparePokemon1 = () => {
    setSelectorTitle('Select Pokémon 1 for Comparison');
    setWhichModal('compare');
    const callback = (pokemon: PokemonDetails) => {
      setComparePokemon1(pokemon);
    };
    selectorCallbackRef.current = callback;
    setSelectorCallback(() => callback);
    // Don't close compare modal, just overlay selector on top
    setShowPokemonSelector(true);
  };

  const handleSelectComparePokemon2 = () => {
    setSelectorTitle('Select Pokémon 2 for Comparison');
    setWhichModal('compare');
    const callback = (pokemon: PokemonDetails) => {
      setComparePokemon2(pokemon);
    };
    selectorCallbackRef.current = callback;
    setSelectorCallback(() => callback);
    // Don't close compare modal, just overlay selector on top
    setShowPokemonSelector(true);
  };

  const handleSelectPokemon = (pokemon: PokemonDetails) => {
    // Use the ref first as it's more reliable for callbacks
    const callback = selectorCallbackRef.current || selectorCallback;
    
    if (!callback) {
      console.error('No callback available!');
      return;
    }

    try {
      // Execute the callback to set the Pokemon
      callback(pokemon);
      
      // Clear the callback and close selector
      // The parent modal stays open, we just close the selector overlay
      selectorCallbackRef.current = null;
      setSelectorCallback(null);
      setShowPokemonSelector(false);
      setWhichModal(null);
    } catch (error) {
      console.error('Error executing callback:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
          🎮 Pokémon Games & Tools
        </h1>
        <p className="text-center text-gray-600 mb-8 sm:mb-12 text-base sm:text-lg">
          Battle, compare, and analyze your favorite Pokémon!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Battle Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8 hover:shadow-xl sm:hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="text-5xl sm:text-6xl mb-4">⚔️</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Battle Simulator</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Simulate epic battles between Pokémon with turn-based combat
              </p>
            </div>
            <button
              onClick={() => setShowBattleModal(true)}
              className="w-full bg-orange-500 text-white py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:bg-orange-600 transition-colors"
            >
              Start Battle
            </button>
          </div>

          {/* Compare Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8 hover:shadow-xl sm:hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="text-5xl sm:text-6xl mb-4">⚖️</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Compare Pokémon</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Compare stats, types, and battle probabilities between Pokémon
              </p>
            </div>
            <button
              onClick={() => setShowCompareModal(true)}
              className="w-full bg-orange-500 text-white py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:bg-orange-600 transition-colors"
            >
              Compare Now
            </button>
          </div>

          {/* Team Analyzer Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8 hover:shadow-xl sm:hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="text-5xl sm:text-6xl mb-4">👥</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Team Analyzer</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Coming Soon: Analyze your Pokémon team's strengths and weaknesses
              </p>
            </div>
            <button
              disabled
              className="w-full bg-gray-400 text-white py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          {/* Recommendations Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8 hover:shadow-xl sm:hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="text-5xl sm:text-6xl mb-4">💡</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Recommendations</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Get personalized Pokémon recommendations based on your preferences
              </p>
            </div>
            <button
              disabled
              className="w-full bg-gray-400 text-white py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      <BattleModal
        isOpen={showBattleModal}
        onClose={() => {
          setShowBattleModal(false);
          // Reset battle state when closing
          setBattlePokemon1(null);
          setBattlePokemon2(null);
        }}
        pokemon1={battlePokemon1}
        pokemon2={battlePokemon2}
        onSelectPokemon1={handleSelectBattlePokemon1}
        onSelectPokemon2={handleSelectBattlePokemon2}
      />

      <CompareModal
        isOpen={showCompareModal}
        onClose={() => {
          setShowCompareModal(false);
          // Reset compare state when closing
          setComparePokemon1(null);
          setComparePokemon2(null);
        }}
        pokemon1={comparePokemon1}
        pokemon2={comparePokemon2}
        onSelectPokemon1={handleSelectComparePokemon1}
        onSelectPokemon2={handleSelectComparePokemon2}
      />

      <PokemonSelectorModal
        isOpen={showPokemonSelector}
        onClose={() => {
          // Just close the selector, parent modal stays open
          selectorCallbackRef.current = null;
          setSelectorCallback(null);
          setShowPokemonSelector(false);
          setWhichModal(null);
        }}
        onSelect={handleSelectPokemon}
        title={selectorTitle}
      />
    </div>
  );
}


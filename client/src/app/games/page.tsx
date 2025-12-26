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
    console.log('Setting up selector for battle pokemon 1');
    setSelectorTitle('Select Pokémon 1 for Battle');
    setWhichModal('battle');
    const callback = (pokemon: PokemonDetails) => {
      console.log('Battle Pokemon 1 callback executing with:', pokemon);
      setBattlePokemon1(pokemon);
    };
    selectorCallbackRef.current = callback;
    setSelectorCallback(() => callback);
    setShowBattleModal(false);
    setTimeout(() => {
      setShowPokemonSelector(true);
    }, 0);
  };

  const handleSelectBattlePokemon2 = () => {
    console.log('Setting up selector for battle pokemon 2');
    setSelectorTitle('Select Pokémon 2 for Battle');
    setWhichModal('battle');
    const callback = (pokemon: PokemonDetails) => {
      console.log('Battle Pokemon 2 callback executing with:', pokemon);
      setBattlePokemon2(pokemon);
    };
    selectorCallbackRef.current = callback;
    setSelectorCallback(() => callback);
    setShowBattleModal(false);
    setTimeout(() => {
      setShowPokemonSelector(true);
    }, 0);
  };

  const handleSelectComparePokemon1 = () => {
    console.log('Setting up selector for compare pokemon 1');
    setSelectorTitle('Select Pokémon 1 for Comparison');
    setWhichModal('compare');
    const callback = (pokemon: PokemonDetails) => {
      console.log('Compare Pokemon 1 callback executing with:', pokemon);
      setComparePokemon1(pokemon);
    };
    selectorCallbackRef.current = callback;
    setSelectorCallback(() => callback);
    setShowCompareModal(false);
    setTimeout(() => {
      setShowPokemonSelector(true);
    }, 0);
  };

  const handleSelectComparePokemon2 = () => {
    console.log('Setting up selector for compare pokemon 2');
    setSelectorTitle('Select Pokémon 2 for Comparison');
    setWhichModal('compare');
    const callback = (pokemon: PokemonDetails) => {
      console.log('Compare Pokemon 2 callback executing with:', pokemon);
      setComparePokemon2(pokemon);
    };
    selectorCallbackRef.current = callback;
    setSelectorCallback(() => callback);
    setShowCompareModal(false);
    setTimeout(() => {
      setShowPokemonSelector(true);
    }, 0);
  };

  const handleSelectPokemon = (pokemon: PokemonDetails) => {
    console.log('=== handleSelectPokemon called ===');
    console.log('pokemon:', pokemon);
    console.log('selectorCallbackRef.current:', selectorCallbackRef.current);
    console.log('selectorCallback state:', selectorCallback);
    console.log('whichModal:', whichModal);
    
    // Use the ref first as it's more reliable for callbacks
    const callback = selectorCallbackRef.current || selectorCallback;
    
    if (!callback) {
      console.error('No callback available!');
      return;
    }

    try {
      // Execute the callback to set the Pokemon
      console.log('Executing callback with pokemon:', pokemon);
      callback(pokemon);
      console.log('Callback executed successfully');
      
      // Store which modal to reopen before clearing state
      const modalToReopen = whichModal;
      
      // Clear the callback and close selector
      selectorCallbackRef.current = null;
      setSelectorCallback(null);
      setShowPokemonSelector(false);
      setWhichModal(null);
      
      // Reopen the appropriate modal
      setTimeout(() => {
        if (modalToReopen === 'battle') {
          console.log('Reopening battle modal');
          setShowBattleModal(true);
        } else if (modalToReopen === 'compare') {
          console.log('Reopening compare modal');
          setShowCompareModal(true);
        }
      }, 100);
    } catch (error) {
      console.error('Error executing callback:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🎮 Pokémon Games & Tools
        </h1>
        <p className="text-center text-gray-600 mb-12 text-lg">
          Battle, compare, and analyze your favorite Pokémon!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Battle Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Battle Simulator</h2>
              <p className="text-gray-600">
                Simulate epic battles between Pokémon with turn-based combat
              </p>
            </div>
            <button
              onClick={() => setShowBattleModal(true)}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-red-600 hover:to-orange-600 transition-all transform hover:scale-105"
            >
              Start Battle
            </button>
          </div>

          {/* Compare Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚖️</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Compare Pokémon</h2>
              <p className="text-gray-600">
                Compare stats, types, and battle probabilities between Pokémon
              </p>
            </div>
            <button
              onClick={() => setShowCompareModal(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
            >
              Compare Now
            </button>
          </div>

          {/* Team Analyzer Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">👥</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Team Analyzer</h2>
              <p className="text-gray-600">
                Coming Soon: Analyze your Pokémon team's strengths and weaknesses
              </p>
            </div>
            <button
              disabled
              className="w-full bg-gray-400 text-white py-4 px-6 rounded-xl font-bold text-lg cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          {/* Recommendations Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💡</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Recommendations</h2>
              <p className="text-gray-600">
                Get personalized Pokémon recommendations based on your preferences
              </p>
            </div>
            <button
              disabled
              className="w-full bg-gray-400 text-white py-4 px-6 rounded-xl font-bold text-lg cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      <BattleModal
        isOpen={showBattleModal}
        onClose={() => setShowBattleModal(false)}
        pokemon1={battlePokemon1}
        pokemon2={battlePokemon2}
        onSelectPokemon1={handleSelectBattlePokemon1}
        onSelectPokemon2={handleSelectBattlePokemon2}
      />

      <CompareModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        pokemon1={comparePokemon1}
        pokemon2={comparePokemon2}
        onSelectPokemon1={handleSelectComparePokemon1}
        onSelectPokemon2={handleSelectComparePokemon2}
      />

      <PokemonSelectorModal
        isOpen={showPokemonSelector}
        onClose={() => {
          const modalType = whichModal;
          selectorCallbackRef.current = null;
          setSelectorCallback(null);
          setShowPokemonSelector(false);
          setWhichModal(null);
          // Reopen the appropriate modal if it was closed
          if (modalType === 'battle') {
            setShowBattleModal(true);
          } else if (modalType === 'compare') {
            setShowCompareModal(true);
          }
        }}
        onSelect={handleSelectPokemon}
        title={selectorTitle}
      />
    </div>
  );
}


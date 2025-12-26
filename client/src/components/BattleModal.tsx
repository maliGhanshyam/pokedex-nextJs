'use client';

import { useState, useEffect } from 'react';
import { battleApi, BattleResponse, BattleRequest } from '@/services/gameApi';
import { pokemonTypeStyles } from '@/utils/pokemonTypes';
import { PokemonDetails } from '@/types/pokemon';
import { getPokemonImage } from '@/utils/pokemonImage';
import Image from 'next/image';

interface BattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemon1: PokemonDetails | null;
  pokemon2: PokemonDetails | null;
  onSelectPokemon1: () => void;
  onSelectPokemon2: () => void;
}

export default function BattleModal({
  isOpen,
  onClose,
  pokemon1,
  pokemon2,
  onSelectPokemon1,
  onSelectPokemon2,
}: BattleModalProps) {
  const [battleResult, setBattleResult] = useState<BattleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (battleResult && currentTurn < battleResult.battleLog.length) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setCurrentTurn((prev) => prev + 1);
        setIsAnimating(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [battleResult, currentTurn]);

  const handleBattle = async () => {
    if (!pokemon1 || !pokemon2) return;

    setIsLoading(true);
    setBattleResult(null);
    setCurrentTurn(0);

    try {
      const battleRequest: BattleRequest = {
        pokemon1Id: pokemon1.id,
        pokemon2Id: pokemon2.id,
      };
      const result = await battleApi.simulate(battleRequest);
      setBattleResult(result);
    } catch (error) {
      console.error('Battle error:', error);
      alert('Failed to simulate battle');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentLog = battleResult?.battleLog.slice(0, currentTurn) || [];
  const isComplete = battleResult && currentTurn >= battleResult.battleLog.length;

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
          <h2 className="text-3xl font-bold text-gray-800">⚔️ Battle Arena</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {!battleResult ? (
            <div className="space-y-6">
              {/* Pokemon Selection */}
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

                <div className="text-4xl text-center self-center">VS</div>

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
                onClick={handleBattle}
                disabled={!pokemon1 || !pokemon2 || isLoading}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-6 rounded-xl font-bold text-lg hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {isLoading ? '⚔️ Fighting...' : '⚔️ Start Battle'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Battle Result Header */}
              <div className="text-center">
                <div
                  className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${
                    battleResult.winnerId === pokemon1?.id
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  🏆 {battleResult.winnerName} Wins!
                </div>
                <div className="text-gray-600 mt-2">
                  Battle completed in {battleResult.turns} turns
                </div>
              </div>

              {/* Battle Animation */}
              <div className="grid grid-cols-2 gap-4 relative">
                <div
                  className={`text-center p-4 rounded-xl transition-all ${
                    isAnimating && currentLog[currentLog.length - 1]?.attacker === pokemon1?.name
                      ? 'bg-red-100 scale-105'
                      : 'bg-gray-50'
                  }`}
                >
                  <Image
                    src={getPokemonImage(pokemon1)}
                    alt={pokemon1?.name || ''}
                    width={100}
                    height={100}
                    className="mx-auto"
                  />
                  <div className="mt-2">
                    <div className="text-sm font-bold capitalize">{pokemon1?.name}</div>
                    <div className="text-xs text-gray-600">
                      HP:{' '}
                      {currentLog.length > 0
                        ? currentLog[currentLog.length - 1]?.attacker === pokemon1?.name
                          ? currentLog[currentLog.length - 1]?.attackerHp
                          : currentLog[currentLog.length - 1]?.defenderHp
                        : battleResult.pokemon1Stats.hp}
                    </div>
                  </div>
                </div>

                <div
                  className={`text-center p-4 rounded-xl transition-all ${
                    isAnimating && currentLog[currentLog.length - 1]?.attacker === pokemon2?.name
                      ? 'bg-red-100 scale-105'
                      : 'bg-gray-50'
                  }`}
                >
                  <Image
                    src={getPokemonImage(pokemon2)}
                    alt={pokemon2?.name || ''}
                    width={100}
                    height={100}
                    className="mx-auto"
                  />
                  <div className="mt-2">
                    <div className="text-sm font-bold capitalize">{pokemon2?.name}</div>
                    <div className="text-xs text-gray-600">
                      HP:{' '}
                      {currentLog.length > 0
                        ? currentLog[currentLog.length - 1]?.attacker === pokemon2?.name
                          ? currentLog[currentLog.length - 1]?.attackerHp
                          : currentLog[currentLog.length - 1]?.defenderHp
                        : battleResult.pokemon2Stats.hp}
                    </div>
                  </div>
                </div>
              </div>

              {/* Battle Log */}
              <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                <h3 className="font-bold mb-2">Battle Log:</h3>
                <div className="space-y-2">
                  {currentLog.map((log, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2 rounded text-sm animate-fadeIn"
                    >
                      <span className="font-bold">Turn {log.turn}:</span>{' '}
                      <span className="capitalize">{log.attacker}</span> uses{' '}
                      <span className="font-semibold">{log.move}</span> on{' '}
                      <span className="capitalize">{log.defender}</span> -{' '}
                      <span className="text-red-600 font-bold">{log.damage} damage</span>
                      {log.typeMultiplier > 1 && (
                        <span className="text-green-600 ml-1">
                          (x{log.typeMultiplier} effective!)
                        </span>
                      )}
                    </div>
                  ))}
                  {!isComplete && (
                    <div className="text-gray-400 italic">⚔️ Battle in progress...</div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setBattleResult(null);
                    setCurrentTurn(0);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  New Battle
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { battleApi, BattleResponse, BattleRequest, BattleLogEntry } from '@/services/gameApi';
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

function getHpAtTurn(
  log: BattleLogEntry | undefined,
  p1Name: string,
  max1: number,
  max2: number,
): { hp1: number; hp2: number } {
  if (!log) return { hp1: max1, hp2: max2 };
  if (log.attacker === p1Name) {
    return { hp1: log.attackerHp, hp2: log.defenderHp };
  }
  return { hp1: log.defenderHp, hp2: log.attackerHp };
}

function HpBar({ current, max, label, align }: { current: number; max: number; label: string; align: 'left' | 'right' }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const barColor =
    pct > 50 ? 'bg-green-400' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <div className={`w-full max-w-[200px] ${align === 'right' ? 'ml-auto' : ''}`}>
      <div className={`flex items-center gap-2 mb-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <span className="text-xs font-bold uppercase tracking-wide text-white drop-shadow">{label}</span>
        <span className="text-[10px] font-mono text-white/80">{current}/{max}</span>
      </div>
      <div className="h-3 rounded-full bg-gray-900/60 border-2 border-white/30 overflow-hidden shadow-inner">
        <div
          className={`h-full ${barColor} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="absolute w-2 h-3 rounded-sm opacity-90"
          style={{
            left: `${(i * 2.5) % 100}%`,
            backgroundColor: colors[i % colors.length],
            animation: `confettiFall ${2 + (i % 5) * 0.4}s linear ${(i % 8) * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function VictoryOverlay({
  winnerImage,
  winnerName,
  turns,
  onDismiss,
}: {
  winnerImage: string;
  winnerName: string;
  turns: number;
  onDismiss: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <Confetti />
      <div className="relative text-center px-6 py-8 max-w-sm w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-4 border-amber-400/50 animate-victory-ring" />
        </div>

        <div className="relative animate-victory-pop">
          <p className="text-5xl font-black animate-victory-shine mb-2 tracking-tighter">
            VICTORY!
          </p>
          <div className="relative mx-auto w-36 h-36 mb-4 animate-pulse-glow rounded-full bg-gradient-to-b from-amber-300/30 to-transparent p-2">
            <Image
              src={winnerImage}
              alt={winnerName}
              width={140}
              height={140}
              className="mx-auto drop-shadow-2xl"
            />
          </div>
          <h3 className="text-2xl font-black capitalize text-white drop-shadow-lg mb-1">
            {winnerName}
          </h3>
          <p className="text-amber-200 text-sm mb-1">wins the battle!</p>
          <p className="text-white/60 text-xs mb-6">
            Decided in {turns} turn{turns !== 1 ? 's' : ''}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onDismiss}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 font-bold rounded-xl hover:from-amber-300 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/30"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [showVictory, setShowVictory] = useState(false);
  const [attackSide, setAttackSide] = useState<'left' | 'right' | null>(null);
  const [hitSide, setHitSide] = useState<'left' | 'right' | null>(null);
  const [damagePopup, setDamagePopup] = useState<{ side: 'left' | 'right'; amount: number; superEffective: boolean } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [battleMessage, setBattleMessage] = useState('');
  const [isLoadingPokemon1, setIsLoadingPokemon1] = useState(false);
  const [isLoadingPokemon2, setIsLoadingPokemon2] = useState(false);
  const [image1Loading, setImage1Loading] = useState(true);
  const [image2Loading, setImage2Loading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resetBattleAnim = useCallback(() => {
    setAttackSide(null);
    setHitSide(null);
    setDamagePopup(null);
    setScreenShake(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setBattleResult(null);
      setCurrentTurn(0);
      setIsLoading(false);
      setIsAnimating(false);
      setShowVictory(false);
      resetBattleAnim();
      setBattleMessage('');
      setIsLoadingPokemon1(false);
      setIsLoadingPokemon2(false);
      setImage1Loading(true);
      setImage2Loading(true);
      setError(null);
    }
  }, [isOpen, resetBattleAnim]);

  useEffect(() => {
    if (pokemon1) {
      setIsLoadingPokemon1(false);
      setImage1Loading(true);
    }
  }, [pokemon1]);

  useEffect(() => {
    if (pokemon2) {
      setIsLoadingPokemon2(false);
      setImage2Loading(true);
    }
  }, [pokemon2]);

  const currentLog = battleResult?.battleLog.slice(0, currentTurn) || [];
  const lastLog = currentLog[currentLog.length - 1];
  const isComplete = battleResult ? currentTurn >= battleResult.battleLog.length && !isAnimating : false;

  const { hp1, hp2 } = useMemo(() => {
    if (!battleResult || !pokemon1) return { hp1: 0, hp2: 0 };
    return getHpAtTurn(
      lastLog,
      pokemon1.name,
      battleResult.pokemon1Stats.hp,
      battleResult.pokemon2Stats.hp,
    );
  }, [battleResult, lastLog, pokemon1]);

  useEffect(() => {
    if (!battleResult || !pokemon1) return;

    if (currentTurn >= battleResult.battleLog.length) {
      if (!showVictory) {
        const timer = setTimeout(() => setShowVictory(true), 400);
        return () => clearTimeout(timer);
      }
      return;
    }

    const log = battleResult.battleLog[currentTurn];
    const p1IsAttacker = log.attacker === pokemon1.name;
    const attackerSide = p1IsAttacker ? 'left' : 'right';
    const defenderSide = p1IsAttacker ? 'right' : 'left';

    setBattleMessage(
      log.typeMultiplier > 1
        ? `It's super effective! ${log.damage} damage!`
        : log.typeMultiplier < 1 && log.typeMultiplier > 0
          ? `Not very effective… ${log.damage} damage.`
          : `${log.move}! ${log.damage} damage!`,
    );

    setIsAnimating(true);
    resetBattleAnim();

    const t1 = setTimeout(() => setAttackSide(attackerSide), 50);
    const t2 = setTimeout(() => {
      setHitSide(defenderSide);
      setDamagePopup({ side: defenderSide, amount: log.damage, superEffective: log.typeMultiplier > 1 });
      if (log.typeMultiplier > 1) setScreenShake(true);
    }, 300);
    const t3 = setTimeout(() => {
      setCurrentTurn((prev) => prev + 1);
      resetBattleAnim();
      setIsAnimating(false);
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [battleResult, currentTurn, pokemon1, showVictory, resetBattleAnim]);

  const handleBattle = async () => {
    if (!pokemon1 || !pokemon2) return;

    setIsLoading(true);
    setBattleResult(null);
    setCurrentTurn(0);
    setShowVictory(false);
    setError(null);
    setBattleMessage(`${pokemon1.name} vs ${pokemon2.name} — Fight!`);

    try {
      const result = await battleApi.simulate({
        pokemon1Id: pokemon1.id,
        pokemon2Id: pokemon2.id,
      });
      setBattleResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to simulate battle.');
    } finally {
      setIsLoading(false);
    }
  };

  const winnerImage =
    battleResult && pokemon1 && pokemon2
      ? getPokemonImage(battleResult.winnerId === pokemon1.id ? pokemon1 : pokemon2)
      : '';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 modal-overlay-enter"
      onClick={onClose}
    >
      <div
        className={`relative bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden border-4 border-gray-700 modal-content-enter ${screenShake ? 'animate-battle-shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative z-10 flex justify-between items-center px-5 py-3 bg-gradient-to-r from-red-900 via-gray-900 to-blue-900 border-b border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/80">Pokémon Arena</p>
            <h2 className="text-xl sm:text-2xl font-black text-white">Battle Simulator</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 text-xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline text-xs">Dismiss</button>
          </div>
        )}

        {!battleResult ? (
          /* ── Fighter selection ── */
          <div className="p-5 sm:p-8">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-green-900 p-6 sm:p-10 mb-6">
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-green-700/80 to-transparent" />
              <div className="relative grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                {/* Fighter 1 */}
                <button
                  type="button"
                  onClick={() => { setIsLoadingPokemon1(true); onSelectPokemon1(); }}
                  className={`relative rounded-xl p-4 transition-all ${
                    pokemon1
                      ? 'bg-red-500/20 border-2 border-red-400 ring-2 ring-red-400/30'
                      : 'bg-white/5 border-2 border-dashed border-white/30 hover:border-amber-400'
                  }`}
                >
                  {isLoadingPokemon1 ? (
                    <div className="h-28 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-amber-400 animate-spin" />
                    </div>
                  ) : pokemon1 ? (
                    <>
                      <Image src={getPokemonImage(pokemon1)} alt={pokemon1.name} width={100} height={100} className="mx-auto drop-shadow-lg" />
                      <p className="text-white font-bold capitalize mt-2 text-center">{pokemon1.name}</p>
                    </>
                  ) : (
                    <div className="h-28 flex flex-col items-center justify-center text-white/50">
                      <span className="text-3xl mb-1">+</span>
                      <span className="text-xs">Choose fighter</span>
                    </div>
                  )}
                </button>

                <div className="text-center px-2">
                  <span className="text-3xl sm:text-5xl font-black text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">VS</span>
                </div>

                {/* Fighter 2 */}
                <button
                  type="button"
                  onClick={() => { setIsLoadingPokemon2(true); onSelectPokemon2(); }}
                  className={`relative rounded-xl p-4 transition-all ${
                    pokemon2
                      ? 'bg-blue-500/20 border-2 border-blue-400 ring-2 ring-blue-400/30'
                      : 'bg-white/5 border-2 border-dashed border-white/30 hover:border-amber-400'
                  }`}
                >
                  {isLoadingPokemon2 ? (
                    <div className="h-28 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-amber-400 animate-spin" />
                    </div>
                  ) : pokemon2 ? (
                    <>
                      <Image src={getPokemonImage(pokemon2)} alt={pokemon2.name} width={100} height={100} className="mx-auto drop-shadow-lg scale-x-[-1]" />
                      <p className="text-white font-bold capitalize mt-2 text-center">{pokemon2.name}</p>
                    </>
                  ) : (
                    <div className="h-28 flex flex-col items-center justify-center text-white/50">
                      <span className="text-3xl mb-1">+</span>
                      <span className="text-xs">Choose fighter</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleBattle}
              disabled={!pokemon1 || !pokemon2 || isLoading}
              className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entering arena…
                </span>
              ) : (
                'Begin Battle'
              )}
            </button>
          </div>
        ) : (
          /* ── Battle arena ── */
          <div className="relative">
            <div className="relative min-h-[420px] sm:min-h-[480px] bg-gradient-to-b from-sky-400 via-sky-300 to-green-600 overflow-hidden">
              {/* Clouds */}
              <div className="absolute top-4 left-8 w-20 h-8 bg-white/40 rounded-full blur-sm" />
              <div className="absolute top-8 right-12 w-28 h-10 bg-white/30 rounded-full blur-sm" />

              {/* Arena floor */}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-green-700 via-green-600 to-green-500/0" />
              <div className="absolute inset-x-4 bottom-8 h-24 rounded-[50%] bg-green-800/30 blur-xl" />

              {/* Opponent (top right) */}
              <div className="absolute top-6 right-4 sm:right-8 z-10">
                <HpBar
                  current={hp2}
                  max={battleResult.pokemon2Stats.hp}
                  label={pokemon2?.name || ''}
                  align="right"
                />
              </div>

              <div
                className={`absolute top-16 right-6 sm:right-16 transition-transform ${
                  attackSide === 'right' ? 'animate-battle-lunge-right' : ''
                } ${hitSide === 'right' ? 'animate-battle-hit' : ''}`}
              >
                {damagePopup?.side === 'right' && (
                  <span
                    className={`absolute -top-6 left-1/2 -translate-x-1/2 font-black text-2xl animate-damage-float ${
                      damagePopup.superEffective ? 'text-yellow-300' : 'text-white'
                    } drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
                  >
                    -{damagePopup.amount}
                  </span>
                )}
                <Image
                  src={getPokemonImage(pokemon2!)}
                  alt={pokemon2?.name || ''}
                  width={120}
                  height={120}
                  className="drop-shadow-2xl scale-x-[-1]"
                />
              </div>

              {/* Player (bottom left) */}
              <div className="absolute bottom-20 left-4 sm:left-8 z-10">
                <HpBar
                  current={hp1}
                  max={battleResult.pokemon1Stats.hp}
                  label={pokemon1?.name || ''}
                  align="left"
                />
              </div>

              <div
                className={`absolute bottom-8 left-8 sm:left-16 ${
                  attackSide === 'left' ? 'animate-battle-lunge-left' : ''
                } ${hitSide === 'left' ? 'animate-battle-hit' : ''}`}
              >
                {damagePopup?.side === 'left' && (
                  <span
                    className={`absolute -top-6 left-1/2 -translate-x-1/2 font-black text-2xl animate-damage-float ${
                      damagePopup.superEffective ? 'text-yellow-300' : 'text-white'
                    } drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
                  >
                    -{damagePopup.amount}
                  </span>
                )}
                <Image
                  src={getPokemonImage(pokemon1!)}
                  alt={pokemon1?.name || ''}
                  width={140}
                  height={140}
                  className="drop-shadow-2xl"
                />
              </div>

              {/* Turn indicator */}
              {!isComplete && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  {isAnimating && (
                    <span className="text-4xl font-black text-white/20 animate-pulse">⚡</span>
                  )}
                </div>
              )}
            </div>

            {/* Message box (game-style) */}
            <div className="bg-gray-900 border-t-4 border-gray-700 p-4">
              <div className="bg-gray-800 rounded-xl border-2 border-gray-600 p-4 min-h-[72px] flex items-center">
                <p className="text-white font-medium capitalize animate-fadeIn">
                  {isComplete && !showVictory
                    ? `${battleResult.winnerName} wins!`
                    : battleMessage || '…'}
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setBattleResult(null);
                    setCurrentTurn(0);
                    setShowVictory(false);
                    resetBattleAnim();
                    setBattleMessage('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors"
                >
                  Rematch
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:brightness-110 transition-all"
                >
                  Exit Arena
                </button>
              </div>
            </div>

            {showVictory && (
              <VictoryOverlay
                winnerImage={winnerImage}
                winnerName={battleResult.winnerName}
                turns={battleResult.turns}
                onDismiss={() => setShowVictory(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

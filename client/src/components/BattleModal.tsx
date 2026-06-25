'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PokemonDetails } from '@/types/pokemon';
import { getPokemonImage } from '@/utils/pokemonImage';
import InteractiveBattleArena from '@/components/battle/InteractiveBattleArena';
import { battleTheme } from '@/components/battle/battleTheme';
import { battleApi, BattleEndResult } from '@/services/gameApi';

interface BattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemon1: PokemonDetails | null;
  pokemon2: PokemonDetails | null;
  onSelectPokemon1: () => void;
  onSelectPokemon2: () => void;
}

function Confetti() {
  const colors = [battleTheme.oasis, battleTheme.peachFuzz, battleTheme.classicBlue, battleTheme.livingCoral, battleTheme.buttercream];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 36 }).map((_, i) => (
        <span
          key={i}
          className="absolute w-2 h-3 rounded-sm"
          style={{
            left: `${(i * 2.8) % 100}%`,
            backgroundColor: colors[i % colors.length],
            animation: `confettiFall ${2 + (i % 4) * 0.35}s linear ${(i % 6) * 0.12}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

type SaveChoice = 'pending' | 'saved' | 'skipped';

function VictoryOverlay({
  winnerImage,
  result,
  saveChoice,
  isSaving,
  saveError,
  onSave,
  onSkipSave,
  onDismiss,
}: {
  winnerImage: string;
  result: BattleEndResult;
  saveChoice: SaveChoice;
  isSaving: boolean;
  saveError: string | null;
  onSave: () => void;
  onSkipSave: () => void;
  onDismiss: () => void;
}) {
  const canContinue = saveChoice !== 'pending';

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center animate-fadeIn"
      style={{ backgroundColor: `${battleTheme.navy}dd` }}
    >
      <Confetti />
      <div className="relative text-center px-6 py-8 max-w-sm w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-48 h-48 rounded-full border-4 animate-victory-ring"
            style={{ borderColor: `${battleTheme.oasis}88` }}
          />
        </div>
        <div className="relative animate-victory-pop">
          <p className="text-4xl sm:text-5xl font-black mb-3 tracking-tight" style={{ color: battleTheme.peachFuzz }}>
            VICTORY
          </p>
          <div
            className="relative mx-auto w-32 h-32 mb-4 rounded-full p-2 animate-pulse-glow"
            style={{ background: `linear-gradient(180deg, ${battleTheme.oasis}44, transparent)` }}
          >
            <Image src={winnerImage} alt={result.winnerName} width={120} height={120} className="mx-auto drop-shadow-xl" />
          </div>
          <h3 className="text-2xl font-bold capitalize mb-1" style={{ color: battleTheme.buttercream }}>
            {result.winnerName}
          </h3>
          <p className="text-sm mb-4" style={{ color: `${battleTheme.mist}bb` }}>
            {result.hits} collision{result.hits !== 1 ? 's' : ''} decided the fight
          </p>

          {saveChoice === 'pending' && (
            <div
              className="mb-4 p-4 rounded-xl text-left"
              style={{ backgroundColor: `${battleTheme.classicBlue}55`, border: `1px solid ${battleTheme.mist}33` }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: battleTheme.buttercream }}>
                Save this match to your history?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                  style={{ backgroundColor: battleTheme.oasis, color: battleTheme.navy }}
                >
                  {isSaving ? 'Saving…' : 'Yes, save'}
                </button>
                <button
                  type="button"
                  onClick={onSkipSave}
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ backgroundColor: `${battleTheme.mist}33`, color: battleTheme.buttercream }}
                >
                  No thanks
                </button>
              </div>
              {saveError && (
                <p className="text-xs mt-2" style={{ color: battleTheme.livingCoral }}>{saveError}</p>
              )}
            </div>
          )}

          {saveChoice === 'saved' && (
            <p className="text-sm mb-4 font-medium" style={{ color: battleTheme.oasis }}>
              Match saved to your history
            </p>
          )}

          {saveChoice === 'skipped' && (
            <p className="text-sm mb-4" style={{ color: `${battleTheme.mist}99` }}>
              Result not saved
            </p>
          )}

          <button
            type="button"
            onClick={onDismiss}
            disabled={!canContinue}
            className="px-8 py-2.5 font-bold rounded-xl transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: battleTheme.classicBlue, color: battleTheme.buttercream }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

type Phase = 'select' | 'battle';

export default function BattleModal({
  isOpen,
  onClose,
  pokemon1,
  pokemon2,
  onSelectPokemon1,
  onSelectPokemon2,
}: BattleModalProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [battleKey, setBattleKey] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleEndResult | null>(null);
  const [saveChoice, setSaveChoice] = useState<SaveChoice>('pending');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoadingPokemon1, setIsLoadingPokemon1] = useState(false);
  const [isLoadingPokemon2, setIsLoadingPokemon2] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPhase('select');
      setShowVictory(false);
      setBattleResult(null);
      setSaveChoice('pending');
      setIsSaving(false);
      setSaveError(null);
      setIsLoadingPokemon1(false);
      setIsLoadingPokemon2(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (pokemon1) setIsLoadingPokemon1(false);
  }, [pokemon1]);

  useEffect(() => {
    if (pokemon2) setIsLoadingPokemon2(false);
  }, [pokemon2]);

  const handleBattleEnd = async (result: BattleEndResult) => {
    try {
      await battleApi.recordPlay();
      window.dispatchEvent(new CustomEvent('guestUsageRefresh'));
    } catch {
      return;
    }
    setBattleResult(result);
    setSaveChoice('pending');
    setSaveError(null);
    setShowVictory(true);
  };

  const handleSave = async () => {
    if (!battleResult) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await battleApi.saveResult({
        pokemon1Id: battleResult.pokemon1Id,
        pokemon2Id: battleResult.pokemon2Id,
        winnerId: battleResult.winnerId,
        turns: battleResult.hits,
      });
      setSaveChoice('saved');
      window.dispatchEvent(new CustomEvent('guestUsageRefresh'));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRematch = () => {
    setShowVictory(false);
    setBattleResult(null);
    setSaveChoice('pending');
    setBattleKey((k) => k + 1);
  };

  const winnerImage =
    battleResult && pokemon1 && pokemon2
      ? getPokemonImage(battleResult.winnerId === pokemon1.id ? pokemon1 : pokemon2)
      : '';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4 modal-overlay-enter"
      style={{ backgroundColor: `${battleTheme.navy}e6` }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden modal-content-enter"
        style={{ backgroundColor: battleTheme.buttercream, border: `3px solid ${battleTheme.classicBlue}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex justify-between items-center px-5 py-3"
          style={{ background: `linear-gradient(90deg, ${battleTheme.navy}, ${battleTheme.classicBlue})` }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: battleTheme.peachFuzz }}>
              Interactive Arena
            </p>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: battleTheme.buttercream }}>
              Battle Simulator
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full text-xl font-bold transition-colors"
            style={{ backgroundColor: `${battleTheme.mist}22`, color: battleTheme.buttercream }}
          >
            ×
          </button>
        </div>

        {phase === 'select' ? (
          <div className="p-5 sm:p-8">
            <div
              className="rounded-2xl p-6 sm:p-8 mb-6"
              style={{
                background: `linear-gradient(145deg, ${battleTheme.classicBlue}18, ${battleTheme.oasis}15)`,
                border: `2px solid ${battleTheme.classicBlue}44`,
              }}
            >
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <button
                  type="button"
                  onClick={() => { setIsLoadingPokemon1(true); onSelectPokemon1(); }}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    border: `2px ${pokemon1 ? 'solid' : 'dashed'} ${pokemon1 ? battleTheme.oasis : battleTheme.slate}66`,
                    backgroundColor: pokemon1 ? `${battleTheme.oasis}18` : `${battleTheme.mist}66`,
                  }}
                >
                  {isLoadingPokemon1 ? (
                    <div className="h-28 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: battleTheme.classicBlue, borderTopColor: 'transparent' }} />
                    </div>
                  ) : pokemon1 ? (
                    <>
                      <Image src={getPokemonImage(pokemon1)} alt={pokemon1.name} width={96} height={96} className="mx-auto" />
                      <p className="font-semibold capitalize mt-2 text-center" style={{ color: battleTheme.navy }}>{pokemon1.name}</p>
                    </>
                  ) : (
                    <div className="h-28 flex flex-col items-center justify-center" style={{ color: battleTheme.slate }}>
                      <span className="text-2xl">+</span>
                      <span className="text-xs mt-1">Your fighter</span>
                    </div>
                  )}
                </button>

                <span className="text-2xl sm:text-4xl font-black" style={{ color: battleTheme.livingCoral }}>VS</span>

                <button
                  type="button"
                  onClick={() => { setIsLoadingPokemon2(true); onSelectPokemon2(); }}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    border: `2px ${pokemon2 ? 'solid' : 'dashed'} ${pokemon2 ? battleTheme.livingCoral : battleTheme.slate}66`,
                    backgroundColor: pokemon2 ? `${battleTheme.livingCoral}18` : `${battleTheme.mist}66`,
                  }}
                >
                  {isLoadingPokemon2 ? (
                    <div className="h-28 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: battleTheme.livingCoral, borderTopColor: 'transparent' }} />
                    </div>
                  ) : pokemon2 ? (
                    <>
                      <Image src={getPokemonImage(pokemon2)} alt={pokemon2.name} width={96} height={96} className="mx-auto scale-x-[-1]" />
                      <p className="font-semibold capitalize mt-2 text-center" style={{ color: battleTheme.navy }}>{pokemon2.name}</p>
                    </>
                  ) : (
                    <div className="h-28 flex flex-col items-center justify-center" style={{ color: battleTheme.slate }}>
                      <span className="text-2xl">+</span>
                      <span className="text-xs mt-1">Opponent</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <p className="text-center text-sm mb-4" style={{ color: battleTheme.slate }}>
              Drag your Pokémon to aim · release to attack · touch supported on mobile
            </p>

            <button
              type="button"
              onClick={() => setPhase('battle')}
              disabled={!pokemon1 || !pokemon2}
              className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wide transition-all disabled:opacity-40"
              style={{ background: `linear-gradient(90deg, ${battleTheme.classicBlue}, ${battleTheme.deepTeal})`, color: battleTheme.buttercream }}
            >
              Enter Arena
            </button>
          </div>
        ) : (
          pokemon1 &&
          pokemon2 && (
            <div className="relative">
              <InteractiveBattleArena
                key={battleKey}
                pokemon1={pokemon1}
                pokemon2={pokemon2}
                onBattleEnd={handleBattleEnd}
                onRematch={handleRematch}
                onExit={onClose}
              />
              {showVictory && battleResult && (
                <VictoryOverlay
                  winnerImage={winnerImage}
                  result={battleResult}
                  saveChoice={saveChoice}
                  isSaving={isSaving}
                  saveError={saveError}
                  onSave={handleSave}
                  onSkipSave={() => setSaveChoice('skipped')}
                  onDismiss={() => setShowVictory(false)}
                />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

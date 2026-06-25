'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { compareApi, CompareResponse, CompareRequest } from '@/services/gameApi';
import { pokemonTypeStyles } from '@/utils/pokemonTypes';
import { PokemonDetails } from '@/types/pokemon';
import { getPokemonImage } from '@/utils/pokemonImage';
import { battleTheme } from '@/components/battle/battleTheme';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemon1: PokemonDetails | null;
  pokemon2: PokemonDetails | null;
  onSelectPokemon1: () => void;
  onSelectPokemon2: () => void;
}

const STAT_KEYS = ['hp', 'attack', 'defense', 'speed'] as const;
const STAT_LABELS: Record<(typeof STAT_KEYS)[number], string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  speed: 'Speed',
};

function StatDuelBar({
  label,
  left,
  right,
  animate,
}: {
  label: string;
  left: number;
  right: number;
  animate: boolean;
}) {
  const max = Math.max(left, right, 1);
  const leftPct = animate ? (left / max) * 100 : 0;
  const rightPct = animate ? (right / max) * 100 : 0;
  const leftWins = left > right;
  const rightWins = right > left;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5 text-xs font-semibold">
        <span style={{ color: leftWins ? battleTheme.oasis : battleTheme.slate }}>{left}</span>
        <span style={{ color: battleTheme.navy }}>{label}</span>
        <span style={{ color: rightWins ? battleTheme.livingCoral : battleTheme.slate }}>{right}</span>
      </div>
      <div className="flex items-center gap-1 h-3">
        <div className="flex-1 h-full rounded-l-full overflow-hidden" style={{ backgroundColor: `${battleTheme.mist}` }}>
          <div
            className="h-full rounded-l-full transition-all duration-700 ease-out ml-auto"
            style={{
              width: `${leftPct}%`,
              background: `linear-gradient(90deg, ${battleTheme.deepTeal}, ${battleTheme.oasis})`,
            }}
          />
        </div>
        <div className="w-0.5 h-4 rounded-full" style={{ backgroundColor: battleTheme.navy }} />
        <div className="flex-1 h-full rounded-r-full overflow-hidden" style={{ backgroundColor: `${battleTheme.mist}` }}>
          <div
            className="h-full rounded-r-full transition-all duration-700 ease-out"
            style={{
              width: `${rightPct}%`,
              background: `linear-gradient(90deg, ${battleTheme.livingCoral}, ${battleTheme.peachFuzz})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PokemonSlot({
  pokemon,
  isLoading,
  accent,
  label,
  onSelect,
}: {
  pokemon: PokemonDetails | null;
  isLoading: boolean;
  accent: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded-xl p-4 transition-all w-full"
      style={{
        border: `2px ${pokemon ? 'solid' : 'dashed'} ${pokemon ? accent : `${battleTheme.slate}66`}`,
        backgroundColor: pokemon ? `${accent}18` : `${battleTheme.mist}66`,
      }}
    >
      {isLoading ? (
        <div className="h-28 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: accent, borderTopColor: 'transparent' }}
          />
        </div>
      ) : pokemon ? (
        <>
          <Image src={getPokemonImage(pokemon)} alt={pokemon.name} width={96} height={96} className="mx-auto" />
          <p className="font-semibold capitalize mt-2 text-center" style={{ color: battleTheme.navy }}>
            {pokemon.name}
          </p>
          <p className="text-[10px] mt-1 text-center" style={{ color: battleTheme.slate }}>
            Tap to change
          </p>
        </>
      ) : (
        <div className="h-28 flex flex-col items-center justify-center" style={{ color: battleTheme.slate }}>
          <span className="text-2xl">+</span>
          <span className="text-xs mt-1">{label}</span>
        </div>
      )}
    </button>
  );
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
  const [isLoadingPokemon1, setIsLoadingPokemon1] = useState(false);
  const [isLoadingPokemon2, setIsLoadingPokemon2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barsAnimated, setBarsAnimated] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCompareResult(null);
      setIsLoading(false);
      setIsLoadingPokemon1(false);
      setIsLoadingPokemon2(false);
      setError(null);
      setBarsAnimated(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (pokemon1) setIsLoadingPokemon1(false);
  }, [pokemon1]);

  useEffect(() => {
    if (pokemon2) setIsLoadingPokemon2(false);
  }, [pokemon2]);

  useEffect(() => {
    if (compareResult) {
      setBarsAnimated(false);
      const t = requestAnimationFrame(() => setBarsAnimated(true));
      return () => cancelAnimationFrame(t);
    }
  }, [compareResult]);

  const handleCompare = async () => {
    if (!pokemon1 || !pokemon2) return;

    setIsLoading(true);
    setError(null);
    try {
      const compareRequest: CompareRequest = {
        pokemon1Id: pokemon1.id,
        pokemon2Id: pokemon2.id,
      };
      const result = await compareApi.compare(compareRequest);
      setCompareResult(result);
      window.dispatchEvent(new CustomEvent('guestUsageRefresh'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare Pokémon. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const p1Win = compareResult?.winProbability.pokemon1 ?? 50;
  const p2Win = compareResult?.winProbability.pokemon2 ?? 50;
  const favored =
    compareResult && p1Win !== p2Win
      ? p1Win > p2Win
        ? compareResult.pokemon1.name
        : compareResult.pokemon2.name
      : null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4 modal-overlay-enter"
      style={{ backgroundColor: `${battleTheme.navy}e6` }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto modal-content-enter"
        style={{ backgroundColor: battleTheme.buttercream, border: `3px solid ${battleTheme.classicBlue}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-10 flex justify-between items-center px-5 py-3"
          style={{ background: `linear-gradient(90deg, ${battleTheme.navy}, ${battleTheme.classicBlue})` }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: battleTheme.peachFuzz }}>
              Stat Analysis
            </p>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: battleTheme.buttercream }}>
              Compare Pokémon
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

        <div className="p-5 sm:p-8">
          {error && (
            <div
              className="mb-4 p-4 rounded-xl flex items-start justify-between gap-3"
              style={{ backgroundColor: `${battleTheme.livingCoral}22`, border: `1px solid ${battleTheme.livingCoral}55` }}
            >
              <p className="text-sm" style={{ color: battleTheme.navy }}>{error}</p>
              <button type="button" onClick={() => setError(null)} className="text-xs underline shrink-0" style={{ color: battleTheme.livingCoral }}>
                Dismiss
              </button>
            </div>
          )}

          {!compareResult ? (
            <div>
              <div
                className="rounded-2xl p-6 sm:p-8 mb-6"
                style={{
                  background: `linear-gradient(145deg, ${battleTheme.classicBlue}18, ${battleTheme.oasis}12)`,
                  border: `2px solid ${battleTheme.classicBlue}44`,
                }}
              >
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  <PokemonSlot
                    pokemon={pokemon1}
                    isLoading={isLoadingPokemon1}
                    accent={battleTheme.oasis}
                    label="First Pokémon"
                    onSelect={() => {
                      setIsLoadingPokemon1(true);
                      onSelectPokemon1();
                    }}
                  />
                  <span className="text-2xl sm:text-4xl font-black px-1" style={{ color: battleTheme.classicBlue }}>
                    VS
                  </span>
                  <PokemonSlot
                    pokemon={pokemon2}
                    isLoading={isLoadingPokemon2}
                    accent={battleTheme.livingCoral}
                    label="Second Pokémon"
                    onSelect={() => {
                      setIsLoadingPokemon2(true);
                      onSelectPokemon2();
                    }}
                  />
                </div>
              </div>

              <p className="text-center text-sm mb-4" style={{ color: battleTheme.slate }}>
                Side-by-side stats, type advantages, and win probability
              </p>

              <button
                type="button"
                onClick={handleCompare}
                disabled={!pokemon1 || !pokemon2 || isLoading || isLoadingPokemon1 || isLoadingPokemon2}
                className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wide transition-all disabled:opacity-40"
                style={{
                  background: `linear-gradient(90deg, ${battleTheme.deepTeal}, ${battleTheme.classicBlue})`,
                  color: battleTheme.buttercream,
                }}
              >
                {isLoading ? 'Analyzing…' : 'Run Comparison'}
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                {[compareResult.pokemon1, compareResult.pokemon2].map((mon, idx) => (
                  <div
                    key={mon.id}
                    className="rounded-xl p-4 text-center"
                    style={{
                      backgroundColor: idx === 0 ? `${battleTheme.oasis}15` : `${battleTheme.livingCoral}15`,
                      border: `2px solid ${idx === 0 ? battleTheme.oasis : battleTheme.livingCoral}44`,
                    }}
                  >
                    <Image
                      src={getPokemonImage(pokemon1 && pokemon2 ? (idx === 0 ? pokemon1 : pokemon2) : null)}
                      alt={mon.name}
                      width={88}
                      height={88}
                      className="mx-auto"
                    />
                    <h3 className="text-lg font-bold capitalize mt-2" style={{ color: battleTheme.navy }}>
                      {mon.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 justify-center mt-2">
                      {mon.types.map((type) => (
                        <span
                          key={type}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: pokemonTypeStyles[type]?.bg || battleTheme.slate }}
                        >
                          {type.toUpperCase()}
                        </span>
                      ))}
                    </div>
                    <p className="text-2xl font-black mt-2" style={{ color: idx === 0 ? battleTheme.deepTeal : battleTheme.livingCoral }}>
                      {mon.totalStats}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: battleTheme.slate }}>
                      Total BST
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: `${battleTheme.classicBlue}12`, border: `1px solid ${battleTheme.classicBlue}33` }}
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-center mb-4" style={{ color: battleTheme.navy }}>
                  Stat Duel
                </h3>
                {STAT_KEYS.map((key) => (
                  <StatDuelBar
                    key={key}
                    label={STAT_LABELS[key]}
                    left={compareResult.pokemon1.stats[key]}
                    right={compareResult.pokemon2.stats[key]}
                    animate={barsAnimated}
                  />
                ))}
              </div>

              <div
                className="rounded-xl p-5"
                style={{ background: `linear-gradient(135deg, ${battleTheme.peachFuzz}33, ${battleTheme.classicBlue}18)` }}
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-center mb-1" style={{ color: battleTheme.navy }}>
                  Win Probability
                </h3>
                {favored && (
                  <p className="text-center text-xs mb-3 capitalize" style={{ color: battleTheme.deepTeal }}>
                    {favored} has the edge
                  </p>
                )}
                <div className="flex justify-between text-sm font-bold mb-2 capitalize">
                  <span style={{ color: battleTheme.oasis }}>{compareResult.pokemon1.name} {p1Win}%</span>
                  <span style={{ color: battleTheme.livingCoral }}>{p2Win}% {compareResult.pokemon2.name}</span>
                </div>
                <div className="h-5 rounded-full overflow-hidden flex shadow-inner" style={{ backgroundColor: battleTheme.mist }}>
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{
                      width: barsAnimated ? `${p1Win}%` : '50%',
                      background: `linear-gradient(90deg, ${battleTheme.deepTeal}, ${battleTheme.oasis})`,
                    }}
                  />
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{
                      width: barsAnimated ? `${p2Win}%` : '50%',
                      background: `linear-gradient(90deg, ${battleTheme.livingCoral}, ${battleTheme.peachFuzz})`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: `${battleTheme.oasis}12`, border: `1px solid ${battleTheme.oasis}44` }}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: battleTheme.deepTeal }}>
                    Type Advantages
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold capitalize" style={{ color: battleTheme.navy }}>
                        {compareResult.pokemon1.name}:
                      </span>
                      <p className="mt-0.5 capitalize" style={{ color: battleTheme.slate }}>
                        {compareResult.strengths.pokemon1Advantages.length > 0
                          ? compareResult.strengths.pokemon1Advantages.join(', ')
                          : 'No clear advantage'}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold capitalize" style={{ color: battleTheme.navy }}>
                        {compareResult.pokemon2.name}:
                      </span>
                      <p className="mt-0.5 capitalize" style={{ color: battleTheme.slate }}>
                        {compareResult.strengths.pokemon2Advantages.length > 0
                          ? compareResult.strengths.pokemon2Advantages.join(', ')
                          : 'No clear advantage'}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: `${battleTheme.livingCoral}12`, border: `1px solid ${battleTheme.livingCoral}44` }}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: battleTheme.livingCoral }}>
                    Type Weaknesses
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold capitalize" style={{ color: battleTheme.navy }}>
                        {compareResult.pokemon1.name}:
                      </span>
                      <p className="mt-0.5 capitalize" style={{ color: battleTheme.slate }}>
                        {compareResult.weaknesses.pokemon1Weaknesses.length > 0
                          ? compareResult.weaknesses.pokemon1Weaknesses.join(', ')
                          : 'No major weakness'}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold capitalize" style={{ color: battleTheme.navy }}>
                        {compareResult.pokemon2.name}:
                      </span>
                      <p className="mt-0.5 capitalize" style={{ color: battleTheme.slate }}>
                        {compareResult.weaknesses.pokemon2Weaknesses.length > 0
                          ? compareResult.weaknesses.pokemon2Weaknesses.join(', ')
                          : 'No major weakness'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompareResult(null)}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all"
                  style={{ backgroundColor: `${battleTheme.mist}`, color: battleTheme.navy }}
                >
                  Compare Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-bold transition-all hover:brightness-110"
                  style={{ backgroundColor: battleTheme.classicBlue, color: battleTheme.buttercream }}
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

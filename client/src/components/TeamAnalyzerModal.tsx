'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PokemonDetails } from '@/types/pokemon';
import { getPokemonImage } from '@/utils/pokemonImage';
import { pokemonTypeStyles } from '@/utils/pokemonTypes';
import { battleTheme } from '@/components/battle/battleTheme';
import { teamsApi, TeamResponse } from '@/services/gameApi';
import { favoritesApi } from '@/services/api';

const MIN_TEAM = 3;
const MAX_TEAM = 6;
const ALL_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

interface TeamAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: PokemonDetails[];
  onSelectSlot: (slotIndex: number) => void;
  onRemoveFromTeam: (slotIndex: number) => void;
  onSetTeam: (team: PokemonDetails[]) => void;
}

type Tab = 'build' | 'favorites';
type Phase = 'build' | 'results';

function scoreColor(score: number) {
  if (score >= 80) return battleTheme.oasis;
  if (score >= 60) return battleTheme.classicBlue;
  if (score >= 40) return battleTheme.peachFuzz;
  return battleTheme.livingCoral;
}

function ScoreRing({ score, animate }: { score: number; animate: boolean }) {
  const color = scoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (animate ? score / 100 : 0) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke={battleTheme.mist} strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black" style={{ color: battleTheme.navy }}>{animate ? score : '—'}</span>
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: battleTheme.slate }}>
          Team Score
        </span>
      </div>
    </div>
  );
}

function TeamSlot({
  pokemon,
  index,
  onSelect,
  onRemove,
}: {
  pokemon: PokemonDetails | null;
  index: number;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onSelect}
        className="w-full rounded-xl p-2 transition-all aspect-square flex flex-col items-center justify-center"
        style={{
          border: `2px ${pokemon ? 'solid' : 'dashed'} ${pokemon ? battleTheme.oasis : `${battleTheme.slate}55`}`,
          backgroundColor: pokemon ? `${battleTheme.oasis}12` : `${battleTheme.mist}88`,
        }}
      >
        {pokemon ? (
          <>
            <Image src={getPokemonImage(pokemon)} alt={pokemon.name} width={56} height={56} className="mx-auto" />
            <p className="text-[10px] font-semibold capitalize truncate w-full text-center mt-1" style={{ color: battleTheme.navy }}>
              {pokemon.name}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center" style={{ color: battleTheme.slate }}>
            <span className="text-xl">+</span>
            <span className="text-[9px] mt-0.5">Slot {index + 1}</span>
          </div>
        )}
      </button>
      {pokemon && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
          style={{ backgroundColor: battleTheme.livingCoral, color: battleTheme.buttercream }}
          aria-label={`Remove ${pokemon.name}`}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function TeamAnalyzerModal({
  isOpen,
  onClose,
  team,
  onSelectSlot,
  onRemoveFromTeam,
  onSetTeam,
}: TeamAnalyzerModalProps) {
  const [tab, setTab] = useState<Tab>('build');
  const [phase, setPhase] = useState<Phase>('build');
  const [result, setResult] = useState<TeamResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barsAnimated, setBarsAnimated] = useState(false);

  const [favorites, setFavorites] = useState<PokemonDetails[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [selectedFavoriteIds, setSelectedFavoriteIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      setTab('build');
      setPhase('build');
      setResult(null);
      setError(null);
      setBarsAnimated(false);
      setSelectedFavoriteIds(new Set());
      setFavoritesError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (result) {
      setBarsAnimated(false);
      const t = requestAnimationFrame(() => setBarsAnimated(true));
      return () => cancelAnimationFrame(t);
    }
  }, [result]);

  useEffect(() => {
    if (!isOpen || tab !== 'favorites') return;
    let cancelled = false;
    setFavoritesLoading(true);
    setFavoritesError(null);
    favoritesApi
      .getFavorites()
      .then((data) => { if (!cancelled) setFavorites(data); })
      .catch((err) => {
        if (!cancelled) {
          setFavoritesError(err instanceof Error ? err.message : 'Failed to load favorites');
        }
      })
      .finally(() => { if (!cancelled) setFavoritesLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, tab]);

  const slots: (PokemonDetails | null)[] = Array.from({ length: MAX_TEAM }, (_, i) => team[i] ?? null);
  const canAnalyze = team.length >= MIN_TEAM && team.length <= MAX_TEAM;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await teamsApi.evaluate({ pokemonIds: team.map((p) => p.id) });
      setResult(data);
      setPhase('results');
      window.dispatchEvent(new CustomEvent('guestUsageRefresh'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze team');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = (id: number) => {
    setSelectedFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size + team.length < MAX_TEAM) {
        next.add(id);
      }
      return next;
    });
  };

  const applyFavorites = () => {
    const toAdd = favorites.filter(
      (f) => selectedFavoriteIds.has(f.id) && !team.some((t) => t.id === f.id),
    );
    const merged = [...team, ...toAdd].slice(0, MAX_TEAM);
    onSetTeam(merged);
    setSelectedFavoriteIds(new Set());
    setTab('build');
  };

  if (!isOpen) return null;

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
              Squad Builder
            </p>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: battleTheme.buttercream }}>
              Team Analyzer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full text-xl font-bold"
            style={{ backgroundColor: `${battleTheme.mist}22`, color: battleTheme.buttercream }}
          >
            ×
          </button>
        </div>

        <div className="p-5 sm:p-8">
          {error && (
            <div
              className="mb-4 p-4 rounded-xl"
              style={{ backgroundColor: `${battleTheme.livingCoral}22`, border: `1px solid ${battleTheme.livingCoral}55` }}
            >
              <p className="text-sm" style={{ color: battleTheme.navy }}>{error}</p>
            </div>
          )}

          {phase === 'build' ? (
            <>
              <div
                className="flex rounded-xl p-1 mb-6"
                style={{ backgroundColor: `${battleTheme.classicBlue}18` }}
              >
                {(['build', 'favorites'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all capitalize"
                    style={{
                      backgroundColor: tab === t ? battleTheme.classicBlue : 'transparent',
                      color: tab === t ? battleTheme.buttercream : battleTheme.slate,
                    }}
                  >
                    {t === 'build' ? 'Build Team' : 'From Favorites'}
                  </button>
                ))}
              </div>

              {tab === 'build' ? (
                <>
                  <p className="text-center text-sm mb-4" style={{ color: battleTheme.slate }}>
                    Pick {MIN_TEAM}–{MAX_TEAM} Pokémon · tap a slot to add or change
                  </p>
                  <div
                    className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4 p-4 rounded-xl"
                    style={{
                      background: `linear-gradient(145deg, ${battleTheme.classicBlue}12, ${battleTheme.oasis}10)`,
                      border: `2px solid ${battleTheme.classicBlue}33`,
                    }}
                  >
                    {slots.map((pokemon, i) => (
                      <TeamSlot
                        key={i}
                        pokemon={pokemon}
                        index={i}
                        onSelect={() => onSelectSlot(i)}
                        onRemove={() => onRemoveFromTeam(i)}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs mb-6 px-1" style={{ color: battleTheme.slate }}>
                    <span>{team.length} / {MAX_TEAM} selected</span>
                    <span>{team.length < MIN_TEAM ? `Need ${MIN_TEAM - team.length} more` : 'Ready to analyze'}</span>
                  </div>
                </>
              ) : (
                <div className="mb-6">
                  {favoritesLoading ? (
                    <div className="py-12 text-center">
                      <div
                        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto"
                        style={{ borderColor: battleTheme.classicBlue, borderTopColor: 'transparent' }}
                      />
                      <p className="text-sm mt-3" style={{ color: battleTheme.slate }}>Loading favorites…</p>
                    </div>
                  ) : favoritesError ? (
                    <p className="text-center text-sm py-8" style={{ color: battleTheme.livingCoral }}>{favoritesError}</p>
                  ) : favorites.length === 0 ? (
                    <div className="text-center py-10 rounded-xl" style={{ backgroundColor: `${battleTheme.mist}88` }}>
                      <p className="text-sm font-medium" style={{ color: battleTheme.navy }}>No favorites yet</p>
                      <p className="text-xs mt-1" style={{ color: battleTheme.slate }}>
                        Heart Pokémon on the home page, then pick them here
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-center text-sm mb-4" style={{ color: battleTheme.slate }}>
                        Tap to select favorites · {selectedFavoriteIds.size} chosen
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-2 rounded-xl mb-4" style={{ backgroundColor: `${battleTheme.mist}66` }}>
                        {favorites.map((fav) => {
                          const selected = selectedFavoriteIds.has(fav.id);
                          const inTeam = team.some((t) => t.id === fav.id);
                          return (
                            <button
                              key={fav.id}
                              type="button"
                              disabled={inTeam}
                              onClick={() => toggleFavorite(fav.id)}
                              className="relative rounded-lg p-2 transition-all disabled:opacity-40"
                              style={{
                                border: `2px solid ${selected ? battleTheme.oasis : `${battleTheme.slate}33`}`,
                                backgroundColor: selected ? `${battleTheme.oasis}22` : battleTheme.buttercream,
                              }}
                            >
                              <Image src={getPokemonImage(fav)} alt={fav.name} width={48} height={48} className="mx-auto" />
                              <p className="text-[9px] capitalize truncate font-medium mt-1" style={{ color: battleTheme.navy }}>
                                {fav.name}
                              </p>
                              {selected && (
                                <span
                                  className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold"
                                  style={{ backgroundColor: battleTheme.oasis, color: battleTheme.buttercream }}
                                >
                                  ✓
                                </span>
                              )}
                              {inTeam && (
                                <span className="absolute inset-0 flex items-center justify-center rounded-lg text-[9px] font-bold" style={{ backgroundColor: `${battleTheme.navy}66`, color: battleTheme.buttercream }}>
                                  In team
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={applyFavorites}
                        disabled={selectedFavoriteIds.size === 0 || team.length >= MAX_TEAM}
                        className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
                        style={{ backgroundColor: battleTheme.deepTeal, color: battleTheme.buttercream }}
                      >
                        Add selected to team
                      </button>
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!canAnalyze || isLoading}
                className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wide transition-all disabled:opacity-40"
                style={{
                  background: `linear-gradient(90deg, ${battleTheme.deepTeal}, ${battleTheme.classicBlue})`,
                  color: battleTheme.buttercream,
                }}
              >
                {isLoading ? 'Analyzing…' : 'Analyze Team'}
              </button>
            </>
          ) : (
            result && (
              <div className="space-y-6 animate-fadeIn">
                <ScoreRing score={result.overallScore} animate={barsAnimated} />

                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: `${battleTheme.classicBlue}12`, border: `1px solid ${battleTheme.classicBlue}33` }}
                >
                  <div className="flex justify-between text-xs font-semibold mb-2" style={{ color: battleTheme.navy }}>
                    <span>Type Coverage</span>
                    <span>{result.typeCoverage.coverageScore}%</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden mb-3" style={{ backgroundColor: battleTheme.mist }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: barsAnimated ? `${result.typeCoverage.coverageScore}%` : '0%',
                        background: `linear-gradient(90deg, ${battleTheme.deepTeal}, ${battleTheme.oasis})`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ALL_TYPES.map((type) => {
                      const covered = result.typeCoverage.covered.includes(type);
                      return (
                        <span
                          key={type}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                          style={{
                            backgroundColor: covered
                              ? (pokemonTypeStyles[type]?.bg || battleTheme.oasis)
                              : `${battleTheme.slate}33`,
                            color: covered ? '#fff' : battleTheme.slate,
                            opacity: covered ? 1 : 0.6,
                          }}
                        >
                          {type}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: battleTheme.navy }}>
                    Your Roster
                  </h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {result.team.map((mon) => (
                      <div
                        key={mon.id}
                        className="rounded-lg px-3 py-2 text-center min-w-[72px]"
                        style={{ backgroundColor: `${battleTheme.oasis}15`, border: `1px solid ${battleTheme.oasis}44` }}
                      >
                        <p className="text-xs font-bold capitalize" style={{ color: battleTheme.navy }}>{mon.name}</p>
                        <div className="flex gap-0.5 justify-center mt-1">
                          {mon.types.map((t) => (
                            <span
                              key={t}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: pokemonTypeStyles[t]?.bg || battleTheme.slate }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className="rounded-xl p-4"
                    style={{ backgroundColor: `${battleTheme.livingCoral}12`, border: `1px solid ${battleTheme.livingCoral}44` }}
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: battleTheme.livingCoral }}>
                      Team Weaknesses
                    </h4>
                    {result.weaknesses.length === 0 ? (
                      <p className="text-sm" style={{ color: battleTheme.slate }}>No major shared weaknesses</p>
                    ) : (
                      <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {result.weaknesses.slice(0, 6).map((w) => (
                          <li key={w.type} className="text-sm">
                            <span
                              className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white mr-2"
                              style={{ backgroundColor: pokemonTypeStyles[w.type]?.bg || battleTheme.livingCoral }}
                            >
                              {w.type}
                            </span>
                            <span className="text-xs capitalize" style={{ color: battleTheme.slate }}>
                              ×{w.count} exposure
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{ backgroundColor: `${battleTheme.oasis}12`, border: `1px solid ${battleTheme.oasis}44` }}
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: battleTheme.deepTeal }}>
                      Offensive Strengths
                    </h4>
                    {result.strengths.length === 0 ? (
                      <p className="text-sm" style={{ color: battleTheme.slate }}>Limited offensive coverage</p>
                    ) : (
                      <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {result.strengths.slice(0, 6).map((s) => (
                          <li key={s.type} className="text-sm">
                            <span
                              className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white mr-2"
                              style={{ backgroundColor: pokemonTypeStyles[s.type]?.bg || battleTheme.oasis }}
                            >
                              {s.type}
                            </span>
                            <span className="text-xs" style={{ color: battleTheme.slate }}>
                              hits {s.count} types
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{ background: `linear-gradient(135deg, ${battleTheme.peachFuzz}33, ${battleTheme.classicBlue}15)` }}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: battleTheme.navy }}>
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2 text-sm" style={{ color: battleTheme.slate }}>
                        <span style={{ color: battleTheme.classicBlue }}>→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setPhase('build'); setResult(null); }}
                    className="flex-1 py-3 rounded-xl font-semibold"
                    style={{ backgroundColor: battleTheme.mist, color: battleTheme.navy }}
                  >
                    Edit Team
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl font-bold hover:brightness-110"
                    style={{ backgroundColor: battleTheme.classicBlue, color: battleTheme.buttercream }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

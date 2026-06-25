'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { usersApi, UserProfile, BattleHistoryItem } from '@/services/api';
import PokemonCard from '@/components/PokemonCard';
import { battleTheme } from '@/components/battle/battleTheme';
import { getPokemonImage } from '@/utils/pokemonImage';
import Link from 'next/link';

function GuestUsageBar({ usage }: { usage: NonNullable<UserProfile['usage']> }) {
  const items = [
    { label: 'Battles', used: usage.battles },
    { label: 'Favorites', used: usage.favorites },
    { label: 'Compares', used: usage.compares },
    { label: 'Teams', used: usage.teamAnalyzes },
  ];

  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{ backgroundColor: `${battleTheme.peachFuzz}44`, border: `1px solid ${battleTheme.classicBlue}44` }}
    >
      <p className="text-sm font-semibold mb-3" style={{ color: battleTheme.navy }}>
        Guest usage (max {usage.limit} each) — cleared on logout
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1" style={{ color: battleTheme.slate }}>
              <span>{item.label}</span>
              <span>{item.used}/{usage.limit}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: battleTheme.mist }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (item.used / usage.limit) * 100)}%`,
                  backgroundColor: item.used >= usage.limit ? battleTheme.livingCoral : battleTheme.oasis,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('showSignupModal'))}
        className="mt-3 text-sm font-semibold underline"
        style={{ color: battleTheme.classicBlue }}
      >
        Sign up for unlimited access
      </button>
    </div>
  );
}

function BattleHistoryCard({ battle }: { battle: BattleHistoryItem }) {
  const p1 = battle.pokemon1;
  const p2 = battle.pokemon2;
  const winner = battle.winner;
  if (!p1 || !p2) return null;

  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ backgroundColor: `${battleTheme.classicBlue}10`, border: `1px solid ${battleTheme.classicBlue}33` }}
    >
      <Image src={getPokemonImage(p1 as any)} alt={p1.name} width={48} height={48} />
      <span className="text-xs font-bold" style={{ color: battleTheme.slate }}>vs</span>
      <Image src={getPokemonImage(p2 as any)} alt={p2.name} width={48} height={48} />
      <div className="flex-1 min-w-0">
        <p className="text-sm capitalize truncate" style={{ color: battleTheme.navy }}>
          <span className="font-semibold">{p1.name}</span>
          {' vs '}
          <span className="font-semibold">{p2.name}</span>
        </p>
        <p className="text-xs capitalize" style={{ color: battleTheme.oasis }}>
          Winner: {winner?.name ?? '—'} · {battle.turns} turns
        </p>
        {battle.createdAt && (
          <p className="text-[10px] mt-0.5" style={{ color: battleTheme.slate }}>
            {new Date(battle.createdAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const refresh = () => {
      if (isAuthenticated) loadProfile();
    };
    window.addEventListener('guestUsageRefresh', refresh);
    return () => window.removeEventListener('guestUsageRefresh', refresh);
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      const data = await usersApi.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Login Required</h1>
          <p className="text-gray-600 mb-6">Please log in or visit as guest to view your profile.</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || profile?.username || user?.email || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-lg">
              {initials}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{displayName}</h1>
                {profile?.isGuest && (
                  <span className="text-xs font-bold uppercase px-2 py-1 rounded-full bg-slate-200 text-slate-700">
                    Guest
                  </span>
                )}
              </div>
              {profile?.username && (
                <p className="text-lg text-gray-600 mb-1">@{profile.username}</p>
              )}
              {!profile?.isGuest && <p className="text-gray-500 mb-4">{profile?.email}</p>}
              {profile?.createdAt && !profile?.isGuest && (
                <p className="text-sm text-gray-400">
                  Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {profile?.isGuest && profile.usage && <GuestUsageBar usage={profile.usage} />}

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">⚔️ Battle History</h2>
            <span className="text-lg text-gray-600 bg-orange-100 px-4 py-2 rounded-full">
              {profile?.battles?.length || 0}
            </span>
          </div>
          {profile?.battles && profile.battles.length > 0 ? (
            <div className="space-y-3">
              {profile.battles.map((battle) => (
                <BattleHistoryCard key={battle._id ?? `${battle.pokemon1Id}-${battle.createdAt}`} battle={battle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-600">No saved battles yet. Win fights in the Battle Simulator and choose to save them.</p>
              <Link href="/games" className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                Go to Games
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 fill-current" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorite Pokémon
            </h2>
            <span className="text-lg text-gray-600 bg-orange-100 px-4 py-2 rounded-full">
              {profile?.favorites?.length || 0}
            </span>
          </div>
          {profile?.favorites && profile.favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.favorites.map((pokemon) => (
                <div key={pokemon.id} className="flex justify-center">
                  <PokemonCard pokemon={pokemon as any} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❤️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-6">Start adding Pokémon to your favorites to see them here!</p>
              <Link href="/" className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                Browse Pokémon
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

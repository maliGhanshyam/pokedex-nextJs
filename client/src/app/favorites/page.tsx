'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { favoritesApi } from '@/services/api';
import { PokemonDetails } from '@/types/pokemon';
import PokemonCard from '@/components/PokemonCard';
import Link from 'next/link';

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<PokemonDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    try {
      const data = await favoritesApi.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Login Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please log in to view your favorite Pokémon.
          </p>
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
          <p className="mt-4 text-gray-700">Loading favorites...</p>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            No Favorites Yet
          </h1>
          <p className="text-gray-600 mb-6">
            Start adding Pokémon to your favorites by clicking the heart icon on
            any Pokémon card!
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Browse Pokémon
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200 px-4 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          My Favorite Pokémon
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((pokemon) => (
            <div key={pokemon.id} className="flex justify-center">
              <PokemonCard pokemon={pokemon} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


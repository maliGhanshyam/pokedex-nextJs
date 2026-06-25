"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { favoritesApi } from "@/services/api";
import LoginModal from "@/components/LoginModal";
import { PokemonCardSkeleton } from "@/components/SkeletonLoader";

interface PokemonFlipCardProps {
  pokemon: {
    name: string;
    id: string;
    image: string;
    imageOfficial?: string;
  };
  priority?: boolean;
}

export default function PokemonFlipCard({ pokemon, priority = false }: PokemonFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      checkFavorite();
    }
  }, [isAuthenticated, pokemon.id]);

  const checkFavorite = async () => {
    try {
      const favorites = await favoritesApi.getFavorites();
      const favorite = favorites.find((fav) => fav.id === parseInt(pokemon.id));
      setIsFavorite(!!favorite);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setIsLoadingFavorite(true);
    try {
      const pokemonId = parseInt(pokemon.id);
      if (isFavorite) {
        await favoritesApi.removeFavorite(pokemonId);
        setIsFavorite(false);
      } else {
        await favoritesApi.addFavorite(pokemonId);
      setIsFavorite(true);
      window.dispatchEvent(new CustomEvent('guestUsageRefresh'));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  return (
    <>
      <div className="w-40 sm:w-48 md:w-52 lg:w-56" style={{ perspective: "1000px" }}>
        <div
          className="relative h-40 w-full cursor-pointer"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
          onMouseEnter={() => setIsFlipped(true)}
          onMouseLeave={() => setIsFlipped(false)}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white p-4 rounded-xl shadow-lg hover:shadow-xl text-center flex flex-col items-center justify-center border border-gray-100"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(0deg)",
            }}
          >
            {isAuthenticated && (
              <div className="absolute top-2 right-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 ${
                    isFavorite ? "text-red-500 fill-current" : "text-gray-300"
                  }`}
                  viewBox="0 0 24 24"
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
            )}
            <div className="relative w-24 h-24 mx-auto mb-3">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full bg-gray-300 rounded-lg animate-pulse"></div>
                </div>
              )}
              <Image
                src={pokemon.imageOfficial || pokemon.image}
                alt={pokemon.name}
                width={100}
                height={100}
                className={`mx-auto object-contain drop-shadow-md transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                quality={90}
                priority={priority}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            </div>
            <span className="capitalize text-lg font-medium block mt-2">
              {pokemon.name}
            </span>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 bg-white p-4 rounded-xl shadow-lg hover:shadow-xl text-center flex flex-col justify-center border border-gray-100"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <button
              onClick={handleFavoriteClick}
              disabled={isLoadingFavorite}
              className="absolute top-2 right-2 z-10 p-1 hover:scale-110 transition-transform disabled:opacity-50"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 ${
                  isFavorite
                    ? "text-red-500 fill-current"
                    : "text-gray-400 hover:text-red-400"
                } transition-colors`}
                viewBox="0 0 24 24"
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <div className="mb-2">
              <span className="capitalize text-lg font-medium block">
                {pokemon.name}
              </span>
            </div>
            <Link
              href={`/pokemon/${pokemon.name}`}
              className="mt-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm hover:bg-orange-200 transition-colors inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}


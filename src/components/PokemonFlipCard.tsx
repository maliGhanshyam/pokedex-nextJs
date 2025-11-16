"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="w-40 sm:w-48 md:w-52 lg:w-56">
      <div
        className="relative h-40 w-full [transform-style:preserve-3d] transition-all duration-500 cursor-pointer"
        style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        onClick={handleClick}
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
      >
        {/* Front */}
        <div className="absolute inset-0 bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center backface-hidden flex flex-col items-center justify-center border border-gray-100">
          <Image
            src={pokemon.imageOfficial || pokemon.image}
            alt={pokemon.name}
            width={100}
            height={100}
            className="mx-auto object-contain drop-shadow-md"
            quality={90}
            priority={priority}
          />
          <span className="capitalize text-lg font-medium block mt-2">
            {pokemon.name}
          </span>
        </div>
        {/* Back */}
        <div className="absolute inset-0 bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center [transform:rotateY(180deg)] backface-hidden flex flex-col justify-center border border-gray-100">
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
  );
}


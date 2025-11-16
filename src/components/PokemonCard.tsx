"use client";
import { useEffect, useState } from "react";
import { PokemonDetails } from "@/types/pokemon";
import TypeChip from "./TypeChip";
import InfoChip from "./InfoChip";

export default function PokemonCard({ pokemon }: { pokemon: PokemonDetails }) {
  const [isShiny, setIsShiny] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsShiny((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const imageUrl = isShiny
    ? pokemon.sprites.other["official-artwork"].front_shiny
    : pokemon.sprites.other["official-artwork"].front_default;

  // Convert height/weight to proper units
  const heightInMeters = (pokemon.height / 10).toFixed(1);
  const weightInKg = (pokemon.weight / 10).toFixed(1);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200 capitalize px-4 py-8">
      <div className="w-full max-w-md p-6 sm:p-10 bg-white rounded-3xl shadow-2xl transform hover:scale-90 transition duration-300">
        {/* Image Container */}
        <div className="w-40 h-40 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 border-2 border-orange-200 p-4 flex items-center justify-center shadow-inner">
          <img
            src={imageUrl}
            alt={pokemon.name}
            className="w-28 h-28 object-contain drop-shadow-md"
          />
        </div>

        {/* Name - More prominent styling */}
        <h1 className="text-center text-3xl font-bold text-gray-800 mb-4 relative">
          {pokemon.name}
          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-orange-400 rounded-full"></span>
        </h1>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
          <InfoChip
            label="Height"
            value={`${heightInMeters} m`}
            variant="measurement"
            icon="📏"
          />
          <InfoChip
            label="Weight"
            value={`${weightInKg} kg`}
            variant="measurement"
            icon="⚖️"
          />
          <InfoChip
            label="species"
            value={pokemon.species.name}
            variant="highlight"
            icon="🔍"
          />
        </div>

        {/* Abilities Section */}
        <div className="mb-4">
          {/* <h3 className="text-sm font-semibold text-gray-500 text-center">
            Abilities
          </h3> */}
          <div className="flex flex-wrap justify-center gap-2">
            {pokemon.abilities.map((ability, index) => (
              <InfoChip
                key={index}
                label=""
                value={ability.ability.name}
                variant="ability"
              />
            ))}
          </div>
        </div>

        {/* Types Section */}
        <div className="mb-2">
          {/* <h3 className="text-sm font-semibold text-gray-500 mb-2 text-center">
            Types
          </h3> */}
          <div className="flex justify-center gap-2">
            {pokemon.types.map((typeObj, index) => (
              <TypeChip
                key={`${typeObj.type.name}-${index}`}
                type={typeObj.type.name}
                size="md"
              />
            ))}
          </div>
        </div>
        {/* Stats Section */}
        <div className="mt-4">
          {/* <h3 className="text-sm font-semibold text-gray-500 mb-2 text-center">
            Stats
          </h3> */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {pokemon.stats.map((statObj, index) => (
              <InfoChip
                key={index}
                label={statObj.stat.name.replace("-", " ")}
                value={statObj.base_stat}
                variant={statObj.stat.name as any}
                icon="📊"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

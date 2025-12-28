export function PokemonCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border-2 border-gray-200 animate-pulse">
      <div className="text-center">
        <div className="w-24 h-24 bg-gray-300 rounded-lg mx-auto mb-3"></div>
        <div className="h-5 bg-gray-300 rounded w-24 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
      </div>
    </div>
  );
}

export function PokemonListSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-gray-50 rounded-xl p-4 border border-gray-200 animate-pulse"
        >
          <div className="w-20 h-20 bg-gray-300 rounded-lg mx-auto mb-3"></div>
          <div className="h-4 bg-gray-300 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}

export function PokemonSelectorItemSkeleton() {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 animate-pulse">
      <div className="w-20 h-20 bg-gray-300 rounded-lg mx-auto mb-3"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
    </div>
  );
}


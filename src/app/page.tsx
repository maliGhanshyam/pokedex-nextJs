import Link from "next/link";
import { getPokemonList } from "@/services/pokeapi";
import { InfoChip } from "@/components";
import { SearchParams } from "@/types/propsInterface";

const PAGE_SIZE = 15;
const MAX_VISIBLE_PAGES = 5;

export default async function HomePage({ searchParams }: SearchParams) {
  const { page, search } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const searchTerm = search?.toLowerCase() || "";
  const offset = (currentPage - 1) * PAGE_SIZE;

  // Get full list if searching, paginated otherwise
  const data = await getPokemonList(
    searchTerm ? 1000 : PAGE_SIZE,
    searchTerm ? 0 : offset
  );

  // Filter by search term
  const filteredResults = searchTerm
    ? data.results.filter((pokemon) =>
        pokemon.name.toLowerCase().includes(searchTerm)
      )
    : data.results;

  // Slice only if searching
  const paginatedResults = searchTerm
    ? filteredResults.slice(offset, offset + PAGE_SIZE)
    : filteredResults;

  // Use correct count
  const totalCount = searchTerm ? filteredResults.length : data.count;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Pagination range
  const half = Math.floor(MAX_VISIBLE_PAGES / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);
  if (end - start < MAX_VISIBLE_PAGES - 1) {
    start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
  }

  return (
    <div className="p-8 bg-gradient-to-br from-orange-100 to-yellow-200">
      <ul className="flex flex-wrap gap-4 justify-center">
        {paginatedResults.map((pokemon) => (
          <li key={pokemon.name} className="group">
            <div className="w-48 md:w-48 lg:w-55">
              <div className="relative h-40 w-full [transform-style:preserve-3d] transition-all duration-500 group-hover:[transform:rotateY(180deg)]">
                {/* Front */}
                <div className="absolute inset-0 bg-white p-4 rounded shadow text-center backface-hidden flex flex-col items-center justify-center">
                  <img
                    src={pokemon.image}
                    alt={pokemon.name}
                    className="w-20 h-20 mx-auto object-contain"
                  />
                  <span className="capitalize text-lg font-medium block mt-2">
                    <InfoChip label="" value={pokemon.name} variant="defense" />
                  </span>
                </div>
                {/* Back */}
                <div className="absolute inset-0 bg-white p-4 rounded shadow text-center [transform:rotateY(180deg)] backface-hidden flex flex-col justify-center">
                  <div className="mb-2">
                    <span className="capitalize text-lg font-medium block">
                      {pokemon.name}
                    </span>
                    {pokemon.types && (
                      <p className="text-sm mt-1">
                        <span className="font-semibold">Type:</span>{" "}
                        {pokemon.types.map((t) => t.type.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/pokemon/${pokemon.name}`}
                    className="mt-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm hover:bg-orange-200 transition-colors inline-block"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-end items-center space-x-2">
          {currentPage > 1 && (
            <Link
              href={`/?page=${currentPage - 1}&search=${searchTerm}`}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Previous
            </Link>
          )}

          {Array.from({ length: end - start + 1 }, (_, i) => {
            const page = start + i;
            return (
              <Link
                key={page}
                href={`/?page=${page}&search=${searchTerm}`}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? "bg-orange-400 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {page}
              </Link>
            );
          })}

          {currentPage < totalPages && (
            <Link
              href={`/?page=${currentPage + 1}&search=${searchTerm}`}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

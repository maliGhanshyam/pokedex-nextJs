import Link from "next/link";
import { getPokemonList } from "@/services/pokeapi";
import { SearchParams } from "@/types/propsInterface";
import PokemonFlipCard from "@/components/PokemonFlipCard";
import LivePagination from "@/components/LivePagination";

const PAGE_SIZE = 15;
const MAX_VISIBLE_PAGES = 5;

export default async function HomePage({ searchParams }: SearchParams) {
  const { page, search } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const searchTerm = search?.toLowerCase() || "";
  const offset = (currentPage - 1) * PAGE_SIZE;

  let data;
  try {
    // Get full list if searching, paginated otherwise
    data = await getPokemonList(
      searchTerm ? 1000 : PAGE_SIZE,
      searchTerm ? 0 : offset
    );
  } catch (error) {
    // Only log essential error info to reduce console noise
    if (error instanceof Error) {
      const is502 = error.message.includes('502') || (error as any).originalError?.status === 502;
      if (is502) {
        console.error("Error loading pokemon: 502 Bad Gateway - Backend server unavailable");
      } else {
        console.error("Error loading pokemon:", error.message);
      }
    } else {
      console.error("Error loading pokemon:", "Unknown error");
    }
    
    // Return empty state if API fails
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to connect to the backend server. Please ensure the backend is running.";
    
    const is502Error = errorMessage.includes('502') || 
                       errorMessage.includes('Bad Gateway') ||
                       errorMessage.includes('ECONNREFUSED') ||
                       errorMessage.includes('ERR_NETWORK') ||
                       errorMessage.includes('No response from server');
    
    const is429Error = errorMessage.includes('429') || 
                       errorMessage.includes('Rate limit') ||
                       (error as any)?.originalError?.status === 429;
    
    return (
      <div className="p-4 sm:p-8 bg-gradient-to-br from-orange-100 to-yellow-200 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">{is502Error ? "⏳" : is429Error ? "⏸️" : "😢"}</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {is502Error ? "Server is waking up (free tier)" : is429Error ? "Rate Limited" : "Unable to Load Pokémon"}
          </h1>
          <p className="text-gray-600 mb-6">
            {is502Error 
              ? "This may take ~20 seconds. Please wait a moment and refresh the page."
              : is429Error
              ? "The API is temporarily rate-limited. Please wait a moment and refresh the page. The system will automatically retry."
              : errorMessage}
          </p>
          {(is502Error || is429Error) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>What's happening?</strong>
              </p>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                {is502Error ? (
                  <>
                    <li>Render.com free tier services sleep after inactivity</li>
                    <li>It can take 20-60 seconds for the server to wake up</li>
                    <li>Please wait a moment and refresh the page</li>
                  </>
                ) : (
                  <>
                    <li>The PokeAPI has rate limits to prevent abuse</li>
                    <li>The backend will automatically retry with exponential backoff</li>
                    <li>Please wait a moment and refresh the page</li>
                  </>
                )}
              </ul>
            </div>
          )}
          {(is502Error || is429Error) && (
            <Link
              href="/"
              className="mt-4 inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Retry Now
            </Link>
          )}
        </div>
      </div>
    );
  }

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

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-orange-100 to-yellow-200 min-h-screen">
      <ul className="flex flex-wrap gap-4 justify-center">
        {paginatedResults.map((pokemon, index) => (
          <li key={pokemon.name}>
            <PokemonFlipCard
              pokemon={pokemon}
              priority={currentPage === 1 && index < 6}
            />
          </li>
        ))}
      </ul>

      <LivePagination
        initialTotalCount={totalCount}
        currentPage={currentPage}
        searchTerm={searchTerm}
        pageSize={PAGE_SIZE}
        maxVisiblePages={MAX_VISIBLE_PAGES}
      />
    </div>
  );
}

"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchInput() {
  const router = useRouter();
  const params = useSearchParams();

  const initialQuery = params.get("search") || "";
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const currentPage = params.get("page") || "1";
      const trimmed = query.trim();

      router.push(`/?search=${trimmed}&page=${currentPage}`);
    }, 500); // ⏳ debounce delay (ms)

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={query}
        placeholder="Search Pokémon..."
        onChange={(e) => setQuery(e.target.value)}
        className="px-2 py-1 border rounded text-sm sm:text-base w-32 sm:w-auto min-w-[120px]"
      />
    </div>
  );
}

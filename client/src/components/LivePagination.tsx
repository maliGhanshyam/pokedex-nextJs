'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getPokemonCount } from '@/services/pokeapi';

const POLL_INTERVAL_MS = 4000;
const EXPECTED_MIN_COUNT = 1000;
const MESSAGE_CYCLE_MS = 5000;

const SYNC_FLAVOR = [
  'Professor Oak is updating the Pokédex…',
  'Scanning routes for new species…',
  'A wild database approaches…',
  'Cataloging discoveries across the region…',
  'The dex fills itself, one catch at a time…',
];

interface LivePaginationProps {
  initialTotalCount: number;
  currentPage: number;
  searchTerm: string;
  pageSize: number;
  maxVisiblePages: number;
}

function PokeballIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="#1f2937" strokeWidth="1.5" />
      <path d="M2 12h20" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.2" fill="#f9fafb" stroke="#1f2937" strokeWidth="1.5" />
      <path d="M2 12a10 10 0 0 1 20 0" fill="#f9fafb" />
    </svg>
  );
}

function DexSyncIndicator({ count }: { count: number }) {
  const progress = Math.min(100, Math.round((count / EXPECTED_MIN_COUNT) * 100));
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % SYNC_FLAVOR.length);
    }, MESSAGE_CYCLE_MS);
    return () => clearInterval(timer);
  }, []);

  const tierLabel = useMemo(() => {
    if (progress < 15) return 'Kanto';
    if (progress < 35) return 'Johto';
    if (progress < 55) return 'Hoenn';
    if (progress < 75) return 'Sinnoh';
    if (progress < 95) return 'Unova';
    return 'National';
  }, [progress]);

  return (
    <div className="w-full max-w-md animate-fadeIn animate-dex-glow rounded-2xl border-2 border-gray-800 bg-gradient-to-br from-red-500 via-white to-white p-[3px] shadow-lg">
      <div className="rounded-[13px] bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <PokeballIcon className="h-9 w-9 animate-pokeball-spin drop-shadow-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">
              Pokédex · {tierLabel} expansion
            </p>
            <p
              key={messageIndex}
              className="truncate text-sm font-medium text-gray-800 animate-fadeIn"
            >
              {SYNC_FLAVOR[messageIndex]}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-black tabular-nums text-gray-900 leading-none">
              #{count.toLocaleString()}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              registered
            </p>
          </div>
        </div>

        <div className="mt-3 relative h-2 overflow-hidden rounded-full bg-gray-200/80 ring-1 ring-gray-300/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 transition-all duration-700 ease-out"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
          <div className="pointer-events-none absolute inset-0 animate-dex-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}

export default function LivePagination({
  initialTotalCount,
  currentPage,
  searchTerm,
  pageSize,
  maxVisiblePages,
}: LivePaginationProps) {
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isSyncing, setIsSyncing] = useState(
    !searchTerm && initialTotalCount < EXPECTED_MIN_COUNT,
  );
  const lastCountRef = useRef(initialTotalCount);

  useEffect(() => {
    setTotalCount(initialTotalCount);
    lastCountRef.current = initialTotalCount;
  }, [initialTotalCount]);

  useEffect(() => {
    if (searchTerm) {
      setIsSyncing(false);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const count = await getPokemonCount();
        if (cancelled) return;

        if (count > lastCountRef.current) {
          setIsSyncing(true);
        } else if (count >= EXPECTED_MIN_COUNT) {
          setIsSyncing(false);
        }

        lastCountRef.current = count;
        setTotalCount(count);
      } catch {
        // Ignore poll errors; pagination keeps last known count
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [searchTerm]);

  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1 && !isSyncing) {
    return null;
  }

  const half = Math.floor(maxVisiblePages / 2);
  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + maxVisiblePages - 1);
  if (end - start < maxVisiblePages - 1) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';

  return (
    <div className="mt-8 flex flex-col items-center gap-5 px-4">
      {isSyncing && <DexSyncIndicator count={totalCount} />}

      {totalPages > 1 && (
        <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:justify-end">
          {currentPage > 1 && (
            <Link
              href={`/?page=${currentPage - 1}${searchQuery}`}
              className="rounded-lg bg-gray-200 px-3 py-1 transition-colors hover:bg-gray-300"
            >
              Previous
            </Link>
          )}

          {Array.from({ length: end - start + 1 }, (_, i) => {
            const page = start + i;
            return (
              <Link
                key={page}
                href={`/?page=${page}${searchQuery}`}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  currentPage === page
                    ? 'bg-orange-400 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {page}
              </Link>
            );
          })}

          {currentPage < totalPages && (
            <Link
              href={`/?page=${currentPage + 1}${searchQuery}`}
              className="rounded-lg bg-gray-200 px-3 py-1 transition-colors hover:bg-gray-300"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

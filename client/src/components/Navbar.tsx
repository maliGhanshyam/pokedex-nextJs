"use client";

import Link from "next/link";
import { Suspense, useState, useRef, useEffect } from "react";
import SearchBar from "./SearchBar";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "./LoginModal";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    setShowProfileDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const displayName = user?.name || user?.username || user?.email || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <nav className="bg-gray-800 text-white px-4 sm:px-6 py-3 sm:py-4 shadow-md sticky top-0 z-40">
        <div className="container mx-auto">
          {/* Mobile Layout */}
          <div className="flex flex-col lg:hidden gap-3">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="text-xl sm:text-2xl font-bold text-yellow-400 hover:text-yellow-300 transition"
              >
                PokéDex
              </Link>
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-sm font-bold text-white hover:ring-2 hover:ring-orange-300 transition"
                  >
                    {initials}
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/favorites"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Favorites
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded transition-colors text-sm"
                >
                  Login
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <Link href="/" className="hover:text-yellow-400 transition px-2 py-1">
                Home
              </Link>
              <Link href="/about" className="hover:text-yellow-400 transition px-2 py-1">
                About
              </Link>
              <Link href="/contactUs" className="hover:text-yellow-400 transition px-2 py-1">
                Contact
              </Link>
              <Link href="/games" className="hover:text-yellow-400 transition px-2 py-1">
                🎮 Games
              </Link>
            </div>
            <div className="w-full">
              <Suspense
                fallback={
                  <div className="w-full h-8 bg-gray-700 rounded animate-pulse"></div>
                }
              >
                <SearchBar />
              </Suspense>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between gap-6">
            <Link
              href="/"
              className="text-2xl font-bold text-yellow-400 hover:text-yellow-300 transition flex-shrink-0"
            >
              PokéDex
            </Link>
            
            <div className="flex items-center gap-6 flex-1">
              <Link href="/" className="hover:text-yellow-400 transition whitespace-nowrap">
                Home
              </Link>
              <Link href="/about" className="hover:text-yellow-400 transition whitespace-nowrap">
                About
              </Link>
              <Link href="/contactUs" className="hover:text-yellow-400 transition whitespace-nowrap">
                Contact Us
              </Link>
              <Link href="/games" className="hover:text-yellow-400 transition whitespace-nowrap">
                🎮 Games
              </Link>
              {isAuthenticated && (
                <Link
                  href="/favorites"
                  className="hover:text-yellow-400 transition flex items-center gap-1 whitespace-nowrap"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-red-500 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  Favorites
                </Link>
              )}
              <div className="flex-1 max-w-md">
                <Suspense
                  fallback={
                    <div className="w-full h-8 bg-gray-700 rounded animate-pulse"></div>
                  }
                >
                  <SearchBar />
                </Suspense>
              </div>
            </div>

            {isAuthenticated ? (
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 hover:bg-gray-700 rounded-lg px-3 py-2 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-sm font-bold text-white">
                    {initials}
                  </div>
                  <span className="hidden xl:block text-sm text-gray-300 max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      showProfileDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      {user?.username && (
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      )}
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/favorites"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      Favorites
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded transition-colors whitespace-nowrap flex-shrink-0"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default Navbar;

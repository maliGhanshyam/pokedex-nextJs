"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import SearchBar from "./SearchBar";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "./LoginModal";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <nav className="bg-gray-800 text-white px-4 sm:px-6 py-4 shadow-md">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link
            href="/"
            className="text-2xl sm:text-3xl font-bold text-yellow-400 hover:text-yellow-300 transition"
          >
            PokéDex
          </Link>
          <ul className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-sm sm:text-base">
            <li>
              <Link href="/" className="hover:text-yellow-400 transition">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-yellow-400 transition">
                About
              </Link>
            </li>
            <li>
              <Link
                href="/contactUs"
                className="hover:text-yellow-400 transition"
              >
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/games" className="hover:text-yellow-400 transition">
                🎮 Games
              </Link>
            </li>
            {isAuthenticated && (
              <li>
                <Link
                  href="/favorites"
                  className="hover:text-yellow-400 transition flex items-center gap-1"
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
              </li>
            )}
            <li>
              <Suspense
                fallback={
                  <div className="w-32 h-8 bg-gray-700 rounded animate-pulse"></div>
                }
              >
                <SearchBar />
              </Suspense>
            </li>
            {isAuthenticated ? (
              <>
                <li className="text-sm text-gray-300">{user?.email}</li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 rounded transition-colors"
                >
                  Login
                </button>
              </li>
            )}
          </ul>
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

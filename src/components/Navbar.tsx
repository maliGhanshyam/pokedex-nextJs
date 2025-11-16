"use client";

import Link from "next/link";
import SearchBar from "./SearchBar";

const Navbar = () => {
  return (
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
            <SearchBar />
          </li>
          {/* Add more links if needed */}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

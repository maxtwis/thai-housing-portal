import React, { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav className="bg-gradient-to-r from-blue-800 to-blue-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <a href="/" className="text-white font-bold text-xl">
                Housing Data Analytics Platform
              </a>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a
                  href="/"
                  className="text-white hover:bg-blue-700 rounded-md px-3 py-2 text-sm font-medium"
                >
                  Homepage
                </a>
                <a
                  href="/housing-profile"
                  className="text-white hover:bg-blue-700 rounded-md px-3 py-2 text-sm font-medium"
                >
                  Housing Profile
                </a>
                <a
                  href="/housing-stock"
                  className="text-white hover:bg-blue-700 rounded-md px-3 py-2 text-sm font-medium"
                >
                  Housing Stock
                </a>
                <a
                  href="/about"
                  className="text-white hover:bg-blue-700 rounded-md px-3 py-2 text-sm font-medium"
                >
                  About
                </a>
              </div>
            </div>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={isOpen ? "md:hidden" : "hidden"}>
        <div className="space-y-1 px-2 pb-3 pt-2">
          <a
            href="/"
            className="text-white hover:bg-blue-700 block rounded-md px-3 py-2 text-base font-medium"
            onClick={() => setIsOpen(false)}
          >
            Housing Profile
          </a>
          <a
            href="/housing-stock"
            className="text-white hover:bg-blue-700 block rounded-md px-3 py-2 text-base font-medium"
            onClick={() => setIsOpen(false)}
          >
            Housing Stock
          </a>
          <a
            href="/about"
            className="text-white hover:bg-blue-700 block rounded-md px-3 py-2 text-base font-medium"
            onClick={() => setIsOpen(false)}
          >
            About
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
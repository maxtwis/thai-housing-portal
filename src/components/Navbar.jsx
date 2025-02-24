import React, { useState } from 'react';
import { Search, Database, Home, Building2, Info } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const navigationItems = [
    { path: '/', name: 'Homepage', icon: Database },
    { path: '/housing-profile', name: 'Housing Profile', icon: Home },
    { path: '/housing-stock', name: 'Housing Stock', icon: Building2 },
    { path: '/about', name: 'About', icon: Info }
  ];

  return (
    <nav className="bg-primary-600 bg-gradient-to-r from-blue-800 to-blue-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <a href="/" className="text-white font-bold text-xl flex items-center">
                <Database className="mr-2" />
                Thailand Housing Data Portal
              </a>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigationItems.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-blue-700`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navigationItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
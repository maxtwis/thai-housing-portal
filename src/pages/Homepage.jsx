import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate to datasets page with search query
    navigate(`/datasets?search=${encodeURIComponent(searchQuery)}`);
  };

  // Mock featured datasets
  const featuredDatasets = [
    { id: 1, title: "Population by Age Group", org: "National Statistics Office" },
    { id: 2, title: "Housing Supply by Type", org: "Department of Lands" },
    { id: 3, title: "Income Distribution", org: "Economic Planning Unit" }
  ];

  // Mock participating organizations
  const organizations = [
    { id: 1, name: "National Statistics Office", datasets: 45 },
    { id: 2, name: "Department of Lands", datasets: 28 },
    { id: 3, name: "National Housing Authority", datasets: 15 },
    { id: 4, name: "Urban Studies Lab", datasets: 15 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-6">
            Thailand Housing Data Portal
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Access and analyze comprehensive housing data across Thailand
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for datasets (e.g. population, housing supply)"
                className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 p-1 rounded-md bg-blue-600 text-white"
              >
                <Search size={24} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl font-bold text-blue-600 mb-2">103</div>
            <div className="text-gray-600">Available Datasets</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl font-bold text-blue-600 mb-2">24</div>
            <div className="text-gray-600">Contributing Organizations</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl font-bold text-blue-600 mb-2">4</div>
            <div className="text-gray-600">Major Cities Covered</div>
          </div>
        </div>

        {/* Featured Datasets */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Datasets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDatasets.map(dataset => (
              <div key={dataset.id} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">{dataset.title}</h3>
                <p className="text-gray-600 text-sm">{dataset.org}</p>
                <button className="mt-4 text-blue-600 text-sm font-medium">
                  View Dataset →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Organizations */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Participating Organizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {organizations.map(org => (
              <div key={org.id} className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{org.name}</h3>
                  <p className="text-gray-600 text-sm">{org.datasets} datasets</p>
                </div>
                <button className="text-blue-600 text-sm font-medium">
                  View Profile →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-gray-600">
          <p className="mb-2">
            The Thailand Housing Data Analytics Platform is a collaborative effort to provide comprehensive housing data.
          </p>
          <p>
            For more information, please contact our support team or visit the documentation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
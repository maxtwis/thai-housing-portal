import React, { useState, useEffect } from 'react';
import { getCkanData } from '../utils/ckanClient';

const ApartmentSupply = () => {
  const [apartmentData, setApartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    roomType: 'all'
  });

  useEffect(() => {
    const loadApartmentData = async () => {
      try {
        console.log('Loading apartment data from CKAN API...');
        
        const result = await getCkanData('b6dbb8e0-1194-4eeb-945d-e883b3275b35', {
          limit: 1000,
          sort: 'apartment_id asc'
        });
        
        if (!result || !result.records) {
          throw new Error('No data received from CKAN API');
        }
        
        console.log(`Loaded ${result.records.length} apartment records`);
        setApartmentData(result.records);
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading apartment data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadApartmentData();
  }, []);

  // Filter apartments based on current filters
  const filteredApartments = apartmentData.filter(apartment => {
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      const price = apartment.price_min || 0;
      if (max) {
        if (price < min || price > max) return false;
      } else {
        if (price < min) return false;
      }
    }
    
    if (filters.roomType !== 'all') {
      if (apartment.room_type !== filters.roomType) return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Apartment Supply Analysis</h1>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading apartment data from CKAN API...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Apartment Supply Analysis</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Data</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="text-sm text-red-600">
              <p><strong>Troubleshooting:</strong></p>
              <ul className="list-disc list-inside mt-2">
                <li>Check CKAN server connectivity</li>
                <li>Verify resource ID: b6dbb8e0-1194-4eeb-945d-e883b3275b35</li>
                <li>Check CORS proxy configuration</li>
              </ul>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Apartment Supply Analysis</h1>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Apartments</h3>
            <p className="text-3xl font-bold text-blue-600">{apartmentData.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700">Filtered Results</h3>
            <p className="text-3xl font-bold text-green-600">{filteredApartments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700">Avg Price</h3>
            <p className="text-3xl font-bold text-purple-600">
              ฿{Math.round(apartmentData.reduce((sum, apt) => sum + (apt.price_min || 0), 0) / apartmentData.length).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700">Room Types</h3>
            <p className="text-3xl font-bold text-orange-600">
              {[...new Set(apartmentData.map(apt => apt.room_type).filter(Boolean))].length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
              >
                <option value="all">All Prices</option>
                <option value="0-5000">Under ฿5,000</option>
                <option value="5000-10000">฿5,000 - ฿10,000</option>
                <option value="10000-20000">฿10,000 - ฿20,000</option>
                <option value="20000-999999">Above ฿20,000</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={filters.roomType}
                onChange={(e) => setFilters({...filters, roomType: e.target.value})}
              >
                <option value="all">All Types</option>
                {[...new Set(apartmentData.map(apt => apt.room_type).filter(Boolean))].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Apartment List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Apartments ({filteredApartments.length} results)
          </h2>
          
          {filteredApartments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No apartments match your filters</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApartments.slice(0, 20).map((apartment) => (
                <div 
                  key={apartment.apartment_id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedApartment(apartment)}
                >
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {apartment.apartment_name || `Apartment ${apartment.apartment_id}`}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Type:</strong> {apartment.room_type || 'N/A'}</p>
                    <p><strong>Size:</strong> {apartment.size_min || 'N/A'} - {apartment.size_max || 'N/A'} sqm</p>
                    <p><strong>Price:</strong> ฿{(apartment.price_min || 0).toLocaleString()} - ฿{(apartment.price_max || 0).toLocaleString()}</p>
                    <p><strong>Location:</strong> {apartment.latitude?.toFixed(4) || 'N/A'}, {apartment.longitude?.toFixed(4) || 'N/A'}</p>
                  </div>
                  
                  {/* Facilities Preview */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {apartment.facility_wifi > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">WiFi</span>
                    )}
                    {apartment.facility_parking > 0 && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Parking</span>
                    )}
                    {apartment.facility_pool > 0 && (
                      <span className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded">Pool</span>
                    )}
                    {apartment.facility_gym > 0 && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Gym</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {filteredApartments.length > 20 && (
            <div className="mt-6 text-center text-gray-500">
              Showing first 20 of {filteredApartments.length} results
            </div>
          )}
        </div>

        {/* Selected Apartment Details Modal */}
        {selectedApartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedApartment.apartment_name || `Apartment ${selectedApartment.apartment_id}`}
                  </h2>
                  <button 
                    onClick={() => setSelectedApartment(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Room Type:</strong> {selectedApartment.room_type || 'N/A'}</p>
                      <p><strong>Size:</strong> {selectedApartment.size_min || 'N/A'} - {selectedApartment.size_max || 'N/A'} sqm</p>
                      <p><strong>Price:</strong> ฿{(selectedApartment.price_min || 0).toLocaleString()} - ฿{(selectedApartment.price_max || 0).toLocaleString()}</p>
                      <p><strong>Address:</strong> {selectedApartment.address || 'N/A'}</p>
                      <p><strong>Coordinates:</strong> {selectedApartment.latitude?.toFixed(6) || 'N/A'}, {selectedApartment.longitude?.toFixed(6) || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Facilities</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedApartment)
                        .filter(([key, value]) => key.startsWith('facility_') && value > 0)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {key.replace('facility_', '').replace('_', ' ')}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentSupply;
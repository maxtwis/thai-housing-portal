import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import StockMap from '../components/housing-stock/StockMap';
import Filters from '../components/housing-stock/Filters';
import Statistics from '../components/housing-stock/Statistics';

const HousingStock = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buildingData, setBuildingData] = useState(null);
  const [colorScheme, setColorScheme] = useState('buildingType');
  const [filters, setFilters] = useState({
    buildingType: 'all',
    stories: 'all',
    rentRange: 'all',
    accessibility: 'all'
  });
  const [stats, setStats] = useState({
    totalBuildings: 0,
    averageStories: 0,
    totalHouseholds: 0,
    averageRent: 0,
    buildingTypes: {},
    accessibility: {
      goodTransport: 0,
      goodHealthcare: 0
    }
  });

  // Load CSV data
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch('/data/bldg_pkn_data.csv');
        if (!response.ok) throw new Error('Failed to load CSV data');
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('CSV Data loaded:', results.data.length, 'rows');
            const data = results.data;
            setBuildingData(data);
            
            // Calculate statistics
            const validData = data.filter(row => row.STOREY && row.House_rentcost);
            const buildingTypes = {};
            data.forEach(row => {
              if (row.TP_build) {
                buildingTypes[row.TP_build] = (buildingTypes[row.TP_build] || 0) + 1;
              }
            });
            
            const goodTransport = data.filter(row => 
              (row.Facility_transportation || 999) < 1 || 
              (row.Facility_metro || 999) < 1 || 
              (row.Facility_busstop || 999) < 0.5
            ).length;
            
            const goodHealthcare = data.filter(row =>
              (row.Facility_hospital || 999) < 2 ||
              (row.Facility_healthcenter || 999) < 1 ||
              (row.Facility_pharmarcy || 999) < 0.5
            ).length;

            setStats({
              totalBuildings: data.length,
              averageStories: validData.reduce((acc, curr) => acc + (curr.STOREY || 0), 0) / validData.length || 0,
              totalHouseholds: data.reduce((acc, curr) => acc + (curr.Household_member_total || 0), 0),
              averageRent: validData.reduce((acc, curr) => acc + (curr.House_rentcost || 0), 0) / validData.length || 0,
              buildingTypes,
              accessibility: {
                goodTransport: (goodTransport / data.length) * 100,
                goodHealthcare: (goodHealthcare / data.length) * 100
              }
            });

            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setError('Failed to parse building data');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV data:', error);
        setError('Failed to load building data');
        setLoading(false);
      }
    };

    loadCSVData();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="container mx-auto px-4 py-4 h-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Housing Stock Analysis</h1>
          <p className="text-gray-600 mt-2">
            Explore building-level data including types, occupancy, and accessibility metrics.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)]">
          {/* Left Panel */}
          <div className="w-full lg:w-1/4 space-y-4 overflow-auto">
            <Filters 
              filters={filters} 
              setFilters={setFilters}
              colorScheme={colorScheme}
              setColorScheme={setColorScheme}
            />
            <Statistics stats={stats} />
          </div>

          {/* Right Panel - Map */}
          <div className="w-full lg:w-3/4 h-full">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-3 text-gray-600">Loading map data...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                  <p className="text-red-800">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <StockMap 
              filters={filters}
              colorScheme={colorScheme}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HousingStock;
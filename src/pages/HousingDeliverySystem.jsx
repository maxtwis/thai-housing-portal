import React, { useState, useEffect } from 'react';
import HDSMap from '../components/housing-delivery-system/HDSMap';
import HDSFilters from '../components/housing-delivery-system/HDSFilters';
import HDSStatistics from '../components/housing-delivery-system/HDSStatistics';

const HousingDeliverySystem = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hdsData, setHdsData] = useState(null);
  const [colorScheme, setColorScheme] = useState('housingSystem');
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(40); // Default to ขอนแก่น
  const [filters, setFilters] = useState({
    housingSystem: 'all',
    densityLevel: 'all',
    populationRange: 'all'
  });
  const [stats, setStats] = useState({
    totalGrids: 0,
    totalPopulation: 0,
    totalHousing: 0,
    averageDensity: 0,
    housingSystems: {},
    densityLevels: {},
    problemAreas: {
      supply: 0,
      subsidies: 0,
      stability: 0
    }
  });

  // Available provinces - UPDATED TO INCLUDE SONGKHLA
  const provinces = [
    { id: 40, name: 'ขอนแก่น', file: '/data/HDS_KKN01.geojson' },
    { id: 50, name: 'เชียงใหม่', file: '/data/HDS_CNX_02GJSON.geojson' },
    { id: 90, name: 'สงขลา', file: '/data/HDS_HYT.geojson' }
  ];

  // Get current province info
  const getCurrentProvince = () => {
    return provinces.find(p => p.id === selectedProvince) || provinces[0];
  };

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Always show filters on desktop
      if (window.innerWidth >= 768) {
        setShowFilters(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle filters visibility on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle grid selection
  const handleGridSelect = (gridData) => {
    setSelectedGrid(gridData);
  };

  // Handle clearing selection
  const handleClearSelection = () => {
    setSelectedGrid(null);
  };

  // Handle province change
  const handleProvinceChange = (provinceId) => {
    setSelectedProvince(provinceId);
    setSelectedGrid(null); // Clear selection when province changes
  };

  // Load HDS data when province changes
  useEffect(() => {
    const loadHDSData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const currentProvince = getCurrentProvince();
        const response = await fetch(currentProvince.file);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setHdsData(data);
        
        // Calculate statistics from loaded data
        if (data && data.features) {
          const features = data.features;
          const totalGrids = features.length;
          let totalPopulation = 0;
          let totalHousing = 0;
          const housingSystems = {};
          const densityLevels = {};
          
          features.forEach(feature => {
            const props = feature.properties;
            
            // Sum population and housing
            totalPopulation += props.Grid_POP || 0;
            totalHousing += props.Grid_HOU || 0;
            
            // Count housing systems
            for (let i = 1; i <= 7; i++) {
              const systemKey = `HDS_C${i}_num`;
              const systemValue = props[systemKey] || 0;
              if (systemValue > 0) {
                const systemName = `ระบบที่ ${i}`;
                housingSystems[systemName] = (housingSystems[systemName] || 0) + systemValue;
              }
            }
            
            // Count density levels
            const densityLevel = props.Grid_Class;
            if (densityLevel) {
              const levelName = `ระดับ ${densityLevel}`;
              densityLevels[levelName] = (densityLevels[levelName] || 0) + 1;
            }
          });
          
          setStats({
            totalGrids,
            totalPopulation,
            totalHousing,
            averageDensity: totalGrids > 0 ? totalPopulation / totalGrids : 0,
            housingSystems,
            densityLevels,
            problemAreas: {
              supply: Math.floor(totalGrids * 0.1), // Example calculation
              subsidies: Math.floor(totalGrids * 0.05),
              stability: Math.floor(totalGrids * 0.15)
            }
          });
        }
      } catch (err) {
        console.error('Error loading HDS data:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadHDSData();
  }, [selectedProvince]);

  const currentProvince = getCurrentProvince();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
                Housing Delivery System Analysis
              </h1>
              <p className="text-gray-600 mt-1">
                Analysis of housing delivery systems and population distribution in Thailand
              </p>
            </div>

            {/* Province Selector */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Select Province</h3>
              <div className="flex flex-wrap gap-2">
                {provinces.map(province => (
                  <button
                    key={province.id}
                    onClick={() => handleProvinceChange(province.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedProvince === province.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {province.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Toggle for Mobile */}
        {isMobile && (
          <div className="mb-4">
            <button
              onClick={toggleFilters}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        )}

        {/* Main Content */}
        {isMobile ? (
          // Mobile Layout - Stack vertically
          <div className="space-y-4">
            {/* Filters */}
            {showFilters && (
              <div className="bg-white rounded-lg shadow-md">
                <HDSFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  colorScheme={colorScheme}
                  onColorSchemeChange={setColorScheme}
                  isMobile={true}
                />
              </div>
            )}

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-md">
              <HDSStatistics
                stats={stats}
                selectedGrid={selectedGrid}
                onClearSelection={handleClearSelection}
                isMobile={true}
                provinceName={currentProvince.name}
              />
            </div>

            {/* Map */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: "60vh" }}>
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Loading HDS data for {currentProvince.name}...</p>
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

              <HDSMap 
                filters={filters}
                colorScheme={colorScheme}
                isMobile={isMobile}
                onGridSelect={handleGridSelect}
                selectedGrid={selectedGrid}
                selectedProvince={selectedProvince}
              />
            </div>
          </div>
        ) : (
          // Desktop Layout - NEW REDESIGNED LAYOUT
          // Map on LEFT (full-size), Filters/Stats on RIGHT (sidebar)
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* MAP CONTAINER - NOW ON LEFT SIDE (8 columns) */}
            <div className="col-span-8 relative">
              <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
                {loading && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-3 text-gray-600">Loading HDS data for {currentProvince.name}...</p>
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

                <HDSMap 
                  filters={filters}
                  colorScheme={colorScheme}
                  isMobile={isMobile}
                  onGridSelect={handleGridSelect}
                  selectedGrid={selectedGrid}
                  selectedProvince={selectedProvince}
                />
              </div>
            </div>

            {/* RIGHT SIDEBAR - NOW ON RIGHT SIDE (4 columns) */}
            <div className="col-span-4 flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md flex-shrink-0 mb-4">
                <HDSFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  colorScheme={colorScheme}
                  onColorSchemeChange={setColorScheme}
                  isMobile={false}
                />
              </div>

              {/* Statistics - Takes remaining space */}
              <div className="bg-white rounded-lg shadow-md flex-1 overflow-y-auto">
                <HDSStatistics
                  stats={stats}
                  selectedGrid={selectedGrid}
                  onClearSelection={handleClearSelection}
                  isMobile={false}
                  provinceName={currentProvince.name}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HousingDeliverySystem;
import React, { useState, useEffect } from 'react';
import HDSMap from '../components/housing-delivery-system/HDSMap';
import HDSFilters from '../components/housing-delivery-system/HDSFilters';
import HDSStatistics from '../components/housing-delivery-system/HDSStatistics';
import { useSupplyData } from '../hooks/useSupplyData';

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

  // Fetch supply data from CKAN API with province filtering
  const { data: supplyData, isLoading: supplyLoading, error: supplyError } = useSupplyData(selectedProvince);

  // Get current province
  const getCurrentProvince = () => {
    return provinces.find(p => p.id === selectedProvince) || provinces[0];
  };

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load HDS data when province changes
  useEffect(() => {
    const loadHDSData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentProvince = getCurrentProvince();
        const response = await fetch(currentProvince.file);
        
        if (!response.ok) {
          throw new Error(`Failed to load data for ${currentProvince.name}`);
        }
        
        const geojsonData = await response.json();
        setHdsData(geojsonData);
        
        // Calculate statistics from features
        const features = geojsonData.features || [];
        console.log(`Loaded ${features.length} features for ${currentProvince.name}`);
        
        let totalPop = 0;
        let totalHousing = 0;
        const housingSystems = {
          HDS_C1: 0, // ระบบชุมชนบุกรุก
          HDS_C2: 0, // ระบบถือครองชั่วคราว
          HDS_C3: 0, // ระบบกลุ่มประชากรแฝง
          HDS_C4: 0, // ระบบที่อยู่อาศัยลูกจ้าง
          HDS_C5: 0, // ระบบที่อยู่อาศัยรัฐ
          HDS_C6: 0, // ระบบที่อยู่อาศัยรัฐสนับสนุน
          HDS_C7: 0  // ระบบที่อยู่อาศัยเอกชน
        };
        const densityLevels = {};
        let problemStability = 0;
        let problemSubsidies = 0;
        let problemSupply = 0;

        features.forEach(feature => {
          const props = feature.properties;
          
          // Add to totals
          totalPop += props.Grid_POP || 0;
          totalHousing += props.Grid_House || 0;
          
          // Count housing systems
          housingSystems.HDS_C1 += props.HDS_C1_num || 0;
          housingSystems.HDS_C2 += props.HDS_C2_num || 0;
          housingSystems.HDS_C3 += props.HDS_C3_num || 0;
          housingSystems.HDS_C4 += props.HDS_C4_num || 0;
          housingSystems.HDS_C5 += props.HDS_C5_num || 0;
          housingSystems.HDS_C6 += props.HDS_C6_num || 0;
          housingSystems.HDS_C7 += props.HDS_C7_num || 0;
          
          // Count density levels
          const densityClass = props.Grid_Class;
          if (densityClass) {
            densityLevels[densityClass] = (densityLevels[densityClass] || 0) + 1;
          }
          
          // Count problem areas
          if (props.Stability_) problemStability++;
          if (props.Subsidies_) problemSubsidies++;
          if (props.Supply_Pro) problemSupply++;
        });

        const totalGrids = features.length;
        const averageDensity = totalGrids > 0 ? 
          Math.round((totalPop / totalGrids) / 10) * 10 : 0;

        setStats({
          totalGrids,
          totalPopulation: totalPop,
          totalHousing,
          averageDensity,
          housingSystems,
          densityLevels,
          problemAreas: {
            supply: totalGrids > 0 ? (problemSupply / totalGrids) * 100 : 0,
            subsidies: totalGrids > 0 ? (problemSubsidies / totalGrids) * 100 : 0,
            stability: totalGrids > 0 ? (problemStability / totalGrids) * 100 : 0
          }
        });
        
      } catch (err) {
        console.error('Error loading HDS data:', err);
        setError(err.message || 'Failed to load HDS data');
      } finally {
        setLoading(false);
      }
    };

    loadHDSData();
  }, [selectedProvince]);

  // Handle grid selection
  const handleGridSelect = (gridData) => {
    setSelectedGrid(gridData);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedGrid(null);
  };

  // Toggle filters for mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const currentProvince = getCurrentProvince();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">
            ระบบการจัดการที่อยู่อาศัย (Housing Delivery System)
          </h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {isMobile ? (
            // Mobile Layout - Stack vertically with province selector at top
            <div className="h-full overflow-y-auto p-4 space-y-4">
              {/* Province Selector - Mobile */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  เลือกจังหวัด
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {provinces.map(province => (
                    <button
                      key={province.id}
                      onClick={() => setSelectedProvince(province.id)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedProvince === province.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {province.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Toggle for Mobile */}
              <button
                onClick={toggleFilters}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>

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
                  supplyData={supplyData}
                />
              </div>

              {/* Map */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden relative" style={{ height: "60vh" }}>
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
                  supplyData={supplyData}
                />
              </div>
            </div>
          ) : (
            // Desktop Layout - Side by side with province selector above filters
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* Sidebar */}
              <div className="col-span-4 space-y-4">
                {/* Province Selector - Desktop */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    เลือกจังหวัด
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {provinces.map(province => (
                      <button
                        key={province.id}
                        onClick={() => setSelectedProvince(province.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedProvince === province.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {province.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md">
                  <HDSFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    colorScheme={colorScheme}
                    onColorSchemeChange={setColorScheme}
                    isMobile={false}
                  />
                </div>

                {/* Statistics */}
                <div className="bg-white rounded-lg shadow-md">
                  <HDSStatistics
                    stats={stats}
                    selectedGrid={selectedGrid}
                    onClearSelection={handleClearSelection}
                    isMobile={false}
                    provinceName={currentProvince.name}
                    supplyData={supplyData}
                  />
                </div>
              </div>

              {/* Map */}
              <div className="col-span-8 relative">
                <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: "calc(100vh - 240px)" }}>
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
                    isMobile={false}
                    onGridSelect={handleGridSelect}
                    selectedGrid={selectedGrid}
                    selectedProvince={selectedProvince}
                    supplyData={supplyData}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousingDeliverySystem;
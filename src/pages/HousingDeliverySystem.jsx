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

  // Handle URL parameters - UPDATED TO INCLUDE SONGKHLA
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const provinceParam = urlParams.get('province');
    
    if (provinceParam) {
      // Handle both numeric IDs and string codes
      let provinceId;
      if (provinceParam === 'kkn' || provinceParam === 'khonkaen') {
        provinceId = 40;
      } else if (provinceParam === 'cnx' || provinceParam === 'chiangmai') {
        provinceId = 50;
      } else if (provinceParam === 'hyt' || provinceParam === 'songkhla') {
        provinceId = 90;
      } else {
        provinceId = parseInt(provinceParam);
      }
      
      // Validate province exists
      if (provinces.find(p => p.id === provinceId)) {
        setSelectedProvince(provinceId);
      }
    }
  }, []);

  // Update URL when province changes
  useEffect(() => {
    const url = new URL(window.location);
    url.searchParams.set('province', selectedProvince.toString());
    window.history.replaceState({}, '', url);
  }, [selectedProvince]);

  // Load GeoJSON data and calculate statistics
  useEffect(() => {
    const loadHDSData = async () => {
      setLoading(true);
      setError(null);
      
      const currentProvince = getCurrentProvince();
      console.log(`Loading HDS data for ${currentProvince.name}...`);
      
      try {
        const response = await fetch(currentProvince.file);
        if (!response.ok) {
          throw new Error(`Failed to load HDS GeoJSON data for ${currentProvince.name} (${response.status})`);
        }
        
        const geojsonData = await response.json();
        
        console.log(`HDS Data loaded for ${currentProvince.name}:`, geojsonData.features.length, 'features');
        setHdsData(geojsonData);
        
        // Calculate statistics
        const features = geojsonData.features;
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
        const averageDensity = totalGrids > 0 ? totalPop / totalGrids : 0;

        setStats({
          totalGrids,
          totalPopulation: totalPop,
          totalHousing,
          averageDensity,
          housingSystems,
          densityLevels,
          problemAreas: {
            stability: (problemStability / totalGrids) * 100,
            subsidies: (problemSubsidies / totalGrids) * 100,
            supply: (problemSupply / totalGrids) * 100
          }
        });

        setLoading(false);
      } catch (error) {
        console.error(`Error loading HDS data for ${currentProvince.name}:`, error);
        setError(`Failed to load housing delivery system data for ${currentProvince.name}: ${error.message}`);
        setLoading(false);
      }
    };

    loadHDSData();
  }, [selectedProvince]);

  // Handle grid selection
  const handleGridSelect = (gridProperties) => {
    setSelectedGrid(gridProperties);
  };

  // Clear grid selection
  const handleClearSelection = () => {
    setSelectedGrid(null);
  };

  // Toggle filters visibility on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle province change
  const handleProvinceChange = (provinceId) => {
    setSelectedProvince(provinceId);
    setSelectedGrid(null); // Clear selected grid when changing province
  };

  const currentProvince = getCurrentProvince();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Housing Delivery System Analysis</h1>
          <p className="text-gray-600 mt-2">
            วิเคราะห์ระบบที่อยู่อาศัยในพื้นที่จังหวัด{currentProvince.name} แบ่งตามกริดความหนาแน่นและประเภทระบบที่อยู่อาศัย
          </p>
        </div>

        {/* Province Selection */}
        <div className="mb-4 bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-800 mb-3">เลือกจังหวัด</h3>
          <div className="flex flex-wrap gap-2">
            {provinces.map(province => (
              <button
                key={province.id}
                onClick={() => handleProvinceChange(province.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
          // Desktop Layout - Side by side
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Sidebar */}
            <div className="col-span-4 space-y-4">
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
                />
              </div>
            </div>

            {/* Map */}
            <div className="col-span-8 relative">
              <div className="bg-white rounded-lg shadow-md overflow-hidden h-full" style={{ minHeight: "calc(100vh - 120px)" }}>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default HousingDeliverySystem;
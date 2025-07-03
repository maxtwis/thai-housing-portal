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
  const [selectedProvince, setSelectedProvince] = useState('kkn'); // Default to Khon Kaen
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

  // Province configurations
  const provinceConfigs = {
    'kkn': {
      name: 'ขอนแก่น',
      file: '/data/HDS_GRID_KKN_FeaturesToJSON.geojson'
    },
    'cnx': {
      name: 'เชียงใหม่', 
      file: '/data/HDS_CNX.geojson'
    }
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

  // Load GeoJSON data and calculate statistics when province changes
  useEffect(() => {
    const loadHDSData = async () => {
      setLoading(true);
      setError(null);
      
      const config = provinceConfigs[selectedProvince];
      if (!config) {
        setError('ไม่พบข้อมูลจังหวัดที่เลือก');
        setLoading(false);
        return;
      }

      try {
        console.log(`Loading HDS data for ${config.name}...`);
        const response = await fetch(config.file);
        if (!response.ok) throw new Error(`Failed to load HDS GeoJSON data for ${config.name}`);
        const geojsonData = await response.json();
        
        console.log(`HDS Data loaded for ${config.name}:`, geojsonData.features.length, 'features');
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
        let problemSupply = 0;
        let problemSubsidies = 0;
        let problemStability = 0;
        
        features.forEach(feature => {
          const props = feature.properties;
          
          // Population and housing totals
          totalPop += props.Grid_POP || 0;
          totalHousing += props.Grid_House || 0;
          
          // Housing systems
          housingSystems.HDS_C1 += props.HDS_C1_num || 0;
          housingSystems.HDS_C2 += props.HDS_C2_num || 0;
          housingSystems.HDS_C3 += props.HDS_C3_num || 0;
          housingSystems.HDS_C4 += props.HDS_C4_num || 0;
          housingSystems.HDS_C5 += props.HDS_C5_num || 0;
          housingSystems.HDS_C6 += props.HDS_C6_num || 0;
          housingSystems.HDS_C7 += props.HDS_C7_num || 0;
          
          // Density levels
          const gridClass = props.Grid_Class;
          if (gridClass) {
            densityLevels[gridClass] = (densityLevels[gridClass] || 0) + 1;
          }
          
          // Problem areas
          if (props.Supply_Pro && props.Supply_Pro.trim()) {
            problemSupply++;
          }
          if (props.Subsidies_ && props.Subsidies_.trim()) {
            problemSubsidies++;
          }
          if (props.Stability_ && props.Stability_.trim()) {
            problemStability++;
          }
        });
        
        const totalGrids = features.length;
        
        setStats({
          totalGrids,
          totalPopulation: totalPop,
          totalHousing: totalHousing,
          averageDensity: totalPop / totalGrids,
          housingSystems,
          densityLevels,
          problemAreas: {
            supply: (problemSupply / totalGrids) * 100,
            subsidies: (problemSubsidies / totalGrids) * 100,
            stability: (problemStability / totalGrids) * 100
          }
        });

        setLoading(false);
      } catch (error) {
        console.error(`Error loading HDS data for ${config.name}:`, error);
        setError(`Failed to load housing delivery system data for ${config.name}: ${error.message}`);
        setLoading(false);
      }
    };

    loadHDSData();
  }, [selectedProvince]);

  // Clear selected grid when province changes
  useEffect(() => {
    setSelectedGrid(null);
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

  const provinceName = provinceConfigs[selectedProvince]?.name || 'ไม่ทราบ';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Housing Delivery System Analysis</h1>
          <p className="text-gray-600 mt-2">
            วิเคราะห์ระบบที่อยู่อาศัยในพื้นที่จังหวัด{provinceName} แบ่งตามกริดความหนาแน่นและประเภทระบบที่อยู่อาศัย
          </p>
        </div>

        {/* Mobile toggle button for filters */}
        {isMobile && (
          <div className="mb-4">
            <button 
              onClick={toggleFilters}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md shadow flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        )}

        {/* Mobile layout - stacked */}
        {isMobile && (
          <div className="space-y-4">
            {/* Filters */}
            {showFilters && (
              <div className="space-y-4">
                <HDSFilters 
                  filters={filters} 
                  setFilters={setFilters}
                  colorScheme={colorScheme}
                  setColorScheme={setColorScheme}
                  selectedProvince={selectedProvince}
                  setSelectedProvince={setSelectedProvince}
                />
                <HDSStatistics 
                  stats={stats} 
                  selectedGrid={selectedGrid}
                  onClearSelection={handleClearSelection}
                  selectedProvince={selectedProvince}
                />
              </div>
            )}
            
            {/* Map */}
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Loading HDS data for {provinceName}...</p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                    <div className="text-red-800 font-medium">Error loading data</div>
                    <div className="text-red-600 text-sm mt-1">{error}</div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
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
        )}

        {/* Desktop layout - side by side */}
        {!isMobile && (
          <div className="flex flex-row gap-4">
            {/* Left sidebar - Filters and Statistics */}
            <div className="w-1/4 space-y-4">
              <HDSFilters 
                filters={filters} 
                setFilters={setFilters}
                colorScheme={colorScheme}
                setColorScheme={setColorScheme}
                selectedProvince={selectedProvince}
                setSelectedProvince={setSelectedProvince}
              />
              <HDSStatistics 
                stats={stats} 
                selectedGrid={selectedGrid}
                onClearSelection={handleClearSelection}
                selectedProvince={selectedProvince}
              />
            </div>
            
            {/* Right side - Map - INCREASED HEIGHT */}
            <div className="w-3/4" style={{ height: "calc(100vh - 120px)" }}>
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Loading HDS data for {provinceName}...</p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <div className="text-red-800 font-medium">Error loading data</div>
                    <div className="text-red-600 text-sm mt-2">{error}</div>
                    <div className="mt-4 space-x-2">
                      <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Retry
                      </button>
                      <button 
                        onClick={() => setSelectedProvince(selectedProvince === 'kkn' ? 'cnx' : 'kkn')}
                        className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Switch Province
                      </button>
                    </div>
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
        )}

        {/* Loading overlay for province switching */}
        {loading && !isMobile && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-3 text-gray-600">Switching to {provinceName}...</p>
                <p className="text-sm text-gray-500 mt-1">Loading grid data</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HousingDeliverySystem;
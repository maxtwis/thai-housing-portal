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

  // Toggle filters on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Load HDS data based on selected province
  useEffect(() => {
    const loadHDSData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const currentProvince = getCurrentProvince();
        const response = await fetch(currentProvince.file);
        
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.status}`);
        }
        
        const geojsonData = await response.json();
        
        // Validate data
        if (!geojsonData.features || !Array.isArray(geojsonData.features)) {
          throw new Error('Invalid GeoJSON format');
        }

        console.log(`Loaded ${geojsonData.features.length} features for ${currentProvince.name}`);
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

        {/* Main Content - Redesigned Layout */}
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
                {/* Loading and error states remain the same */}
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
            // Desktop Layout - New side-by-side design
            <div className="flex h-full">
              {/* Full-page Map on the left */}
              <div className="flex-1 relative">
                {loading && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-3 text-gray-600 text-lg">Loading HDS data for {currentProvince.name}...</p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md shadow-lg">
                      <p className="text-red-800 text-lg mb-4">{error}</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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

              {/* Right sidebar with filters and statistics */}
              <div className="w-96 bg-gray-100 border-l border-gray-300 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {/* Filters Card */}
                  <div className="bg-white rounded-lg shadow-lg">
                    <HDSFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                      colorScheme={colorScheme}
                      onColorSchemeChange={setColorScheme}
                      isMobile={false}
                    />
                  </div>

                  {/* Statistics Card */}
                  <div className="bg-white rounded-lg shadow-lg">
                    <HDSStatistics
                      stats={stats}
                      selectedGrid={selectedGrid}
                      onClearSelection={handleClearSelection}
                      isMobile={isMobile}
                      provinceName={currentProvince.name}
                      supplyData={supplyData} // Add this line
                    />
                  </div>

                  {/* Additional Info Card */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">วิธีใช้งาน</p>
                        <ul className="space-y-1 text-xs">
                          <li>• คลิกที่กริดบนแผนที่เพื่อดูรายละเอียด</li>
                          <li>• ใช้ตัวกรองเพื่อแสดงเฉพาะข้อมูลที่ต้องการ</li>
                          <li>• เปลี่ยนรูปแบบการแสดงสีได้จากเมนู</li>
                        </ul>
                      </div>
                    </div>
                  </div>
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
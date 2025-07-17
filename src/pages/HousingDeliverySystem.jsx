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

  // Available provinces
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
          C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0, C7: 0
        };
        const densityLevels = {
          1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        };
        let problemSupply = 0;
        let problemSubsidies = 0;
        let problemStability = 0;

        features.forEach(feature => {
          const props = feature.properties;
          const population = props.Grid_POP || 0;
          const housing = props.Grid_HU || 0;
          
          totalPop += population;
          totalHousing += housing;
          
          // Count housing systems
          for (let i = 1; i <= 7; i++) {
            const systemCount = props[`HDS_C${i}_num`] || 0;
            if (systemCount > 0) {
              housingSystems[`C${i}`] += systemCount;
            }
          }
          
          // Count density levels
          const gridClass = props.Grid_Class;
          if (gridClass >= 1 && gridClass <= 5) {
            densityLevels[gridClass]++;
          }
          
          // Count problem areas (assuming these fields exist)
          if (props.supply_problem) problemSupply++;
          if (props.subsidies_problem) problemSubsidies++;
          if (props.stability_problem) problemStability++;
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

  // Handle province change
  const handleProvinceChange = (provinceId) => {
    setSelectedProvince(provinceId);
    setSelectedGrid(null); // Clear any selected grid when changing province
  };

  const currentProvince = getCurrentProvince();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex flex-col">
        {/* Simplified Header - Province selector moved to filter card */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              ระบบการจัดการที่อยู่อาศัย (Housing Delivery System)
            </h1>
            <div className="text-sm text-gray-600">
              จังหวัด: <span className="font-medium text-gray-800">{currentProvince.name}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {isMobile ? (
            // Mobile Layout - Keep existing stacked layout
            <div className="h-full overflow-y-auto p-4 space-y-4">
              {/* Filter Toggle for Mobile */}
              <button
                onClick={toggleFilters}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors"
              >
                {showFilters ? 'ซ่อนตัวกรอง' : 'แสดงตัวกรอง'}
              </button>

              {/* Mobile Filters */}
              {showFilters && (
                <div className="bg-white rounded-lg shadow-lg">
                  <HDSFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    colorScheme={colorScheme}
                    onColorSchemeChange={setColorScheme}
                    isMobile={isMobile}
                    selectedProvince={selectedProvince}
                    onProvinceChange={handleProvinceChange}
                    provinces={provinces}
                  />
                </div>
              )}

              {/* Mobile Map */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '60vh' }}>
                {loading && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                        <p className="text-blue-800 font-medium">กำลังโหลดข้อมูล...</p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-lg">
                      <p className="text-red-800 text-center mb-4">{error}</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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

              {/* Mobile Statistics */}
              <div className="bg-white rounded-lg shadow-lg">
                <HDSStatistics
                  stats={stats}
                  selectedGrid={selectedGrid}
                  onClearSelection={handleClearSelection}
                  isMobile={isMobile}
                  provinceName={currentProvince.name}
                  supplyData={supplyData}
                />
              </div>
            </div>
          ) : (
            // Desktop Layout - Side by side with improved spacing
            <div className="h-full overflow-hidden">
              <div className="flex h-full">
                {/* Map Container */}
                <div className="flex-1 relative">
                  {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md shadow-lg">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                          <p className="text-blue-800 text-lg font-medium">กำลังโหลดข้อมูล...</p>
                        </div>
                        <p className="text-blue-600 text-sm">กำลังโหลดข้อมูลจังหวัด {currentProvince.name}</p>
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
                    {/* Filters Card - Now includes province selector */}
                    <div className="bg-white rounded-lg shadow-lg">
                      <HDSFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                        colorScheme={colorScheme}
                        onColorSchemeChange={setColorScheme}
                        isMobile={false}
                        selectedProvince={selectedProvince}
                        onProvinceChange={handleProvinceChange}
                        provinces={provinces}
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
                        supplyData={supplyData}
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
                            <li>• เลือกจังหวัดจากเมนูด้านบน</li>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousingDeliverySystem;
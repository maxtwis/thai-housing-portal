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

  // Load HDS data for selected province
  useEffect(() => {
    const loadHDSData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const currentProvince = getCurrentProvince();
        
        const response = await fetch(currentProvince.file);
        if (!response.ok) {
          throw new Error(`Failed to load HDS data for ${currentProvince.name}`);
        }
        
        const geojsonData = await response.json();
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

        // Calculate problem percentages
        const problemPercentages = {
          supply: totalGrids > 0 ? (problemSupply / totalGrids) * 100 : 0,
          subsidies: totalGrids > 0 ? (problemSubsidies / totalGrids) * 100 : 0,
          stability: totalGrids > 0 ? (problemStability / totalGrids) * 100 : 0
        };

        setStats({
          totalGrids,
          totalPopulation: totalPop,
          totalHousing,
          averageDensity,
          housingSystems,
          densityLevels,
          problemAreas: problemPercentages
        });
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHDSData();
  }, [selectedProvince]);

  // Toggle filters visibility for mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle grid selection
  const handleGridSelect = (gridProperties) => {
    setSelectedGrid(gridProperties);
  };

  // Handle clearing grid selection
  const handleClearSelection = () => {
    setSelectedGrid(null);
  };

  const currentProvince = getCurrentProvince();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            ระบบการส่งมอบที่อยู่อาศัย (Housing Delivery System)
          </h1>
          <p className="mt-2 text-gray-600">
            วิเคราะห์และแสดงข้อมูลระบบที่อยู่อาศัยในแต่ละพื้นที่
          </p>
        </div>

        {/* Province Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลือกจังหวัด
          </label>
          <div className="flex flex-wrap gap-2">
            {provinces.map(province => (
              <button
                key={province.id}
                onClick={() => setSelectedProvince(province.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
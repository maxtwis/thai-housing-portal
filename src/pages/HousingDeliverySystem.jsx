import React, { useState, useEffect } from 'react';
import HDSMap from '../components/housing-delivery-system/HDSMap';
import HDSFilters from '../components/housing-delivery-system/HDSFilters';
import HDSStatistics from '../components/housing-delivery-system/HDSStatistics';
import { useHousingSupplyByGridData, useHousingSupplyStats, geoJsonIntegrator } from '../utils/csvDataIntegration';

const HousingDeliverySystem = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hdsData, setHdsData] = useState(null);
  const [enrichedGeoJSON, setEnrichedGeoJSON] = useState(null);
  const [colorScheme, setColorScheme] = useState('housingSystem');
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(90); // Default to สงขลา for CSV data
  const [filters, setFilters] = useState({
    housingSystem: 'all',
    densityLevel: 'all',
    populationRange: 'all',
    // New CSV-based filters
    supplyRange: 'all',
    priceRange: 'all',
    houseType: 'all'
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
    },
    // New CSV-based stats
    csvStats: {
      totalSupply: 0,
      averageSalePrice: 0,
      averageRentPrice: 0,
      gridsWithData: 0,
      dominantHouseTypes: {}
    }
  });

  // Available provinces - Focus on สงขลา for CSV data
  const provinces = [
    { id: 40, name: 'ขอนแก่น', file: '/data/HDS_KKN01.geojson', hasCSVData: false },
    { id: 50, name: 'เชียงใหม่', file: '/data/HDS_CNX_02GJSON.geojson', hasCSVData: false },
    { id: 90, name: 'สงขลา', file: '/data/HDS_HYT.geojson', hasCSVData: true }
  ];

  // Use React Query hooks for CSV data - following your existing patterns
  const { 
    data: csvData, 
    isLoading: csvLoading, 
    error: csvError 
  } = useHousingSupplyByGridData(selectedProvince);

  const { 
    data: csvStats, 
    isLoading: csvStatsLoading 
  } = useHousingSupplyStats(selectedProvince);

  // Get current province info
  const getCurrentProvince = () => {
    return provinces.find(p => p.id === selectedProvince) || provinces[2]; // Default to สงขลา
  };

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowFilters(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update stats when CSV data changes
  useEffect(() => {
    if (csvStats && selectedProvince === 90) {
      setStats(prevStats => ({
        ...prevStats,
        csvStats: {
          totalSupply: csvStats.totalSupply,
          averageSalePrice: csvStats.averageSalePrice,
          averageRentPrice: csvStats.averageRentPrice,
          gridsWithData: csvStats.totalGrids,
          dominantHouseTypes: csvStats.houseTypeDistribution
        }
      }));
    }
  }, [csvStats, selectedProvince]);

  // Load GeoJSON data and enrich with CSV
  const loadHDSData = async () => {
    try {
      setLoading(true);
      const currentProvince = getCurrentProvince();
      
      console.log('Loading HDS data for:', currentProvince.name);
      
      // Load GeoJSON
      const response = await fetch(currentProvince.file);
      if (!response.ok) {
        throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
      }
      
      const geojsonData = await response.json();
      console.log('GeoJSON loaded:', geojsonData.features.length, 'features');
      
      setHdsData(geojsonData);
      
      // Enrich with CSV data if available for this province
      if (currentProvince.hasCSVData && csvData && Object.keys(csvData).length > 0) {
        console.log('Enriching GeoJSON with CSV data...');
        const enriched = await geoJsonIntegrator.enrichGeoJSONWithCSVData(geojsonData);
        setEnrichedGeoJSON(enriched);
        console.log('GeoJSON enriched with CSV data');
      } else {
        setEnrichedGeoJSON(geojsonData);
        console.log('No CSV data available for this province or CSV data not loaded yet');
      }
      
      // Calculate original HDS statistics
      calculateHDSStatistics(geojsonData);
      
    } catch (error) {
      console.error('Error loading HDS data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate HDS statistics from GeoJSON
  const calculateHDSStatistics = (geojsonData) => {
    const features = geojsonData.features;
    let totalPop = 0;
    let totalHousing = 0;
    const housingSystems = {
      HDS_C1: 0, HDS_C2: 0, HDS_C3: 0, HDS_C4: 0,
      HDS_C5: 0, HDS_C6: 0, HDS_C7: 0
    };
    const densityLevels = {};
    let problemStability = 0;
    let problemSubsidies = 0;
    let problemSupply = 0;

    features.forEach(feature => {
      const props = feature.properties;
      
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

    setStats(prevStats => ({
      ...prevStats,
      totalGrids,
      totalPopulation: totalPop,
      totalHousing,
      averageDensity,
      housingSystems,
      densityLevels,
      problemAreas: {
        supply: problemSupply,
        subsidies: problemSubsidies,
        stability: problemStability
      }
    }));
  };

  // Load data when component mounts or province changes
  useEffect(() => {
    loadHDSData();
  }, [selectedProvince]);

  // Re-enrich GeoJSON when CSV data becomes available
  useEffect(() => {
    if (hdsData && csvData && selectedProvince === 90 && Object.keys(csvData).length > 0) {
      const enrichData = async () => {
        console.log('Re-enriching GeoJSON with newly loaded CSV data...');
        const enriched = await geoJsonIntegrator.enrichGeoJSONWithCSVData(hdsData);
        setEnrichedGeoJSON(enriched);
      };
      enrichData();
    }
  }, [csvData, hdsData, selectedProvince]);

  // Handle grid selection
  const handleGridSelect = (gridProperties) => {
    setSelectedGrid(gridProperties);
    
    // Log CSV data for selected grid if available
    if (csvData && gridProperties) {
      const objectId = gridProperties.OBJECTID || 
                      gridProperties.OBJECTID_1 || 
                      gridProperties.FID || 
                      gridProperties.Grid_Code;
      
      const gridCSVData = csvData[objectId];
      if (gridCSVData) {
        console.log('CSV data for selected grid:', gridCSVData);
      }
    }
  };

  // Handle province change
  const handleProvinceChange = (provinceId) => {
    setSelectedProvince(provinceId);
    setSelectedGrid(null);
    setError(null);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  // Handle color scheme change
  const handleColorSchemeChange = (scheme) => {
    setColorScheme(scheme);
  };

  if (loading || (selectedProvince === 90 && csvLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลระบบที่อยู่อาศัย...</p>
          {selectedProvince === 90 && csvLoading && (
            <p className="text-blue-600 text-sm mt-2">รวมถึงข้อมูลอุปทานจาก CKAN API...</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">เกิดข้อผิดพลาด</div>
          <p className="text-gray-600 mb-4">{error}</p>
          {csvError && (
            <p className="text-orange-600 text-sm mb-4">CSV Error: {csvError.message}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            โหลดใหม่
          </button>
        </div>
      </div>
    );
  }

  const currentProvince = getCurrentProvince();
  const hasCSVData = currentProvince.hasCSVData && csvData && Object.keys(csvData).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
                ระบบที่อยู่อาศัย
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {currentProvince.name}
                {hasCSVData && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    รวมข้อมูลอุปทาน
                  </span>
                )}
                {selectedProvince === 90 && csvLoading && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    โหลดข้อมูล CSV...
                  </span>
                )}
              </p>
            </div>
            
            {/* Province Selector */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(parseInt(e.target.value))}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {provinces.map(province => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                    {province.hasCSVData ? ' (มีข้อมูลอุปทาน)' : ''}
                  </option>
                ))}
              </select>
              
              {isMobile && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  {showFilters ? 'ซ่อน' : 'แสดง'} ตัวกรอง
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-12'} gap-6`}>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className={`${isMobile ? 'order-1' : 'col-span-3'}`}>
              <HDSFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                colorScheme={colorScheme}
                onColorSchemeChange={handleColorSchemeChange}
                selectedGrid={selectedGrid}
                isMobile={isMobile}
                hasCSVData={hasCSVData}
                csvData={csvData}
              />
            </div>
          )}

          {/* Map Panel */}
          <div className={`${isMobile ? 'order-2' : showFilters ? 'col-span-6' : 'col-span-9'}`}>
            <HDSMap
              filters={filters}
              colorScheme={colorScheme}
              isMobile={isMobile}
              onGridSelect={handleGridSelect}
              selectedGrid={selectedGrid}
              selectedProvince={selectedProvince}
              hdsData={enrichedGeoJSON || hdsData}
              csvData={csvData}
              hasCSVData={hasCSVData}
            />
          </div>

          {/* Statistics Panel */}
          <div className={`${isMobile ? 'order-3' : 'col-span-3'}`}>
            <HDSStatistics
              stats={stats}
              selectedGrid={selectedGrid}
              isMobile={isMobile}
              provinceName={currentProvince.name}
              hasCSVData={hasCSVData}
              csvData={csvData}
            />
          </div>
        </div>
      </div>

      {/* CSV Data Info Panel for Development */}
      {process.env.NODE_ENV === 'development' && hasCSVData && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
          <h4 className="font-semibold text-sm mb-2">CSV Data Status</h4>
          <div className="text-xs space-y-1">
            <div>Grids with CSV data: {Object.keys(csvData).length}</div>
            <div>Total supply: {stats.csvStats.totalSupply?.toLocaleString() || 0}</div>
            <div>Avg sale price: ฿{stats.csvStats.averageSalePrice?.toLocaleString() || 'N/A'}</div>
            <div>Avg rent price: ฿{stats.csvStats.averageRentPrice?.toLocaleString() || 'N/A'}</div>
            <div>Match rate: {stats.totalGrids > 0 ? 
              Math.round((Object.keys(csvData).length / stats.totalGrids) * 100) : 0}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HousingDeliverySystem;
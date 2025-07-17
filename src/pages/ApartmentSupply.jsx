import React, { useState, useEffect } from 'react';
import { getCkanData } from '../utils/ckanClient';
import ApartmentMap from '../components/apartment-supply/ApartmentMap';
import ApartmentFilters from '../components/apartment-supply/ApartmentFilters';
import ApartmentStatistics from '../components/apartment-supply/ApartmentStatistics';

// Function to check if coordinates are within Thailand's boundaries
const isCoordinateInThailand = (latitude, longitude) => {
  const THAILAND_BOUNDS = {
    north: 20.5,    // Northern border near Myanmar/Laos
    south: 5.5,     // Southern border near Malaysia  
    east: 105.7,    // Eastern border near Laos/Cambodia
    west: 97.3      // Western border near Myanmar
  };

  return (
    latitude >= THAILAND_BOUNDS.south &&
    latitude <= THAILAND_BOUNDS.north &&
    longitude >= THAILAND_BOUNDS.west &&
    longitude <= THAILAND_BOUNDS.east
  );
};

const ApartmentSupply = () => {
  const [apartmentData, setApartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  // Province selection state - now defaults to all provinces
  const [selectedProvince, setSelectedProvince] = useState(null); // null = all provinces

  // Available provinces (matching Housing Profile)
  const provinces = [
    { id: 10, name: 'กรุงเทพมหานคร', code: 10 },
    { id: 40, name: 'ขอนแก่น', code: 40 },
    { id: 50, name: 'เชียงใหม่', code: 50 },
    { id: 90, name: 'สงขลา', code: 90 }
  ];

  // Filter state - updated with proximity score
  const [filters, setFilters] = useState({
    priceRange: 'all',
    propertyType: 'all',
    roomType: 'all',
    sizeRange: 'all',
    amenities: 'all',
    proximityScore: 'all',
    requiredAmenities: []
  });

  // Color scheme state - updated with proximity score option
  const [colorScheme, setColorScheme] = useState('priceRange');

  // Statistics state
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    availabilityRate: 0,
    averagePrice: 0,
    averageSize: 0,
    averageAmenityScore: 0,
    averageProximityScore: 0,
    propertyTypes: {},
    roomTypes: {},
    priceRanges: {},
    popularAmenities: {}
  });

  // Proximity scores state (for advanced calculations)
  const [proximityScores, setProximityScores] = useState({});

  // Get current province info
  const getCurrentProvince = () => {
    if (!selectedProvince) return { name: 'ทุกจังหวัด' };
    return provinces.find(p => p.id === selectedProvince) || { name: 'ทุกจังหวัด' };
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

  // Calculate amenity score for a property
  const calculateAmenityScore = (property) => {
    const amenityFields = [
      'has_air', 'has_furniture', 'has_internet', 'has_parking',
      'has_lift', 'has_pool', 'has_fitness', 'has_security', 
      'has_cctv', 'allow_pet'
    ];

    const totalAmenities = amenityFields.length;
    const availableAmenities = amenityFields.reduce((count, field) => {
      return count + (property[field] === 'TRUE' || property[field] === true ? 1 : 0);
    }, 0);

    return totalAmenities > 0 ? Math.round((availableAmenities / totalAmenities) * 100) : 0;
  };

  // Filter properties with proximity scores
  const getFilteredData = (proximityScores = {}) => {
    if (!apartmentData || !Array.isArray(apartmentData)) return [];

    return apartmentData.filter(property => {
      // Province filter
      if (selectedProvince && selectedProvince !== 'all') {
        if (property.province_code !== selectedProvince) return false;
      }

      // Price filter
      if (filters.priceRange !== 'all') {
        const [minPrice, maxPrice] = filters.priceRange.split('-').map(Number);
        const propertyPrice = property.monthly_min_price || 0;
        if (maxPrice && maxPrice !== 999999) {
          if (propertyPrice < minPrice || propertyPrice > maxPrice) return false;
        } else {
          if (propertyPrice < minPrice) return false;
        }
      }

      // Property type filter
      if (filters.propertyType !== 'all') {
        if (property.property_type !== filters.propertyType) return false;
      }

      // Room type filter
      if (filters.roomType !== 'all') {
        if (property.room_type !== filters.roomType) return false;
      }

      // Size filter
      if (filters.sizeRange !== 'all') {
        const [minSize, maxSize] = filters.sizeRange.split('-').map(Number);
        const propertySize = property.room_size_max || property.room_size_min || 0;
        if (maxSize && maxSize !== 999) {
          if (propertySize < minSize || propertySize > maxSize) return false;
        } else {
          if (propertySize < minSize) return false;
        }
      }

      // Amenity score filter
      if (filters.amenities !== 'all') {
        const amenityScore = calculateAmenityScore(property);
        const [minScore, maxScore] = filters.amenities.split('-').map(Number);
        if (maxScore) {
          if (amenityScore < minScore || amenityScore > maxScore) return false;
        } else {
          if (amenityScore < minScore) return false;
        }
      }

      // Proximity score filter
      if (filters.proximityScore !== 'all') {
        const proximityScore = proximityScores[property.id];
        if (proximityScore !== undefined) {
          const [minScore, maxScore] = filters.proximityScore.split('-').map(Number);
          if (maxScore) {
            if (proximityScore < minScore || proximityScore > maxScore) return false;
          } else {
            if (proximityScore < minScore) return false;
          }
        }
      }

      // Required amenities filter
      if (filters.requiredAmenities && filters.requiredAmenities.length > 0) {
        const amenityMap = {
          'parking': 'has_parking',
          'internet': 'has_internet',
          'pool': 'has_pool',
          'fitness': 'has_fitness',
          'security': 'has_security',
          'lift': 'has_lift',
          'air': 'has_air',
          'furniture': 'has_furniture'
        };

        for (const requiredAmenity of filters.requiredAmenities) {
          const amenityKey = amenityMap[requiredAmenity];
          if (!amenityKey || !property[amenityKey]) {
            return false;
          }
        }
      }

      return true;
    });
  };

  // Calculate statistics with proximity scores
  const calculateStatistics = (data, proximityScores = {}) => {
    if (!data || !data.length) {
      setStats({
        totalProperties: 0,
        availableProperties: 0,
        availabilityRate: 0,
        averagePrice: 0,
        averageSize: 0,
        averageAmenityScore: 0,
        averageProximityScore: 0,
        propertyTypes: {},
        roomTypes: {},
        priceRanges: {},
        popularAmenities: {}
      });
      return;
    }

    const totalProperties = data.length;
    const availableProperties = data.filter(prop => prop.rooms_available && prop.rooms_available > 0).length;
    const availabilityRate = Math.round((availableProperties / totalProperties) * 100);
    const totalPrice = data.reduce((sum, prop) => sum + (parseFloat(prop.monthly_min_price) || 0), 0);
    const totalSize = data.reduce((sum, prop) => sum + (parseFloat(prop.room_size_min) || 0), 0);
    const totalAmenityScore = data.reduce((sum, prop) => sum + calculateAmenityScore(prop), 0);
    
    // Calculate average proximity score
    const proximityScoresArray = data.map(prop => proximityScores[prop.id] || 0);
    const totalProximityScore = proximityScoresArray.reduce((sum, score) => sum + score, 0);
    const averageProximityScore = proximityScoresArray.length > 0 ? 
      Math.round(totalProximityScore / proximityScoresArray.length) : 0;

    // Calculate averages
    const averagePrice = totalProperties > 0 ? Math.round(totalPrice / totalProperties) : 0;
    const averageSize = totalProperties > 0 ? Math.round(totalSize / totalProperties) : 0;
    const averageAmenityScore = totalProperties > 0 ? Math.round(totalAmenityScore / totalProperties) : 0;

    // Group by categories
    const propertyTypes = {};
    const roomTypes = {};
    const priceRanges = {
      '0-5000': 0,
      '5000-10000': 0,
      '10000-20000': 0,
      '20000-30000': 0,
      '30000+': 0
    };
    const popularAmenities = {};

    data.forEach(prop => {
      // Property types
      const propType = prop.property_type || 'ไม่ระบุ';
      propertyTypes[propType] = (propertyTypes[propType] || 0) + 1;

      // Room types
      const roomType = prop.room_type || 'ไม่ระบุ';
      roomTypes[roomType] = (roomTypes[roomType] || 0) + 1;

      // Price ranges
      const price = parseFloat(prop.monthly_min_price) || 0;
      if (price < 5000) priceRanges['0-5000']++;
      else if (price < 10000) priceRanges['5000-10000']++;
      else if (price < 20000) priceRanges['10000-20000']++;
      else if (price < 30000) priceRanges['20000-30000']++;
      else priceRanges['30000+']++;
    });

    setStats({
      totalProperties,
      availableProperties,
      availabilityRate,
      averagePrice,
      averageSize,
      averageAmenityScore,
      averageProximityScore,
      propertyTypes,
      roomTypes,
      priceRanges,
      popularAmenities
    });
  };

  // Load apartment data
  useEffect(() => {
    const loadApartmentData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading apartment supply data...');
        const response = await getCkanData('b6dbb8e0-1194-4eeb-945d-e883b3275b35', {
          limit: 50000,
          sort: 'name asc'
        });

        if (!response || !response.records) {
          throw new Error('No apartment data received from CKAN API');
        }

        console.log(`Loaded ${response.records.length} apartment records`);
        
        // Process and validate the data
        const processedData = response.records
          .map(record => ({
            id: record.name + '_' + (record.latitude || '') + '_' + (record.longitude || ''),
            name: record.name || 'Unknown Property',
            property_type: record.property_type || 'ไม่ระบุ',
            room_type: record.room_type || 'ไม่ระบุ',
            province_code: parseInt(record.province_code) || null,
            latitude: parseFloat(record.latitude) || null,
            longitude: parseFloat(record.longitude) || null,
            monthly_min_price: parseFloat(record.monthly_min_price) || 0,
            monthly_max_price: parseFloat(record.monthly_max_price) || 0,
            room_size_min: parseFloat(record.room_size_min) || 0,
            room_size_max: parseFloat(record.room_size_max) || 0,
            rooms_available: parseInt(record.rooms_available) || 0,
            has_air: record.has_air === 'TRUE' || record.has_air === true,
            has_furniture: record.has_furniture === 'TRUE' || record.has_furniture === true,
            has_internet: record.has_internet === 'TRUE' || record.has_internet === true,
            has_parking: record.has_parking === 'TRUE' || record.has_parking === true,
            has_lift: record.has_lift === 'TRUE' || record.has_lift === true,
            has_pool: record.has_pool === 'TRUE' || record.has_pool === true,
            has_fitness: record.has_fitness === 'TRUE' || record.has_fitness === true,
            has_security: record.has_security === 'TRUE' || record.has_security === true,
            has_cctv: record.has_cctv === 'TRUE' || record.has_cctv === true,
            allow_pet: record.allow_pet === 'TRUE' || record.allow_pet === true,
            ...record
          }))
          .filter(property => {
            // Filter out properties with invalid coordinates
            if (!property.latitude || !property.longitude) return false;
            if (!isCoordinateInThailand(property.latitude, property.longitude)) return false;
            return true;
          });

        console.log(`Processed ${processedData.length} valid apartment records`);
        setApartmentData(processedData);
        
      } catch (err) {
        console.error('Error loading apartment data:', err);
        setError(err.message || 'Failed to load apartment data');
      } finally {
        setLoading(false);
      }
    };

    loadApartmentData();
  }, []);

  // Update statistics when data or filters change
  useEffect(() => {
    const filteredData = getFilteredData(proximityScores);
    calculateStatistics(filteredData, proximityScores);
  }, [apartmentData, filters, selectedProvince, proximityScores]);

  // Handle apartment selection
  const handleApartmentSelect = (apartment) => {
    setSelectedApartment(apartment);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setSelectedApartment(null); // Clear selection when filters change
  };

  // Handle province change
  const handleProvinceChange = (provinceId) => {
    setSelectedProvince(provinceId);
    setSelectedApartment(null); // Clear selection when changing province
  };

  // Get unique values for dropdowns
  const getUniquePropertyTypes = () => {
    return [...new Set(apartmentData.map(item => item.property_type).filter(Boolean))];
  };

  const getUniqueRoomTypes = () => {
    return [...new Set(apartmentData.map(item => item.room_type).filter(Boolean))];
  };

  const currentProvince = getCurrentProvince();
  const filteredData = getFilteredData(proximityScores);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-screen flex flex-col">
          <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
            <h1 className="text-xl font-bold text-gray-900">
              ข้อมูล Housing Stock
            </h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <p className="text-blue-800 text-lg font-medium">กำลังโหลดข้อมูล...</p>
              </div>
              <p className="text-blue-600 text-sm mt-2">กำลังโหลดข้อมูลอพาร์ตเมนต์และที่พักเช่า</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-screen flex flex-col">
          <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
            <h1 className="text-xl font-bold text-gray-900">
              ข้อมูล Housing Stock
            </h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md shadow-lg">
              <p className="text-red-800 text-lg mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex flex-col">
        {/* Simplified Header - Province selector moved to filter card */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              ข้อมูล Housing Stock
            </h1>
            <div className="text-sm text-gray-600">
              พื้นที่: <span className="font-medium text-gray-800">{currentProvince.name}</span>
              <span className="ml-3">ทั้งหมด: <span className="font-medium text-blue-600">{filteredData.length.toLocaleString()}</span> อพาร์ตเมนต์</span>
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
                  <ApartmentFilters
                    filters={filters}
                    onFiltersChange={handleFilterChange}
                    colorScheme={colorScheme}
                    onColorSchemeChange={setColorScheme}
                    selectedProvince={selectedProvince}
                    onProvinceChange={handleProvinceChange}
                    provinces={provinces}
                    propertyTypes={getUniquePropertyTypes()}
                    roomTypes={getUniqueRoomTypes()}
                    isMobile={isMobile}
                  />
                </div>
              )}

              {/* Mobile Map */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '60vh' }}>
                <ApartmentMap 
                  apartmentData={filteredData}
                  selectedApartment={selectedApartment}
                  onApartmentSelect={handleApartmentSelect}
                  colorScheme={colorScheme}
                  proximityScores={proximityScores}
                  setProximityScores={setProximityScores}
                  calculateAmenityScore={calculateAmenityScore}
                  isMobile={isMobile}
                />
              </div>

              {/* Mobile Statistics */}
              <div className="bg-white rounded-lg shadow-lg">
                <ApartmentStatistics
                  stats={stats}
                  selectedApartment={selectedApartment}
                  onClearSelection={() => setSelectedApartment(null)}
                  provinceName={currentProvince.name}
                  filteredData={filteredData}
                  isMobile={isMobile}
                />
              </div>
            </div>
          ) : (
            // Desktop Layout - Side by side with improved spacing (MATCHING HDS LAYOUT)
            <div className="h-full overflow-hidden">
              <div className="flex h-full">
                {/* Map Container */}
                <div className="flex-1 relative">
                  <ApartmentMap 
                    apartmentData={filteredData}
                    selectedApartment={selectedApartment}
                    onApartmentSelect={handleApartmentSelect}
                    colorScheme={colorScheme}
                    proximityScores={proximityScores}
                    setProximityScores={setProximityScores}
                    calculateAmenityScore={calculateAmenityScore}
                    isMobile={false}
                  />
                </div>

                {/* Right sidebar with filters and statistics */}
                <div className="w-96 bg-gray-100 border-l border-gray-300 overflow-y-auto">
                  <div className="p-4 space-y-4">
                    {/* Filters Card - Now includes province selector */}
                    <div className="bg-white rounded-lg shadow-lg">
                      <ApartmentFilters
                        filters={filters}
                        onFiltersChange={handleFilterChange}
                        colorScheme={colorScheme}
                        onColorSchemeChange={setColorScheme}
                        selectedProvince={selectedProvince}
                        onProvinceChange={handleProvinceChange}
                        provinces={provinces}
                        propertyTypes={getUniquePropertyTypes()}
                        roomTypes={getUniqueRoomTypes()}
                        isMobile={false}
                      />
                    </div>

                    {/* Statistics Card */}
                    <div className="bg-white rounded-lg shadow-lg">
                      <ApartmentStatistics
                        stats={stats}
                        selectedApartment={selectedApartment}
                        onClearSelection={() => setSelectedApartment(null)}
                        provinceName={currentProvince.name}
                        filteredData={filteredData}
                        isMobile={false}
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
                            <li>• เลือกพื้นที่จากเมนูด้านบน</li>
                            <li>• คลิกที่อพาร์ตเมนต์บนแผนที่เพื่อดูรายละเอียด</li>
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

export default ApartmentSupply;
import React, { useState, useEffect } from 'react';
import { getCkanData } from '../utils/ckanClient';
import ApartmentMap from '../components/apartment-supply/ApartmentMap';
import ApartmentFilters from '../components/apartment-supply/ApartmentFilters';
import ApartmentStatistics from '../components/apartment-supply/ApartmentStatistics';
import ProximityPlaceButtons from '../components/apartment-supply/ProximityPlaceButtons';
import ProximityPlaceButtons from '../components/apartment-supply/ProximityPlaceButtons';

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
  const [showFilters, setShowFilters] = useState(false); // Changed to false by default
  
  // Province selection state - now defaults to all provinces
  const [selectedProvince, setSelectedProvince] = useState(null); // null = all provinces

  // Available provinces (matching Housing Profile)
  const provinces = [
    { id: 10, name: 'กรุงเทพมหานคร', code: 10 },
    { id: 40, name: 'ขอนแก่น', code: 40 },
    { id: 50, name: 'เชียงใหม่', code: 50 },
    { id: 90, name: 'สงขลา', code: 90 }
  ];

  // Enhanced filter state with proximity score and amenity score
  const [filters, setFilters] = useState({
    priceRange: 'all',
    propertyType: 'all',
    roomType: 'all',
    sizeRange: 'all',
    amenityScore: 'all',        // Moved from map tooltip to filter
    proximityScore: 'all',      // Moved from map tooltip to filter
    requiredAmenities: []
  });

  // Color scheme state - updated with proximity score option
  const [colorScheme, setColorScheme] = useState('priceRange');

  // Proximity-related states
  const [proximityScores, setProximityScores] = useState({});
  const [selectedProximityPlace, setSelectedProximityPlace] = useState(null);
  const [showingNearbyPlaces, setShowingNearbyPlaces] = useState(false);

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

  // Get current province info
  const getCurrentProvince = () => {
    if (!selectedProvince) return { name: 'ทุกจังหวัด' };
    return provinces.find(p => p.id === selectedProvince) || { name: 'ทุกจังหวัด' };
  };

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Don't auto-show filters on desktop anymore
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle filters on mobile
  const toggleFilters = () => {
    // If apartment is selected, close it first, then toggle filters
    if (selectedApartment) {
      setSelectedApartment(null);
    }
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

  // Enhanced filter function with amenity and proximity scores
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

      // Amenity score filter (moved from map tooltip)
      if (filters.amenityScore !== 'all') {
        const amenityScore = calculateAmenityScore(property);
        const [minScore, maxScore] = filters.amenityScore.split('-').map(Number);
        if (maxScore) {
          if (amenityScore < minScore || amenityScore > maxScore) return false;
        } else {
          if (amenityScore < minScore) return false;
        }
      }

      // Proximity score filter (moved from map tooltip)
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

  // Calculate statistics with proximity and amenity scores
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

    // Property type distribution
    const propertyTypes = data.reduce((acc, prop) => {
      const type = prop.property_type || 'ไม่ระบุ';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Room type distribution
    const roomTypes = data.reduce((acc, prop) => {
      const type = prop.room_type || 'ไม่ระบุ';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Price range distribution
    const priceRanges = data.reduce((acc, prop) => {
      const price = prop.monthly_min_price || 0;
      let range;
      if (price < 5000) range = 'น้อยกว่า 5,000';
      else if (price < 10000) range = '5,000-10,000';
      else if (price < 20000) range = '10,000-20,000';
      else if (price < 30000) range = '20,000-30,000';
      else range = 'มากกว่า 30,000';
      
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});

    // Popular amenities
    const amenityFields = [
      { key: 'has_air', label: 'เครื่องปรับอากาศ' },
      { key: 'has_furniture', label: 'เฟอร์นิเจอร์' },
      { key: 'has_internet', label: 'อินเทอร์เน็ต' },
      { key: 'has_parking', label: 'ที่จอดรถ' },
      { key: 'has_lift', label: 'ลิฟต์' },
      { key: 'has_pool', label: 'สระว่ายน้ำ' },
      { key: 'has_fitness', label: 'ฟิตเนส' },
      { key: 'has_security', label: 'รักษาความปลอดภัย' }
    ];

    const popularAmenities = amenityFields.reduce((acc, amenity) => {
      const count = data.filter(prop => 
        prop[amenity.key] === 'TRUE' || prop[amenity.key] === true
      ).length;
      acc[amenity.label] = count;
      return acc;
    }, {});

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
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading apartment data...');

        const possibleResourceIds = [
          'b6dbb8e0-1194-4eeb-945d-e883b3275b35',
        ];
        
        let data = null;
        let lastError = null;
        
        // Try each resource ID until one works
        for (const resourceId of possibleResourceIds) {
          try {
            console.log(`Trying resource ID: ${resourceId}`);
            data = await getCkanData(resourceId, { limit: 1000 });
            console.log(`Successfully loaded data from resource: ${resourceId}`);
            break; // Exit loop if successful
          } catch (err) {
            console.warn(`Resource ${resourceId} failed:`, err.message);
            lastError = err;
            continue; // Try next resource ID
          }
        }
        
        if (!isMounted) return;

        if (data && Array.isArray(data.records)) {
          let validData = data.records.filter(item => {
            const lat = parseFloat(item.latitude);
            const lng = parseFloat(item.longitude);
            return !isNaN(lat) && !isNaN(lng) && isCoordinateInThailand(lat, lng);
          }).map((item, index) => {
            // Create truly unique ID using multiple fields + index
            const uniqueId = `${item.name || 'unknown'}_${item.latitude}_${item.longitude}_${item.province_code || 'unknown'}_${index}`;
            return {
              ...item,
              id: uniqueId,
              // Ensure we have the fields needed for the app
              apartment_name: item.name || item.apartment_name || `Property ${index + 1}`,
              monthly_min_price: parseFloat(item.monthly_min_price) || 0,
              monthly_max_price: parseFloat(item.monthly_max_price) || 0,
              room_size_min: parseFloat(item.room_size_min) || 0,
              room_size_max: parseFloat(item.room_size_max) || 0,
              latitude: parseFloat(item.latitude),
              longitude: parseFloat(item.longitude),
              province_code: parseInt(item.province_code) || selectedProvince,
              property_type: item.property_type || 'APARTMENT',
              room_type: item.room_type || 'STUDIO',
              rooms_available: parseInt(item.rooms_available) || 0,
              // Convert amenity strings to booleans
              has_air: item.has_air === 'TRUE' || item.has_air === true,
              has_furniture: item.has_furniture === 'TRUE' || item.has_furniture === true,
              has_internet: item.has_internet === 'TRUE' || item.has_internet === true,
              has_parking: item.has_parking === 'TRUE' || item.has_parking === true,
              has_lift: item.has_lift === 'TRUE' || item.has_lift === true,
              has_pool: item.has_pool === 'TRUE' || item.has_pool === true,
              has_fitness: item.has_fitness === 'TRUE' || item.has_fitness === true,
              has_security: item.has_security === 'TRUE' || item.has_security === true,
              has_cctv: item.has_cctv === 'TRUE' || item.has_cctv === true,
              allow_pet: item.allow_pet === 'TRUE' || item.allow_pet === true,
              // Contact info
              contact_phone: item.contact_phone || '',
              contact_email: item.contact_email || '',
              address: item.address || `${item.subdistrict || ''} ${item.district || ''} ${item.province || ''}`.trim()
            };
          });

          // Filter by selected province if one is selected
          if (selectedProvince) {
            validData = validData.filter(item => item.province_code === selectedProvince);
          }

          console.log(`Loaded ${validData.length} valid apartment records`);
          console.log('Sample apartment IDs:', validData.slice(0, 5).map(item => item.id));
          setApartmentData(validData);
        } else if (data && data.records) {
          // Handle case where records exist but might be empty
          console.log('No apartment records found in the data source');
          setApartmentData([]);
        } else {
          console.error('No valid data source found. Tried all resource IDs.');
          setError('ไม่พบข้อมูลอพาร์ตเมนต์ในระบบ กรุณาลองใหม่ภายหลัง');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading apartment data:', err);
        setError(`ไม่สามารถโหลดข้อมูลได้: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedProvince]);

  // Calculate statistics when data or proximity scores change
  useEffect(() => {
    const filteredData = getFilteredData(proximityScores);
    calculateStatistics(filteredData, proximityScores);
  }, [apartmentData, proximityScores, filters]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    
    // Clear selection when filters change
    setSelectedApartment(null);
  };

  // Handle apartment selection
  const handleApartmentSelect = (apartment) => {
    setSelectedApartment(apartment);
  };

  // Handle province change
  const handleProvinceChange = (provinceId) => {
    setSelectedProvince(provinceId);
    setSelectedApartment(null);
    setProximityScores({}); // Clear proximity scores when province changes
  };

  // Handle proximity place button click
  const handleProximityPlaceClick = (placeType) => {
    setSelectedProximityPlace(placeType);
    setShowingNearbyPlaces(true);
    // Clear any selected apartment when viewing nearby places
    setSelectedApartment(null);
  };

  // Clear nearby places view
  const clearNearbyPlaces = () => {
    setSelectedProximityPlace(null);
    setShowingNearbyPlaces(false);
  };

  // Get unique property types
  const getUniquePropertyTypes = () => {
    const types = [...new Set(apartmentData.map(item => item.property_type))].filter(Boolean);
    return types.sort();
  };

  // Get unique room types
  const getUniqueRoomTypes = () => {
    const types = [...new Set(apartmentData.map(item => item.room_type))].filter(Boolean);
    return types.sort();
  };

  // Get filtered data for rendering
  const filteredData = getFilteredData(proximityScores);

  // Show empty state if no data is available but no error occurred
  const showEmptyState = !loading && !error && (!apartmentData || apartmentData.length === 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          <p className="text-sm text-gray-500 mt-2">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              ลองใหม่
            </button>
            <button 
              onClick={() => {
                setError(null);
                setApartmentData([]);
                setLoading(false);
              }} 
              className="w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ใช้งานแบบออฟไลน์
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            หากปัญหายังคงมีอยู่ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
          </p>
        </div>
      </div>
    );
  }

  // Empty state when no data is available
  if (showEmptyState) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  อพาร์ตเมนต์ {getCurrentProvince().name}
                </h1>
                <p className="text-sm text-gray-600">ไม่พบข้อมูล</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">ไม่พบข้อมูลอพาร์ตเมนต์</h2>
            <p className="text-gray-600 mb-4">
              ขณะนี้ไม่มีข้อมูลอพาร์ตเมนต์สำหรับจังหวัด{getCurrentProvince().name}
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => setSelectedProvince(null)}
                className="w-full px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                ดูทุกจังหวัด
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                รีเฟรชข้อมูล
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                อพาร์ตเมนต์ {getCurrentProvince().name}
              </h1>
              <p className="text-sm text-gray-600">
                {filteredData.length.toLocaleString()} จาก {apartmentData.length.toLocaleString()} รายการ
              </p>
            </div>
            
            {/* Mobile filter toggle */}
            {isMobile && (
              <button
                onClick={toggleFilters}
                className="md:hidden flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                ตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Proximity Place Buttons - Horizontal bar above map */}
        <ProximityPlaceButtons
          selectedPlace={selectedProximityPlace}
          onPlaceClick={handleProximityPlaceClick}
          onClearPlaces={clearNearbyPlaces}
          showingNearbyPlaces={showingNearbyPlaces}
        />
      </div>

      {/* Main Content */}
      {isMobile ? (
        // Mobile Layout - Improved with proper scrolling and map preservation
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Filters - Collapsible with better scrolling */}
          {showFilters && (
            <div className="bg-gray-100 border-b border-gray-300 max-h-[40vh] overflow-y-auto">
              <div className="p-4">
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
                  proximityScores={proximityScores}
                  isMobile={true}
                />
              </div>
            </div>
          )}

          {/* Mobile Map - Always visible with full height */}
          <div className="flex-1 relative">
            <ApartmentMap 
              apartmentData={filteredData}
              selectedApartment={selectedApartment}
              onApartmentSelect={handleApartmentSelect}
              colorScheme={colorScheme}
              proximityScores={proximityScores}
              setProximityScores={setProximityScores}
              calculateAmenityScore={calculateAmenityScore}
              selectedProximityPlace={selectedProximityPlace}
              showingNearbyPlaces={showingNearbyPlaces}
              isMobile={true}
            />
          </div>

          {/* Mobile Statistics - Scrollable bottom sheet when apartment is selected */}
          {selectedApartment && (
            <div className="bg-white border-t border-gray-300 shadow-lg max-h-[50vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">รายละเอียด</h3>
                <button
                  onClick={() => setSelectedApartment(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                <ApartmentStatistics
                  selectedApartment={selectedApartment}
                  stats={stats}
                  proximityScores={proximityScores}
                  calculateAmenityScore={calculateAmenityScore}
                  filteredData={filteredData}
                  isMobile={true}
                />
              </div>

              {/* Bottom action bar */}
              <div className="bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
                <button
                  onClick={() => setSelectedApartment(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium"
                >
                  ปิด
                </button>
                <button
                  onClick={() => {
                    // Show map view with selected apartment
                    setSelectedApartment(null);
                    // You could add logic here to zoom to the apartment on map
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium"
                >
                  ดูบนแผนที่
                </button>
              </div>
            </div>
          )}

          {/* Mobile floating filter toggle when no apartment selected */}
          {!selectedApartment && (
            <button
              onClick={toggleFilters}
              className="absolute bottom-6 right-6 bg-orange-500 text-white rounded-full p-4 shadow-lg z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        // Desktop Layout - Side by side with floating filter button
        <div className="flex-1 overflow-hidden">
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
                selectedProximityPlace={selectedProximityPlace}
                showingNearbyPlaces={showingNearbyPlaces}
                isMobile={false}
              />

              {/* Desktop floating filter toggle - same style as mobile */}
              <button
                onClick={toggleFilters}
                className="absolute bottom-6 right-6 bg-orange-500 text-white rounded-full p-4 shadow-lg hover:bg-orange-600 transition-colors z-10"
                title="ตัวกรอง"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
              </button>
            </div>

            {/* Right sidebar with filters and statistics - only show when filters enabled */}
            {showFilters && (
              <div 
                className="w-96 bg-gray-100 border-l border-gray-300 overflow-y-auto"
                style={{
                  animation: 'slideInRight 0.3s ease-out',
                  '@keyframes slideInRight': {
                    'from': { transform: 'translateX(100%)', opacity: 0 },
                    'to': { transform: 'translateX(0)', opacity: 1 }
                  }
                }}
              >
                <div className="p-4 space-y-4">
                  {/* Enhanced Filters Card - Now includes amenity and proximity score filters */}
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
                      proximityScores={proximityScores}
                      isMobile={false}
                    />
                  </div>

                  {/* Statistics Card - Enhanced with proximity and amenity data */}
                  <div className="bg-white rounded-lg shadow-lg">
                    <ApartmentStatistics
                      selectedApartment={selectedApartment}
                      stats={stats}
                      proximityScores={proximityScores}
                      calculateAmenityScore={calculateAmenityScore}
                      filteredData={filteredData}
                      isMobile={false}
                    />
                  </div>
                </div>

                {/* Close filters button */}
                <div className="sticky bottom-0 bg-gray-100 border-t border-gray-300 p-4">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    ปิดตัวกรอง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApartmentSupply;
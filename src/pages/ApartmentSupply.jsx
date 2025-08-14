import React, { useState, useEffect } from 'react';
import { getCkanData } from '../utils/ckanClient';
import ApartmentMap from '../components/apartment-supply/ApartmentMap';
import ApartmentFilters from '../components/apartment-supply/ApartmentFilters';
import ApartmentStatistics from '../components/apartment-supply/ApartmentStatistics';
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
  const [showFilters, setShowFilters] = useState(false); // Hidden by default
  
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
    popularAmenities: [],
    priceRangeDistribution: {},
    propertyTypeDistribution: {},
    roomTypeDistribution: {}
  });

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Resource IDs to try (in order of preference)
  const APARTMENT_RESOURCE_IDS = [
    'a9b21797-3e04-43af-a5a9-33ae5c511f7f',
    'e1234567-89ab-cdef-0123-456789abcdef',
    'apartment-supply-data-2024',
    'apartment-listings-thailand'
  ];

  // Load apartment data
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        let data = null;
        let resourceIdUsed = null;

        // Try each resource ID until we find one that works
        for (const resourceId of APARTMENT_RESOURCE_IDS) {
          try {
            console.log(`Trying apartment resource ID: ${resourceId}`);
            const result = await getCkanData(resourceId, { 
              limit: 10000,
              sort: 'province_code asc'
            });
            
            if (result && result.records && result.records.length > 0) {
              data = result;
              resourceIdUsed = resourceId;
              console.log(`Successfully loaded data from resource: ${resourceId}`);
              break;
            }
          } catch (err) {
            console.log(`Resource ${resourceId} failed:`, err.message);
            continue;
          }
        }

        if (!isMounted) return;

        if (data && data.records && data.records.length > 0) {
          console.log(`Total records from API: ${data.records.length}`);
          
          // Enhanced data processing and validation
          let validData = data.records.map(item => {
            // Parse coordinates
            const latitude = parseFloat(item.latitude || item.lat || 0);
            const longitude = parseFloat(item.longitude || item.lng || item.lon || 0);
            
            return {
              // Basic info
              id: item.id || item.apartment_id || item.property_id || Math.random().toString(36),
              name: item.name || item.apartment_name || item.property_name || 'ไม่ระบุชื่อ',
              
              // Location
              latitude,
              longitude,
              province: item.province || '',
              province_code: parseInt(item.province_code || item.province_id || 0),
              district: item.district || item.amphoe || '',
              subdistrict: item.subdistrict || item.tambon || '',
              
              // Property details
              property_type: item.property_type || item.type || 'APARTMENT',
              room_type: item.room_type || item.room_category || 'ONE_BED_ROOM',
              
              // Size and pricing
              room_size_min: parseFloat(item.room_size_min || item.size_min || 0),
              room_size_max: parseFloat(item.room_size_max || item.size_max || item.room_size_min || 0),
              monthly_min_price: parseFloat(item.monthly_min_price || item.rent_min || item.price_min || 0),
              monthly_max_price: parseFloat(item.monthly_max_price || item.rent_max || item.price_max || item.monthly_min_price || 0),
              
              // Status
              availability_status: item.availability_status || item.status || 'available',
              units_available: parseInt(item.units_available || item.available_units || 1),
              total_units: parseInt(item.total_units || item.units_available || 1),
              
              // Amenities - convert strings to booleans
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

          // Filter by coordinates within Thailand
          validData = validData.filter(item => {
            const hasValidCoords = item.latitude && item.longitude && 
                                 !isNaN(item.latitude) && !isNaN(item.longitude) &&
                                 isCoordinateInThailand(item.latitude, item.longitude);
            
            if (!hasValidCoords) {
              console.log(`Filtered out invalid coordinates: ${item.id} - lat: ${item.latitude}, lng: ${item.longitude}`);
            }
            
            return hasValidCoords;
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

  // FIXED: Handle filter changes - accepts entire filter object
  const handleFiltersChange = (newFilters) => {
    console.log('ApartmentSupply: Filters changed to:', newFilters);
    setFilters(newFilters);
    
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
    // Don't clear selected apartment - keep statistics panel visible
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

  // Calculate amenity score for a property
  const calculateAmenityScore = (property) => {
    const amenityFields = [
      'has_air', 'has_furniture', 'has_internet', 'has_parking',
      'has_lift', 'has_pool', 'has_fitness', 'has_security',
      'has_cctv', 'allow_pet'
    ];
    
    const availableAmenities = amenityFields.reduce((count, field) => {
      return count + (property[field] ? 1 : 0);
    }, 0);
    
    const totalAmenities = amenityFields.length;
    
    return totalAmenities > 0 ? Math.round((availableAmenities / totalAmenities) * 100) : 0;
  };

  // Enhanced filter function with amenity and proximity scores
  const getFilteredData = (proximityScores = {}) => {
    console.log('ApartmentSupply: getFilteredData called with filters:', filters);
    
    if (!apartmentData || !Array.isArray(apartmentData)) return [];

    return apartmentData.filter(property => {
      // Province filter
      if (selectedProvince && selectedProvince !== 'all') {
        if (property.province_code !== selectedProvince) return false;
      }

      // Price filter
      if (filters.priceRange !== 'all') {
        console.log('Applying price filter:', filters.priceRange, 'to property:', property.id, 'price:', property.monthly_min_price);
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
      if (filters.amenityScore !== 'all') {
        const [minScore, maxScore] = filters.amenityScore.split('-').map(Number);
        const amenityScore = calculateAmenityScore(property);
        if (maxScore) {
          if (amenityScore < minScore || amenityScore > maxScore) return false;
        } else {
          if (amenityScore < minScore) return false;
        }
      }

      // Proximity score filter
      if (filters.proximityScore !== 'all') {
        const [minScore, maxScore] = filters.proximityScore.split('-').map(Number);
        const proximityScore = proximityScores[property.id] || 0;
        if (maxScore) {
          if (proximityScore < minScore || proximityScore > maxScore) return false;
        } else {
          if (proximityScore < minScore) return false;
        }
      }

      // Required amenities filter
      if (filters.requiredAmenities && filters.requiredAmenities.length > 0) {
        const hasAllRequiredAmenities = filters.requiredAmenities.every(amenity => 
          property[amenity] === true
        );
        if (!hasAllRequiredAmenities) return false;
      }

      return true;
    });
  };

  // Calculate statistics for filtered data
  const calculateStatistics = (data, proximityScores) => {
    if (!data || data.length === 0) {
      setStats({
        totalProperties: 0,
        availableProperties: 0,
        availabilityRate: 0,
        averagePrice: 0,
        averageSize: 0,
        averageAmenityScore: 0,
        averageProximityScore: 0,
        popularAmenities: [],
        priceRangeDistribution: {},
        propertyTypeDistribution: {},
        roomTypeDistribution: {}
      });
      return;
    }

    const totalProperties = data.length;
    const availableProperties = data.filter(prop => 
      prop.availability_status === 'available' || 
      (prop.units_available && prop.units_available > 0)
    ).length;

    // Calculate totals and averages
    const totalPrice = data.reduce((sum, prop) => sum + (prop.monthly_min_price || 0), 0);
    const totalSize = data.reduce((sum, prop) => sum + (prop.room_size_max || prop.room_size_min || 0), 0);
    const totalAmenityScore = data.reduce((sum, prop) => sum + calculateAmenityScore(prop), 0);

    // Calculate proximity scores
    const proximityScoresArray = Object.values(proximityScores).filter(score => score > 0);
    const totalProximityScore = proximityScoresArray.length > 0 ? 
      proximityScoresArray.reduce((sum, score) => sum + score, 0) : 0;
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
      
      if (count > 0) {
        acc.push({
          name: amenity.label,
          count,
          percentage: Math.round((count / totalProperties) * 100)
        });
      }
      
      return acc;
    }, []).sort((a, b) => b.count - a.count);

    setStats({
      totalProperties,
      availableProperties,
      availabilityRate: totalProperties > 0 ? Math.round((availableProperties / totalProperties) * 100) : 0,
      averagePrice,
      averageSize,
      averageAmenityScore,
      averageProximityScore,
      popularAmenities: popularAmenities.slice(0, 8), // Top 8 amenities
      priceRangeDistribution: priceRanges,
      propertyTypeDistribution: propertyTypes,
      roomTypeDistribution: roomTypes
    });
  };

  // Toggle mobile filters
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Make toggle function available globally for mobile filter button
  useEffect(() => {
    window.toggleMobileFilters = toggleFilters;
    return () => {
      delete window.toggleMobileFilters;
    };
  }, [showFilters]);

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
              ดำเนินการต่อโดยไม่มีข้อมูล
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showEmptyState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">ไม่พบข้อมูลอพาร์ตเมนต์</h2>
          <p className="text-gray-600 mb-4">
            ขณะนี้ยังไม่มีข้อมูลอพาร์ตเมนต์ในระบบ หรือข้อมูลอาจยังไม่พร้อมใช้งาน
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            รีเฟรชหน้า
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-orange-500 rounded"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">อุปทานที่อยู่อาศัย</h1>
                <p className="text-sm text-gray-600">
                  {filteredData.length.toLocaleString()} จาก {apartmentData.length.toLocaleString()} รายการ
                  {selectedProvince && ` - ${provinces.find(p => p.id === selectedProvince)?.name}`}
                </p>
              </div>
            </div>

            {/* Desktop Filter Toggle */}
            {!isMobile && (
              <button
                onClick={toggleFilters}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                ตัวกรอง
                {Object.values(filters).filter(v => v !== 'all' && v !== '' && !(Array.isArray(v) && v.length === 0)).length > 0 && (
                  <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                    {Object.values(filters).filter(v => v !== 'all' && v !== '' && !(Array.isArray(v) && v.length === 0)).length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {isMobile ? (
          // Mobile Layout - Improved with proper scrolling and map preservation
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Filters - Collapsible with better scrolling */}
            {showFilters && (
              <div className="bg-gray-100 border-b border-gray-300 max-h-[40vh] overflow-y-auto">
                <div className="p-4">
                  <ApartmentFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}  // FIXED: Use the correct handler
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

            {/* Mobile floating filter toggle when no apartment selected - fixed positioning */}
            {!selectedApartment && (
              <button
                onClick={toggleFilters}
                className="fixed bottom-6 right-6 bg-orange-500 text-white rounded-full p-4 shadow-lg z-50"
                style={{ zIndex: 1000 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          // Desktop Layout - Full width map with floating elements
          <div className="flex-1 overflow-hidden relative">
            <div className="flex h-full">
              {/* Map Container - Full width */}
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
              </div>

              {/* Right sidebar - only show when filters enabled */}
              {showFilters && (
                <div 
                  className="w-96 bg-gray-100 border-l border-gray-300 overflow-y-auto"
                  style={{
                    animation: 'slideInRight 0.3s ease-out'
                  }}
                >
                  <div className="p-4 space-y-4">
                    {/* Enhanced Filters Card */}
                    <div className="bg-white rounded-lg shadow-lg">
                      <ApartmentFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}  // FIXED: Use the correct handler
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

                    {/* Statistics Card */}
                    <div className="bg-white rounded-lg shadow-lg">
                      <ApartmentStatistics 
                        stats={stats}
                        totalData={apartmentData.length}
                        filteredData={filteredData.length}
                      />
                    </div>

                    {/* Proximity Place Buttons */}
                    <div className="bg-white rounded-lg shadow-lg">
                      <ProximityPlaceButtons
                        onPlaceClick={handleProximityPlaceClick}
                        selectedPlace={selectedProximityPlace}
                        showingNearbyPlaces={showingNearbyPlaces}
                        onClearNearbyPlaces={clearNearbyPlaces}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Statistics Panel - Shows when apartment is selected */}
        {isMobile && selectedApartment && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 rounded-t-lg shadow-lg z-40 max-h-[50vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">รายละเอียดอพาร์ตเมนต์</h3>
                <button
                  onClick={() => setSelectedApartment(null)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ApartmentStatistics 
                stats={stats}
                totalData={apartmentData.length}
                filteredData={filteredData.length}
                selectedApartment={selectedApartment}
                calculateAmenityScore={calculateAmenityScore}
                proximityScores={proximityScores}
                isMobile={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ApartmentSupply;
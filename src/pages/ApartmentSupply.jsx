import React, { useState, useEffect } from 'react';
import { getCkanData } from '../utils/ckanClient';
import ApartmentMap from '../components/apartment-supply/ApartmentMap';

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
    proximityScore: 'all', // NEW: Proximity score filter
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
    averageProximityScore: 0, // NEW: Average proximity score
    propertyTypes: {},
    roomTypes: {},
    priceRanges: {},
    popularAmenities: {}
  });

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

  // Filter properties with proximity scores (updated for all provinces)
  const getFilteredData = (proximityScores = {}) => {
    if (!apartmentData || !Array.isArray(apartmentData)) return [];

    return apartmentData.filter(property => {
      // Province filter (now used as a filter, not data loader)
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

      // Proximity score filter (only filter if score exists)
      if (filters.proximityScore !== 'all') {
        const proximityScore = proximityScores[property.id];
        // Only apply filter if the property has a calculated proximity score
        if (proximityScore !== undefined) {
          const [minScore, maxScore] = filters.proximityScore.split('-').map(Number);
          if (maxScore) {
            if (proximityScore < minScore || proximityScore > maxScore) return false;
          } else {
            if (proximityScore < minScore) return false;
          }
        }
        // If no proximity score calculated yet, include the property (don't filter out)
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

  // Toggle filters visibility on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Get unique values for dropdowns
  const getUniquePropertyTypes = () => {
    return [...new Set(apartmentData.map(item => item.property_type).filter(Boolean))];
  };

  const getUniqueRoomTypes = () => {
    return [...new Set(apartmentData.map(item => item.room_type).filter(Boolean))];
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
    
    // NEW: Calculate average proximity score
    const proximityScoresArray = data.map(prop => proximityScores[prop.id] || 0);
    const totalProximityScore = proximityScoresArray.reduce((sum, score) => sum + score, 0);
    const averageProximityScore = proximityScoresArray.length > 0 ? 
      Math.round(totalProximityScore / proximityScoresArray.length) : 0;

    // Calculate property type distribution
    const propertyTypes = {};
    data.forEach(prop => {
      if (prop.property_type) {
        propertyTypes[prop.property_type] = (propertyTypes[prop.property_type] || 0) + 1;
      }
    });

    // Calculate room type distribution
    const roomTypes = {};
    data.forEach(prop => {
      if (prop.room_type) {
        roomTypes[prop.room_type] = (roomTypes[prop.room_type] || 0) + 1;
      }
    });

    // Calculate price range distribution
    const priceRanges = {
      'under5k': 0,
      '5k-10k': 0,
      '10k-20k': 0,
      '20k-30k': 0,
      'over30k': 0
    };

    data.forEach(prop => {
      const price = parseFloat(prop.monthly_min_price) || 0;
      if (price < 5000) priceRanges['under5k']++;
      else if (price < 10000) priceRanges['5k-10k']++;
      else if (price < 20000) priceRanges['10k-20k']++;
      else if (price < 30000) priceRanges['20k-30k']++;
      else priceRanges['over30k']++;
    });

    // Calculate popular amenities
    const popularAmenities = {};
    const amenityFields = [
      { key: 'has_air', label: 'เครื่องปรับอากาศ' },
      { key: 'has_furniture', label: 'เฟอร์นิเจอร์' },
      { key: 'has_internet', label: 'อินเทอร์เน็ต' },
      { key: 'has_parking', label: 'ที่จอดรถ' },
      { key: 'has_lift', label: 'ลิฟต์' },
      { key: 'has_pool', label: 'สระว่ายน้ำ' },
      { key: 'has_fitness', label: 'ฟิตเนส' },
      { key: 'has_security', label: 'รักษาความปลอดภัย' },
      { key: 'has_cctv', label: 'กล้องวงจรปิด' },
      { key: 'allow_pet', label: 'อนุญาตสัตว์เลี้ยง' }
    ];

    amenityFields.forEach(field => {
      const count = data.filter(prop => prop[field.key] === true || prop[field.key] === 'TRUE').length;
      popularAmenities[field.key] = totalProperties > 0 ? (count / totalProperties) * 100 : 0;
    });

    setStats({
      totalProperties,
      availableProperties,
      availabilityRate,
      averagePrice: totalProperties > 0 ? Math.round(totalPrice / totalProperties) : 0,
      averageSize: totalProperties > 0 ? Math.round(totalSize / totalProperties) : 0,
      averageAmenityScore: totalProperties > 0 ? Math.round(totalAmenityScore / totalProperties) : 0,
      averageProximityScore,
      propertyTypes,
      roomTypes,
      priceRanges,
      popularAmenities
    });
  };

  // Load apartment data from all provinces
  useEffect(() => {
    const loadApartmentData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading apartment data from all provinces...');
        
        const resourceId = 'b6dbb8e0-1194-4eeb-945d-e883b3275b35';
        
        // Load all data without province filter
        const result = await getCkanData(resourceId, {
          limit: 50000, // High limit to get all records
          sort: 'name asc'
        });
        
        console.log('Raw apartment data from all provinces:', result);
        
        if (result && result.records && Array.isArray(result.records)) {
          // Process and validate data using the same structure as useApartmentQueries.js
          const processedData = result.records.map(record => ({
            // Basic property info
            id: record.name + '_' + (record.latitude || '') + '_' + (record.longitude || ''), // Create unique ID
            name: record.name || 'Unknown Property',
            apartment_name: record.name || 'Unknown Property', // Add this for display
            property_type: record.property_type || 'APARTMENT',
            latitude: parseFloat(record.latitude),
            longitude: parseFloat(record.longitude),
            
            // Location info
            province: record.province || '',
            province_code: parseInt(record.province_code) || null,
            district: record.district || '',
            subdistrict: record.subdistrict || '',
            street: record.street || '',
            road: record.road || '',
            house_number: record.house_number || '',
            address: `${record.house_number || ''} ${record.street || ''} ${record.road || ''} ${record.subdistrict || ''} ${record.district || ''} ${record.province || ''}`.trim(),
            
            // Pricing info
            monthly_min_price: parseFloat(record.monthly_min_price) || 0,
            monthly_max_price: parseFloat(record.monthly_max_price) || 0,
            daily_min_price: parseFloat(record.daily_min_price) || 0,
            daily_max_price: parseFloat(record.daily_max_price) || 0,
            daily_rental_type: record.daily_rental_type || '',
            
            // Fee structure
            water_fee_type: record.water_fee_type || '',
            water_unit_price: parseFloat(record.water_unit_price) || 0,
            electric_fee_type: record.electric_fee_type || '',
            electric_unit_price: parseFloat(record.electric_unit_price) || 0,
            service_fee_type: record.service_fee_type || '',
            internet_fee_type: record.internet_fee_type || '',
            deposit_type: record.deposit_type || '',
            
            // Room info
            room_type: record.room_type || '',
            room_size_min: parseFloat(record.room_size_min) || 0,
            room_size_max: parseFloat(record.room_size_max) || 0,
            rooms_available: parseInt(record.rooms_available) || 0,
            total_room_types: parseInt(record.total_room_types) || 0,
            
            // Amenities - convert string 'TRUE'/'FALSE' to boolean
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
            total_amenities: parseInt(record.total_amenities) || 0,
            
            // Contact info
            contact_email: record.contact_email || '',
            contact_line_id: record.contact_line_id || '',
            phone_count: parseInt(record.phone_count) || 0,
            url: record.url || ''
          })).filter(property => {
            // Enhanced coordinate validation with Thailand boundary check
            if (!property.latitude || !property.longitude || 
                isNaN(property.latitude) || isNaN(property.longitude)) {
              console.log(`Filtered out property with invalid coordinates: ${property.apartment_name || 'Unknown'} - lat: ${property.latitude}, lng: ${property.longitude}`);
              return false;
            }

            // Check if coordinates are within Thailand's boundaries
            if (!isCoordinateInThailand(property.latitude, property.longitude)) {
              console.log(`Filtered out property outside Thailand: ${property.apartment_name || 'Unknown'} - lat: ${property.latitude}, lng: ${property.longitude}`);
              return false;
            }

            return true;
          });
          
          console.log(`Processed ${processedData.length} valid property records within Thailand boundaries`);
          
          // Group by province for statistics
          const provinceStats = {};
          processedData.forEach(property => {
            const provinceName = property.province || 'ไม่ระบุ';
            if (!provinceStats[provinceName]) {
              provinceStats[provinceName] = 0;
            }
            provinceStats[provinceName]++;
          });
          
          console.log('Properties by province:', provinceStats);
          
          setApartmentData(processedData);
          calculateStatistics(processedData);
        } else {
          console.error('Invalid data structure received:', result);
          setError('ไม่พบข้อมูลอพาร์ตเมนต์');
          setApartmentData([]);
        }
      } catch (error) {
        console.error('Error loading apartment data:', error);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
        setApartmentData([]);
      } finally {
        setLoading(false);
      }
    };

    loadApartmentData();
  }, []); // Remove selectedProvince dependency to load all data

  // Handle apartment selection
  const handleApartmentSelect = (apartment) => {
    setSelectedApartment(apartment);
    
    // On mobile, close filters when an apartment is selected
    if (isMobile && showFilters) {
      setShowFilters(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setSelectedApartment(null); // Clear selection when filters change
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล Housing Stock...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ข้อมูล Housing Stock</h1>
              <p className="text-gray-600">แสดงข้อมูลที่อยู่อาศัย เช่น อพาร์ตเมนต์และที่พักเช่าในเขตพื้นที่ต่าง ๆ</p>
            </div>
            
            {/* Mobile filter toggle */}
            {isMobile && (
              <button
                onClick={toggleFilters}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600"
              >
                {showFilters ? 'ซ่อนตัวกรอง' : 'แสดงตัวกรอง'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Panel */}
          {(!isMobile || showFilters) && (
            <div className={`${isMobile ? 'w-full' : 'w-80'} space-y-6`}>
              {/* Province Selection */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-3">เลือกจังหวัด</h3>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedProvince || 'all'}
                  onChange={(e) => setSelectedProvince(e.target.value === 'all' ? null : parseInt(e.target.value))}
                >
                  <option value="all">ทุกจังหวัด</option>
                  {provinces.map(province => (
                    <option key={province.id} value={province.id}>{province.name}</option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-gray-500">
                  แสดงข้อมูลจาก {filteredData.length.toLocaleString()} อพาร์ตเมนต์
                  {selectedProvince ? ` ใน${provinces.find(p => p.id === selectedProvince)?.name}` : ' ทุกจังหวัด'}
                </div>
              </div>

              {/* Color Scheme Selection */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-3">การแสดงผลแผนที่</h3>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value)}
                >
                  <option value="priceRange">แสดงตามช่วงราคา</option>
                  <option value="amenityScore">แสดงตามคะแนนสิ่งอำนวยความสะดวก</option>
                  <option value="proximityScore">แสดงตามคะแนนความใกล้เคียงสถานที่</option>
                </select>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
                <h3 className="font-semibold text-gray-800">ตัวกรองข้อมูล</h3>
                
                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">ช่วงราคา (บาท/เดือน)</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange({...filters, priceRange: e.target.value})}
                  >
                    <option value="all">ทุกช่วงราคา</option>
                    <option value="0-5000">น้อยกว่า 5,000</option>
                    <option value="5000-10000">5,000-10,000</option>
                    <option value="10000-20000">10,000-20,000</option>
                    <option value="20000-30000">20,000-30,000</option>
                    <option value="30000-999999">มากกว่า 30,000</option>
                  </select>
                </div>

                {/* Property Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">ประเภทที่พัก</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={filters.propertyType}
                    onChange={(e) => handleFilterChange({...filters, propertyType: e.target.value})}
                  >
                    <option value="all">ทุกประเภท</option>
                    {getUniquePropertyTypes().map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Room Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">ประเภทห้อง</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={filters.roomType}
                    onChange={(e) => handleFilterChange({...filters, roomType: e.target.value})}
                  >
                    <option value="all">ทุกประเภท</option>
                    {getUniqueRoomTypes().map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Size Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">ขนาดห้อง (ตร.ม.)</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={filters.sizeRange}
                    onChange={(e) => handleFilterChange({...filters, sizeRange: e.target.value})}
                  >
                    <option value="all">ทุกขนาด</option>
                    <option value="0-20">น้อยกว่า 20 ตร.ม.</option>
                    <option value="20-35">20-35 ตร.ม.</option>
                    <option value="35-50">35-50 ตร.ม.</option>
                    <option value="50-999">มากกว่า 50 ตร.ม.</option>
                  </select>
                </div>

                {/* Amenity Score Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">คะแนนสิ่งอำนวยความสะดวก (%)</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={filters.amenities}
                    onChange={(e) => handleFilterChange({...filters, amenities: e.target.value})}
                  >
                    <option value="all">ทุกระดับ</option>
                    <option value="80-100">สูงมาก (80-100%)</option>
                    <option value="60-79">สูง (60-79%)</option>
                    <option value="40-59">ปานกลาง (40-59%)</option>
                    <option value="20-39">ต่ำ (20-39%)</option>
                    <option value="0-19">ต่ำมาก (0-19%)</option>
                  </select>
                </div>

                {/* Proximity Score Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">คะแนนความใกล้เคียงสถานบริการ (%)</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={filters.proximityScore}
                    onChange={(e) => handleFilterChange({...filters, proximityScore: e.target.value})}
                  >
                    <option value="all">ทุกระดับ</option>
                    <option value="80-100">ใกล้มาก (80-100%)</option>
                    <option value="60-79">ใกล้ (60-79%)</option>
                    <option value="40-59">ปานกลาง (40-59%)</option>
                    <option value="20-39">ไกล (20-39%)</option>
                    <option value="0-19">ไกลมาก (0-19%)</option>
                  </select>
                </div>

                {/* Required Amenities Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">สิ่งอำนวยความสะดวกที่จำเป็น</label>
                  <div className="space-y-2">
                    {[
                      { key: 'air', label: 'เครื่องปรับอากาศ' },
                      { key: 'furniture', label: 'เฟอร์นิเจอร์' },
                      { key: 'internet', label: 'อินเทอร์เน็ต' },
                      { key: 'parking', label: 'ที่จอดรถ' },
                      { key: 'lift', label: 'ลิฟต์' },
                      { key: 'pool', label: 'สระว่ายน้ำ' },
                      { key: 'fitness', label: 'ฟิตเนส' },
                      { key: 'security', label: 'รักษาความปลอดภัย' }
                    ].map(amenity => (
                      <label key={amenity.key} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={filters.requiredAmenities.includes(amenity.key)}
                          onChange={(e) => {
                            const newAmenities = e.target.checked 
                              ? [...filters.requiredAmenities, amenity.key]
                              : filters.requiredAmenities.filter(a => a !== amenity.key);
                            handleFilterChange({...filters, requiredAmenities: newAmenities});
                          }}
                        />
                        <span className="ml-2 text-sm text-gray-700">{amenity.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistics Panel */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-3">สถิติข้อมูล</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ทั้งหมด:</span>
                    <span className="font-medium">{stats.totalProperties.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ที่พักว่าง:</span>
                    <span className="font-medium text-green-600">{stats.availableProperties.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">อัตราว่าง:</span>
                    <span className="font-medium text-green-600">{stats.availabilityRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ราคาเฉลี่ย:</span>
                    <span className="font-medium">฿{stats.averagePrice.toLocaleString()}/เดือน</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ขนาดเฉลี่ย:</span>
                    <span className="font-medium">{stats.averageSize} ตร.ม.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">คะแนนสิ่งอำนวยฯ เฉลี่ย:</span>
                    <span className="font-medium">{stats.averageAmenityScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">คะแนนความใกล้เคียง เฉลี่ย:</span>
                    <span className="font-medium">{stats.averageProximityScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map Panel */}
          <div className={`${showFilters ? (isMobile ? 'w-full' : 'flex-1') : 'w-full'}`}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Results count */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    แสดงผล {filteredData.length.toLocaleString()} จาก {apartmentData.length.toLocaleString()} รายการ
                  </span>
                  {selectedApartment && (
                    <button
                      onClick={() => setSelectedApartment(null)}
                      className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                    >
                      ยกเลิกการเลือก
                    </button>
                  )}
                </div>
              </div>
              
              {/* Map Component */}
              <ApartmentMap
                apartmentData={filteredData}
                colorScheme={colorScheme}
                isMobile={isMobile}
                onApartmentSelect={handleApartmentSelect}
                selectedApartment={selectedApartment}
                calculateFacilityScore={calculateAmenityScore}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApartmentSupply;
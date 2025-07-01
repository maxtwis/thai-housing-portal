import React, { useState, useEffect } from 'react';
import { getCkanData } from '../utils/ckanClient';
import ApartmentMap from '../components/apartment-supply/ApartmentMap';

const ApartmentSupply = () => {
  const [apartmentData, setApartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filter state - updated for new structure
  const [filters, setFilters] = useState({
    priceRange: 'all',
    propertyType: 'all',
    roomType: 'all',
    sizeRange: 'all',
    amenities: 'all',
    requiredAmenities: []
  });

  // Color scheme state
  const [colorScheme, setColorScheme] = useState('priceRange');

  // Statistics state
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    availabilityRate: 0,
    averagePrice: 0,
    averageSize: 0,
    averageAmenityScore: 0,
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

    return Math.round((availableAmenities / totalAmenities) * 100);
  };

  // Calculate statistics
  const calculateStatistics = (data) => {
    if (!data || !data.length) {
      setStats({
        totalProperties: 0,
        availableProperties: 0,
        availabilityRate: 0,
        averagePrice: 0,
        averageSize: 0,
        averageAmenityScore: 0,
        propertyTypes: {},
        roomTypes: {},
        priceRanges: {},
        popularAmenities: {}
      });
      return;
    }

    const totalProperties = data.length;
    const availableProperties = data.filter(prop => prop.rooms_available && prop.rooms_available > 0).length;
    const availabilityRate = (availableProperties / totalProperties) * 100;
    const totalPrice = data.reduce((sum, prop) => sum + (parseFloat(prop.monthly_min_price) || 0), 0);
    const totalSize = data.reduce((sum, prop) => sum + (parseFloat(prop.room_size_min) || 0), 0);
    const totalAmenityScore = data.reduce((sum, prop) => sum + calculateAmenityScore(prop), 0);

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

    amenityFields.forEach(({ key, label }) => {
      const count = data.filter(prop => prop[key] === 'TRUE' || prop[key] === true).length;
      popularAmenities[key] = (count / totalProperties) * 100;
    });

    setStats({
      totalProperties,
      availableProperties,
      availabilityRate: Math.round(availabilityRate),
      averagePrice: Math.round(totalPrice / totalProperties),
      averageSize: Math.round(totalSize / totalProperties),
      averageAmenityScore: Math.round(totalAmenityScore / totalProperties),
      propertyTypes,
      roomTypes,
      priceRanges,
      popularAmenities
    });
  };

  // Load apartment data from CKAN API
  useEffect(() => {
    const loadApartmentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading apartment data from CKAN API...');
        
        const result = await getCkanData('b6dbb8e0-1194-4eeb-945d-e883b3275b35', {
          limit: 2000,
          sort: 'name asc'
        });
        
        if (!result || !result.records) {
          throw new Error('No data received from CKAN API');
        }
        
        // Process and validate the data with new structure
        const processedData = result.records.map(record => ({
          // Basic property info
          id: record.name + '_' + (record.latitude || '') + '_' + (record.longitude || ''), // Create unique ID
          name: record.name || 'Unknown Property',
          property_type: record.property_type || 'APARTMENT',
          latitude: parseFloat(record.latitude),
          longitude: parseFloat(record.longitude),
          
          // Location info
          province: record.province || '',
          district: record.district || '',
          subdistrict: record.subdistrict || '',
          address: `${record.house_number || ''} ${record.street || ''} ${record.road || ''} ${record.subdistrict || ''} ${record.district || ''} ${record.province || ''}`.trim(),
          
          // Pricing info
          monthly_min_price: parseFloat(record.monthly_min_price) || 0,
          monthly_max_price: parseFloat(record.monthly_max_price) || 0,
          daily_min_price: parseFloat(record.daily_min_price) || 0,
          daily_max_price: parseFloat(record.daily_max_price) || 0,
          
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
          url: record.url || '',
          
          // Fees
          water_fee_type: record.water_fee_type || '',
          water_unit_price: parseFloat(record.water_unit_price) || 0,
          electric_fee_type: record.electric_fee_type || '',
          electric_unit_price: parseFloat(record.electric_unit_price) || 0,
          service_fee_type: record.service_fee_type || '',
          internet_fee_type: record.internet_fee_type || '',
          deposit_type: record.deposit_type || ''
        })).filter(property => 
          // Filter out properties without valid coordinates
          property.latitude && property.longitude && 
          !isNaN(property.latitude) && !isNaN(property.longitude)
        );
        
        console.log(`Processed ${processedData.length} valid property records`);
        
        setApartmentData(processedData);
        calculateStatistics(processedData);
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading apartment data:', err);
        setError(`Failed to load apartment data: ${err.message}`);
        setLoading(false);
      }
    };

    loadApartmentData();
  }, []);

  // Filter apartment data based on current filters
  const getFilteredData = () => {
    return apartmentData.filter(property => {
      // Price range filter (monthly)
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

  // Get the filtered data count for display
  const filteredData = getFilteredData();

  // Get unique values for dropdowns
  const getUniquePropertyTypes = () => {
    return [...new Set(apartmentData.map(prop => prop.property_type).filter(Boolean))];
  };

  const getUniqueRoomTypes = () => {
    return [...new Set(apartmentData.map(prop => prop.room_type).filter(Boolean))];
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Property Supply Analysis</h1>
            <p className="text-gray-600 mt-2">
              สำรวจข้อมูลอสังหาริมทรัพย์ พร้อมดูสิ่งที่อยู่ใกล้เคียงผ่าน OpenStreetMap
            </p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลอสังหาริมทรัพย์จาก CKAN API...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Property Supply Analysis</h1>
            <p className="text-gray-600 mt-2">
              สำรวจข้อมูลอสังหาริมทรัพย์ พร้อมดูสิ่งที่อยู่ใกล้เคียงผ่าน OpenStreetMap
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
            <p className="text-sm mt-1">{error}</p>
            <div className="mt-4">
              <p className="text-sm">ตรวจสอบ:</p>
              <ul className="text-sm list-disc list-inside mt-1">
                <li>การเชื่อมต่ออินเทอร์เน็ต</li>
                <li>CKAN API Server (Resource ID: b6dbb8e0-1194-4eeb-945d-e883b3275b35)</li>
                <li>โครงสร้างข้อมูลในฐานข้อมูล</li>
              </ul>
              <button 
                onClick={() => window.location.reload()}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
              >
                โหลดใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Property Supply Analysis</h1>
          <p className="text-gray-600 mt-2">
            สำรวจข้อมูลอสังหาริมทรัพย์ พร้อมดูสิ่งที่อยู่ใกล้เคียงผ่าน OpenStreetMap
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-gray-500">
              แสดง {filteredData.length.toLocaleString()} จาก {apartmentData.length.toLocaleString()} ที่พัก
            </span>
          </div>
        </div>

        {/* Mobile filter toggle */}
        {isMobile && (
          <div className="mb-4">
            <button
              onClick={toggleFilters}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2"
            >
              <span>{showFilters ? 'ซ่อน' : 'แสดง'}ตัวกรองข้อมูล</span>
              <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Filters Panel */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">ตัวกรองข้อมูล</h2>
                  {isMobile && (
                    <button
                      onClick={toggleFilters}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Color Scheme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">แสดงสีตาม</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={colorScheme}
                    onChange={(e) => setColorScheme(e.target.value)}
                  >
                    <option value="priceRange">ช่วงราคา</option>
                    <option value="propertyType">ประเภทที่พัก</option>
                    <option value="roomType">ประเภทห้อง</option>
                    <option value="amenityScore">คะแนนสิ่งอำนวยความสะดวก</option>
                    <option value="size">ขนาดห้อง</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">ช่วงราคา (บาท/เดือน)</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={filters.priceRange}
                    onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                  >
                    <option value="all">ทุกช่วงราคา</option>
                    <option value="0-5000">ต่ำกว่า 5,000 บาท</option>
                    <option value="5000-10000">5,000 - 10,000 บาท</option>
                    <option value="10000-20000">10,000 - 20,000 บาท</option>
                    <option value="20000-30000">20,000 - 30,000 บาท</option>
                    <option value="30000-999999">มากกว่า 30,000 บาท</option>
                  </select>
                </div>

                {/* Property Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">ประเภทที่พัก</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={filters.propertyType}
                    onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
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
                    onChange={(e) => setFilters({...filters, roomType: e.target.value})}
                  >
                    <option value="all">ทุกประเภท</option>
                    {getUniqueRoomTypes().map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Size Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">ขนาดห้อง (ตร.ม.)</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={filters.sizeRange}
                    onChange={(e) => setFilters({...filters, sizeRange: e.target.value})}
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
                    onChange={(e) => setFilters({...filters, amenities: e.target.value})}
                  >
                    <option value="all">ทุกระดับ</option>
                    <option value="80-100">สูงมาก (80-100%)</option>
                    <option value="60-79">สูง (60-79%)</option>
                    <option value="40-59">ปานกลาง (40-59%)</option>
                    <option value="20-39">ต่ำ (20-39%)</option>
                    <option value="0-19">ต่ำมาก (0-19%)</option>
                  </select>
                </div>

                {/* Required Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">สิ่งอำนวยความสะดวกที่ต้องการ</label>
                  <div className="mt-2 space-y-2">
                    {[
                      { key: 'parking', label: 'ที่จอดรถ' },
                      { key: 'internet', label: 'อินเทอร์เน็ต' },
                      { key: 'pool', label: 'สระว่ายน้ำ' },
                      { key: 'fitness', label: 'ฟิตเนส' },
                      { key: 'security', label: 'รปภ.24ชม.' },
                      { key: 'lift', label: 'ลิฟต์' },
                      { key: 'air', label: 'เครื่องปรับอากาศ' },
                      { key: 'furniture', label: 'เฟอร์นิเจอร์' }
                    ].map(amenity => (
                      <label key={amenity.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.requiredAmenities.includes(amenity.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                requiredAmenities: [...filters.requiredAmenities, amenity.key]
                              });
                            } else {
                              setFilters({
                                ...filters,
                                requiredAmenities: filters.requiredAmenities.filter(f => f !== amenity.key)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{amenity.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setFilters({
                        priceRange: 'all',
                        propertyType: 'all',
                        roomType: 'all',
                        sizeRange: 'all',
                        amenities: 'all',
                        requiredAmenities: []
                      });
                      setColorScheme('priceRange');
                    }}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              </div>

              {/* Statistics Panel */}
              <div className="bg-white rounded-lg shadow p-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">สถิติข้อมูล</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">จำนวนที่พัก:</span>
                    <span className="text-sm font-medium">{stats.totalProperties.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ที่พักว่าง:</span>
                    <span className="text-sm font-medium text-green-600">{stats.availableProperties.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">อัตราว่าง:</span>
                    <span className="text-sm font-medium text-green-600">{stats.availabilityRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ราคาเฉลี่ย:</span>
                    <span className="text-sm font-medium">฿{stats.averagePrice.toLocaleString()}/เดือน</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ขนาดเฉลี่ย:</span>
                    <span className="text-sm font-medium">{stats.averageSize} ตร.ม.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">คะแนนสิ่งอำนวยฯ เฉลี่ย:</span>
                    <span className="text-sm font-medium">{stats.averageAmenityScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map Panel - Using the separate ApartmentMap component */}
          <div className={`${showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <ApartmentMap
              apartmentData={filteredData}
              filters={filters}
              colorScheme={colorScheme}
              isMobile={isMobile}
              selectedApartment={selectedApartment}
              onApartmentSelect={setSelectedApartment}
              calculateFacilityScore={calculateAmenityScore}
            />
          </div>
        </div>

        {/* Selected Property Details */}
        {selectedApartment && (
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">รายละเอียดที่พัก</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-gray-700">{selectedApartment.name}</h4>
                <p className="text-sm text-gray-600">{selectedApartment.address}</p>
                <p className="text-sm text-gray-600">ประเภท: {selectedApartment.property_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ห้อง: {selectedApartment.room_type}</p>
                <p className="text-sm text-gray-600">ขนาด: {selectedApartment.room_size_min || 'N/A'} ตร.ม.</p>
                {selectedApartment.rooms_available && selectedApartment.rooms_available > 0 && (
                  <p className="text-sm text-green-600 font-medium">สถานะ: ว่าง</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">ราคา/เดือน: ฿{selectedApartment.monthly_min_price?.toLocaleString() || 'N/A'}</p>
                {selectedApartment.daily_min_price > 0 && (
                  <p className="text-sm text-gray-600">ราคา/วัน: ฿{selectedApartment.daily_min_price?.toLocaleString()}</p>
                )}
                <p className="text-sm text-gray-600">คะแนนสิ่งอำนวยฯ: {calculateAmenityScore(selectedApartment)}%</p>
              </div>
              <div>
                {selectedApartment.contact_line_id && (
                  <p className="text-sm text-gray-600">Line ID: {selectedApartment.contact_line_id}</p>
                )}
                {selectedApartment.url && (
                  <a 
                    href={selectedApartment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    ดูรายละเอียดเพิ่มเติม
                  </a>
                )}
                <button
                  onClick={() => setSelectedApartment(null)}
                  className="block mt-2 bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
            
            {/* Amenities List */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">สิ่งอำนวยความสะดวก</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'has_air', label: 'เครื่องปรับอากาศ', icon: '❄️' },
                  { key: 'has_furniture', label: 'เฟอร์นิเจอร์', icon: '🛋️' },
                  { key: 'has_internet', label: 'อินเทอร์เน็ต', icon: '📶' },
                  { key: 'has_parking', label: 'ที่จอดรถ', icon: '🚗' },
                  { key: 'has_lift', label: 'ลิฟต์', icon: '🛗' },
                  { key: 'has_pool', label: 'สระว่ายน้ำ', icon: '🏊‍♂️' },
                  { key: 'has_fitness', label: 'ฟิตเนส', icon: '💪' },
                  { key: 'has_security', label: 'รักษาความปลอดภัย', icon: '🔒' },
                  { key: 'has_cctv', label: 'กล้องวงจรปิด', icon: '📹' },
                  { key: 'allow_pet', label: 'อนุญาตสัตว์เลี้ยง', icon: '🐕' }
                ].map(amenity => (
                  selectedApartment[amenity.key] && (
                    <span 
                      key={amenity.key}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                    >
                      <span>{amenity.icon}</span>
                      <span>{amenity.label}</span>
                    </span>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentSupply;
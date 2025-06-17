import React, { useState, useEffect } from 'react';
import { getCkanData } from '../utils/ckanClient';
import ApartmentMap from '../components/ApartmentMap';

const ApartmentSupply = () => {
  const [apartmentData, setApartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filter state
  const [filters, setFilters] = useState({
    priceRange: 'all',
    roomType: 'all',
    sizeRange: 'all',
    facilities: 'all',
    requiredFacilities: []
  });

  // Color scheme state
  const [colorScheme, setColorScheme] = useState('priceRange');

  // Statistics state
  const [stats, setStats] = useState({
    totalApartments: 0,
    averagePrice: 0,
    averageSize: 0,
    averageFacilityScore: 0,
    roomTypes: {},
    priceRanges: {},
    popularFacilities: {}
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

  // Calculate facility score for an apartment
  const calculateFacilityScore = (apartment) => {
    const facilityFields = [
      'facility_aircondition', 'facility_waterheater', 'facility_furniture',
      'facility_tv', 'facility_cabletv', 'facility_wifi', 'facility_parking',
      'facility_moto_parking', 'facility_elevator', 'facility_keycard',
      'facility_cctv', 'facility_security', 'facility_laundry_shop',
      'facility_shop', 'facility_fan', 'facility_telephone', 'facility_restaurant',
      'facility_internet_cafe', 'facility_salon', 'facility_smoke_allowed',
      'facility_shuttle', 'facility_pets_allowed', 'facility_pool',
      'facility_gym', 'facility_LAN'
    ];

    const totalFacilities = facilityFields.length;
    const availableFacilities = facilityFields.reduce((count, field) => {
      return count + (apartment[field] ? 1 : 0);
    }, 0);

    return Math.round((availableFacilities / totalFacilities) * 100);
  };

  // Calculate statistics
  const calculateStatistics = (data) => {
    if (!data || !data.length) {
      setStats({
        totalApartments: 0,
        averagePrice: 0,
        averageSize: 0,
        averageFacilityScore: 0,
        roomTypes: {},
        priceRanges: {},
        popularFacilities: {}
      });
      return;
    }

    const totalApartments = data.length;
    const totalPrice = data.reduce((sum, apt) => sum + (apt.price_min || 0), 0);
    const totalSize = data.reduce((sum, apt) => sum + (apt.size_max || apt.size_min || 0), 0);
    const totalFacilityScore = data.reduce((sum, apt) => sum + calculateFacilityScore(apt), 0);

    // Calculate room type distribution
    const roomTypes = {};
    data.forEach(apt => {
      if (apt.room_type) {
        roomTypes[apt.room_type] = (roomTypes[apt.room_type] || 0) + 1;
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

    data.forEach(apt => {
      const price = apt.price_min || 0;
      if (price < 5000) priceRanges['under5k']++;
      else if (price < 10000) priceRanges['5k-10k']++;
      else if (price < 20000) priceRanges['10k-20k']++;
      else if (price < 30000) priceRanges['20k-30k']++;
      else priceRanges['over30k']++;
    });

    setStats({
      totalApartments,
      averagePrice: Math.round(totalPrice / totalApartments),
      averageSize: Math.round(totalSize / totalApartments),
      averageFacilityScore: Math.round(totalFacilityScore / totalApartments),
      roomTypes,
      priceRanges,
      popularFacilities: {}
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
          sort: 'apartment_id asc'
        });
        
        if (!result || !result.records) {
          throw new Error('No data received from CKAN API');
        }
        
        // Process and validate the data
        const processedData = result.records.map(record => ({
          apartment_id: record.apartment_id,
          apartment_name: record.apartment_name || `Apartment ${record.apartment_id}`,
          room_type: record.room_type,
          size_min: parseFloat(record.size_min) || 0,
          size_max: parseFloat(record.size_max) || 0,
          price_min: parseFloat(record.price_min) || 0,
          price_max: parseFloat(record.price_max) || 0,
          address: record.address,
          latitude: parseFloat(record.latitude),
          longitude: parseFloat(record.longitude),
          // Facility data
          facility_aircondition: parseFloat(record.facility_aircondition) || 0,
          facility_waterheater: parseFloat(record.facility_waterheater) || 0,
          facility_furniture: parseFloat(record.facility_furniture) || 0,
          facility_tv: parseInt(record.facility_tv) || 0,
          facility_cabletv: parseInt(record.facility_cabletv) || 0,
          facility_wifi: parseFloat(record.facility_wifi) || 0,
          facility_parking: parseInt(record.facility_parking) || 0,
          facility_moto_parking: parseInt(record.facility_moto_parking) || 0,
          facility_elevator: parseInt(record.facility_elevator) || 0,
          facility_keycard: parseFloat(record.facility_keycard) || 0,
          facility_cctv: parseFloat(record.facility_cctv) || 0,
          facility_security: parseFloat(record.facility_security) || 0,
          facility_laundry_shop: parseInt(record.facility_laundry_shop) || 0,
          facility_shop: parseInt(record.facility_shop) || 0,
          facility_fan: parseInt(record.facility_fan) || 0,
          facility_telephone: parseInt(record.facility_telephone) || 0,
          facility_restaurant: parseInt(record.facility_restaurant) || 0,
          facility_internet_cafe: parseInt(record.facility_internet_cafe) || 0,
          facility_salon: parseInt(record.facility_salon) || 0,
          facility_smoke_allowed: parseInt(record.facility_smoke_allowed) || 0,
          facility_shuttle: parseInt(record.facility_shuttle) || 0,
          facility_pets_allowed: parseInt(record.facility_pets_allowed) || 0,
          facility_pool: parseInt(record.facility_pool) || 0,
          facility_gym: parseInt(record.facility_gym) || 0,
          facility_LAN: parseInt(record.facility_LAN) || 0
        })).filter(apartment => 
          apartment.latitude && apartment.longitude && 
          !isNaN(apartment.latitude) && !isNaN(apartment.longitude)
        );
        
        console.log(`Processed ${processedData.length} valid apartment records`);
        
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
    return apartmentData.filter(apartment => {
      // Price range filter
      if (filters.priceRange !== 'all') {
        const [minPrice, maxPrice] = filters.priceRange.split('-').map(Number);
        const apartmentPrice = apartment.price_min || 0;
        if (maxPrice && maxPrice !== 999999) {
          if (apartmentPrice < minPrice || apartmentPrice > maxPrice) return false;
        } else {
          if (apartmentPrice < minPrice) return false;
        }
      }

      // Room type filter
      if (filters.roomType !== 'all') {
        if (apartment.room_type !== filters.roomType) return false;
      }

      // Size filter
      if (filters.sizeRange !== 'all') {
        const [minSize, maxSize] = filters.sizeRange.split('-').map(Number);
        const apartmentSize = apartment.size_max || apartment.size_min || 0;
        if (maxSize && maxSize !== 999) {
          if (apartmentSize < minSize || apartmentSize > maxSize) return false;
        } else {
          if (apartmentSize < minSize) return false;
        }
      }

      // Facility score filter
      if (filters.facilities !== 'all') {
        const facilityScore = calculateFacilityScore(apartment);
        const [minScore, maxScore] = filters.facilities.split('-').map(Number);
        if (maxScore) {
          if (facilityScore < minScore || facilityScore > maxScore) return false;
        } else {
          if (facilityScore < minScore) return false;
        }
      }

      // Required facilities filter
      if (filters.requiredFacilities && filters.requiredFacilities.length > 0) {
        const facilityMap = {
          'parking': 'facility_parking',
          'wifi': 'facility_wifi',
          'pool': 'facility_pool',
          'gym': 'facility_gym',
          'security': 'facility_security',
          'elevator': 'facility_elevator'
        };

        for (const requiredFacility of filters.requiredFacilities) {
          const facilityKey = facilityMap[requiredFacility];
          if (!facilityKey || !apartment[facilityKey]) {
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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Apartment Supply Analysis</h1>
            <p className="text-gray-600 mt-2">
              สำรวจข้อมูลอพาร์ตเมนต์ พร้อมดูสิ่งที่อยู่ใกล้เคียงผ่าน OpenStreetMap
            </p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลอพาร์ตเมนต์จาก CKAN API...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Apartment Supply Analysis</h1>
            <p className="text-gray-600 mt-2">
              สำรวจข้อมูลอพาร์ตเมนต์ พร้อมดูสิ่งที่อยู่ใกล้เคียงผ่าน OpenStreetMap
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
          <h1 className="text-2xl font-bold text-gray-800">Apartment Supply Analysis</h1>
          <p className="text-gray-600 mt-2">
            สำรวจข้อมูลอพาร์ตเมนต์ พร้อมดูสิ่งที่อยู่ใกล้เคียงผ่าน OpenStreetMap
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-gray-500">
              แสดง {filteredData.length.toLocaleString()} จาก {apartmentData.length.toLocaleString()} อพาร์ตเมนต์
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
                    <option value="roomType">ประเภทห้อง</option>
                    <option value="facilityScore">คะแนนสิ่งอำนวยความสะดวก</option>
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

                {/* Room Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">ประเภทห้อง</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={filters.roomType}
                    onChange={(e) => setFilters({...filters, roomType: e.target.value})}
                  >
                    <option value="all">ทุกประเภท</option>
                    {[...new Set(apartmentData.map(apt => apt.room_type).filter(Boolean))].map(type => (
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

                {/* Facility Score Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">คะแนนสิ่งอำนวยความสะดวก (%)</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={filters.facilities}
                    onChange={(e) => setFilters({...filters, facilities: e.target.value})}
                  >
                    <option value="all">ทุกระดับ</option>
                    <option value="80-100">สูงมาก (80-100%)</option>
                    <option value="60-79">สูง (60-79%)</option>
                    <option value="40-59">ปานกลาง (40-59%)</option>
                    <option value="20-39">ต่ำ (20-39%)</option>
                    <option value="0-19">ต่ำมาก (0-19%)</option>
                  </select>
                </div>

                {/* Required Facilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">สิ่งอำนวยความสะดวกที่ต้องการ</label>
                  <div className="mt-2 space-y-2">
                    {[
                      { key: 'parking', label: 'ที่จอดรถ' },
                      { key: 'wifi', label: 'WiFi' },
                      { key: 'pool', label: 'สระว่ายน้ำ' },
                      { key: 'gym', label: 'ฟิตเนส' },
                      { key: 'security', label: 'รปภ.24ชม.' },
                      { key: 'elevator', label: 'ลิฟต์' }
                    ].map(facility => (
                      <label key={facility.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.requiredFacilities.includes(facility.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                requiredFacilities: [...filters.requiredFacilities, facility.key]
                              });
                            } else {
                              setFilters({
                                ...filters,
                                requiredFacilities: filters.requiredFacilities.filter(f => f !== facility.key)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{facility.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistics Panel */}
              <div className="bg-white rounded-lg shadow p-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">สถิติข้อมูล</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">จำนวนอพาร์ตเมนต์:</span>
                    <span className="text-sm font-medium">{stats.totalApartments.toLocaleString()}</span>
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
                    <span className="text-sm font-medium">{stats.averageFacilityScore}%</span>
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
            />
          </div>
        </div>

        {/* Selected Apartment Details */}
        {selectedApartment && (
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">รายละเอียดอพาร์ตเมนต์</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-gray-700">{selectedApartment.apartment_name}</h4>
                <p className="text-sm text-gray-600">{selectedApartment.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ประเภท: {selectedApartment.room_type}</p>
                <p className="text-sm text-gray-600">ขนาด: {selectedApartment.size_max || selectedApartment.size_min || 'N/A'} ตร.ม.</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ราคา: ฿{selectedApartment.price_min?.toLocaleString() || 'N/A'}/เดือน</p>
                <p className="text-sm text-gray-600">คะแนนสิ่งอำนวยฯ: {calculateFacilityScore(selectedApartment)}%</p>
              </div>
              <div>
                <button
                  onClick={() => setSelectedApartment(null)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentSupply;
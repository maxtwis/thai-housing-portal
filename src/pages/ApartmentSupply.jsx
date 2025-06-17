import React, { useState, useEffect } from 'react';
import { useApartmentData, calculateFacilityScore } from '../hooks/useApartmentQueries';
import ApartmentMap from '../components/apartment-supply/ApartmentMap';
import ApartmentFilters from '../components/apartment-supply/ApartmentFilters';
import ApartmentStatistics from '../components/apartment-supply/ApartmentStatistics';

const ApartmentSupply = () => {
  const [colorScheme, setColorScheme] = useState('priceRange');
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    roomType: 'all',
    sizeRange: 'all',
    facilities: 'all',
    requiredFacilities: []
  });
  const [stats, setStats] = useState({
    totalApartments: 0,
    averagePrice: 0,
    averageSize: 0,
    averageFacilityScore: 0,
    roomTypes: {},
    priceRanges: {},
    popularFacilities: {}
  });

  // Use React Query hook for apartment data
  const { 
    data: apartmentData = [], 
    isLoading, 
    error,
    isFetching 
  } = useApartmentData();

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

  // Calculate statistics when apartment data changes
  useEffect(() => {
    if (apartmentData && apartmentData.length > 0) {
      calculateStatistics(apartmentData);
    }
  }, [apartmentData]);

  // Calculate statistics from apartment data
  const calculateStatistics = (data) => {
    if (!data || data.length === 0) return;

    const totalApartments = data.length;
    
    // Calculate averages
    const averagePrice = data.reduce((sum, apt) => sum + (apt.price_min || 0), 0) / totalApartments;
    const averageSize = data.reduce((sum, apt) => sum + (apt.size_max || apt.size_min || 0), 0) / totalApartments;
    
    // Calculate facility scores using the imported function
    const facilityScores = data.map(apt => calculateFacilityScore(apt));
    const averageFacilityScore = facilityScores.reduce((sum, score) => sum + score, 0) / totalApartments;

    // Count room types
    const roomTypes = {};
    data.forEach(apt => {
      const type = apt.room_type || 'Unknown';
      roomTypes[type] = (roomTypes[type] || 0) + 1;
    });

    // Count price ranges
    const priceRanges = {
      '0-5000': 0,
      '5000-10000': 0,
      '10000-20000': 0,
      '20000-30000': 0,
      '30000+': 0
    };
    data.forEach(apt => {
      const price = apt.price_min || 0;
      if (price < 5000) priceRanges['0-5000']++;
      else if (price < 10000) priceRanges['5000-10000']++;
      else if (price < 20000) priceRanges['10000-20000']++;
      else if (price < 30000) priceRanges['20000-30000']++;
      else priceRanges['30000+']++;
    });

    // Calculate popular facilities
    const popularFacilities = {};
    const facilityKeys = Object.keys(data[0] || {}).filter(key => key.startsWith('facility_'));
    facilityKeys.forEach(facility => {
      const count = data.filter(apt => apt[facility] > 0).length;
      popularFacilities[facility] = (count / totalApartments) * 100;
    });

    setStats({
      totalApartments,
      averagePrice,
      averageSize,
      averageFacilityScore,
      roomTypes,
      priceRanges,
      popularFacilities
    });
  };

  // Handle apartment selection
  const handleApartmentSelect = (apartment) => {
    setSelectedApartment(apartment);
  };

  // Clear apartment selection
  const handleClearSelection = () => {
    setSelectedApartment(null);
  };

  // Toggle filters visibility on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

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

  const filteredData = getFilteredData();

  // Show loading state
  if (isLoading) {
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
              {isFetching && <p className="text-sm text-blue-600 mt-1">🔄 กำลังอัปเดตข้อมูล...</p>}
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
            <p className="text-sm mt-1">{error.message}</p>
            <div className="mt-4">
              <p className="text-sm">ตรวจสอบ:</p>
              <ul className="text-sm list-disc list-inside mt-1">
                <li>การเชื่อมต่ออินเทอร์เน็ต</li>
                <li>CKAN API Server (Resource ID: b6dbb8e0-1194-4eeb-945d-e883b3275b35)</li>
                <li>โครงสร้างข้อมูลในฐานข้อมูล</li>
              </ul>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Apartment Supply Analysis</h1>
          <p className="text-gray-600 mt-2">
            สำรวจข้อมูลอพาร์ตเมนต์ พร้อมดูสิ่งที่อยู่ใกล้เคียงผ่าน OpenStreetMap
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              แสดง {filteredData.length.toLocaleString()} จาก {apartmentData.length.toLocaleString()} อพาร์ตเมนต์
            </span>
            {isFetching && (
              <span className="text-blue-600 flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-t border-blue-600 mr-1"></div>
                กำลังอัปเดตข้อมูล...
              </span>
            )}
          </div>
        </div>

        {/* Mobile toggle button for filters */}
        {isMobile && (
          <div className="mb-4">
            <button 
              onClick={toggleFilters}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md shadow flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              {showFilters ? 'ซ่อนตัวกรอง' : 'แสดงตัวกรอง'}
            </button>
          </div>
        )}

        {/* Desktop layout - side by side */}
        {!isMobile && (
          <div className="flex flex-row gap-4">
            {/* Left sidebar - Filters and Statistics */}
            <div className="w-1/4 space-y-4">
              <ApartmentFilters 
                filters={filters} 
                setFilters={setFilters}
                colorScheme={colorScheme}
                setColorScheme={setColorScheme}
              />
              <ApartmentStatistics 
                stats={stats} 
                selectedApartment={selectedApartment}
                onClearSelection={handleClearSelection}
              />
            </div>
            
            {/* Right side - Map */}
            <div className="w-3/4" style={{ height: "calc(100vh - 120px)" }}>
              <ApartmentMap 
                apartmentData={filteredData}
                filters={filters}
                colorScheme={colorScheme}
                isMobile={isMobile}
                selectedApartment={selectedApartment}
                onApartmentSelect={handleApartmentSelect}
              />
            </div>
          </div>
        )}

        {/* Mobile layout - stacked */}
        {isMobile && (
          <div className="flex flex-col gap-4">
            {/* Filters - conditionally shown */}
            {showFilters && (
              <div className="w-full">
                <ApartmentFilters 
                  filters={filters} 
                  setFilters={setFilters}
                  colorScheme={colorScheme}
                  setColorScheme={setColorScheme}
                />
              </div>
            )}
            
            {/* Map - always shown */}
            <div className="w-full h-[60vh]">
              <ApartmentMap 
                apartmentData={filteredData}
                filters={filters}
                colorScheme={colorScheme}
                isMobile={isMobile}
                selectedApartment={selectedApartment}
                onApartmentSelect={handleApartmentSelect}
              />
            </div>
            
            {/* Statistics - always shown on mobile */}
            <div className="w-full">
              <ApartmentStatistics 
                stats={stats} 
                selectedApartment={selectedApartment}
                onClearSelection={handleClearSelection}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentSupply;
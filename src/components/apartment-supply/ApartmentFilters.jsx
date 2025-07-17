import React from 'react';

const ApartmentFilters = ({ 
  filters, 
  onFiltersChange, 
  colorScheme, 
  onColorSchemeChange, 
  selectedProvince,
  onProvinceChange,
  provinces,
  propertyTypes,
  roomTypes,
  isMobile
}) => {
  const handleFilterChange = (filterType, value) => {
    onFiltersChange({
      ...filters,
      [filterType]: value
    });
  };

  // Count active filters (excluding province since it's always selected)
  const activeFilterCount = Object.values(filters).filter(v => v !== 'all' && (Array.isArray(v) ? v.length > 0 : true)).length;

  return (
    <div className={`${isMobile ? 'p-4' : 'p-5'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800">ตัวกรองข้อมูล</h2>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
      </div>

      {/* Province Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            พื้นที่
          </div>
        </label>
        <select
          value={selectedProvince || 'all'}
          onChange={(e) => onProvinceChange(e.target.value === 'all' ? null : parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        >
          <option value="all">ทุกจังหวัด</option>
          {provinces.map(province => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
      </div>

      {/* Color Scheme Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          รูปแบบการแสดงสี
        </label>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => onColorSchemeChange('priceRange')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              colorScheme === 'priceRange'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
              </svg>
              ตามช่วงราคา
            </div>
          </button>
          <button
            onClick={() => onColorSchemeChange('amenityScore')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              colorScheme === 'amenityScore'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              ตามคะแนนสิ่งอำนวยความสะดวก
            </div>
          </button>
          <button
            onClick={() => onColorSchemeChange('proximityScore')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              colorScheme === 'proximityScore'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              ตามความใกล้เคียง
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ช่วงราคา (บาท/เดือน)
          </label>
          <select
            value={filters.priceRange}
            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            <option value="0-5000">น้อยกว่า 5,000 บาท</option>
            <option value="5000-10000">5,000 - 10,000 บาท</option>
            <option value="10000-20000">10,000 - 20,000 บาท</option>
            <option value="20000-30000">20,000 - 30,000 บาท</option>
            <option value="30000-999999">มากกว่า 30,000 บาท</option>
          </select>
        </div>

        {/* Property Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ประเภทที่พัก
          </label>
          <select
            value={filters.propertyType}
            onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            {propertyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Room Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ประเภทห้อง
          </label>
          <select
            value={filters.roomType}
            onChange={(e) => handleFilterChange('roomType', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            {roomTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Size Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ขนาดห้อง (ตร.ม.)
          </label>
          <select
            value={filters.sizeRange}
            onChange={(e) => handleFilterChange('sizeRange', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            <option value="0-20">น้อยกว่า 20 ตร.ม.</option>
            <option value="20-35">20-35 ตร.ม.</option>
            <option value="35-50">35-50 ตร.ม.</option>
            <option value="50-999">มากกว่า 50 ตร.ม.</option>
          </select>
        </div>

        {/* Amenity Score Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            คะแนนสิ่งอำนวยความสะดวก (%)
          </label>
          <select
            value={filters.amenities}
            onChange={(e) => handleFilterChange('amenities', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            <option value="0-25">0-25%</option>
            <option value="25-50">25-50%</option>
            <option value="50-75">50-75%</option>
            <option value="75-100">75-100%</option>
          </select>
        </div>

        {/* Proximity Score Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            คะแนนความใกล้เคียง (%)
          </label>
          <select
            value={filters.proximityScore}
            onChange={(e) => handleFilterChange('proximityScore', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            <option value="0-25">0-25%</option>
            <option value="25-50">25-50%</option>
            <option value="50-75">50-75%</option>
            <option value="75-100">75-100%</option>
          </select>
        </div>

        {/* Required Amenities Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สิ่งอำนวยความสะดวกที่จำเป็น
          </label>
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
                    handleFilterChange('requiredAmenities', newAmenities);
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{amenity.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filter Actions */}
        <div className="pt-2 flex gap-2">
          <button
            onClick={() => onFiltersChange({
              priceRange: 'all',
              propertyType: 'all',
              roomType: 'all',
              sizeRange: 'all',
              amenities: 'all',
              proximityScore: 'all',
              requiredAmenities: []
            })}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              รีเซ็ต
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApartmentFilters;
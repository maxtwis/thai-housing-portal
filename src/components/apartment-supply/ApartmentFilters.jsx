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
  proximityScores = {},
  isMobile
}) => {

  const handleFilterChange = (filterType, value) => {
    onFiltersChange({
      ...filters,
      [filterType]: value
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange !== 'all') count++;
    if (filters.propertyType !== 'all') count++;
    if (filters.roomType !== 'all') count++;
    if (filters.sizeRange !== 'all') count++;
    if (filters.amenityScore !== 'all') count++;
    if (filters.proximityScore !== 'all') count++;
    if (filters.requiredAmenities && filters.requiredAmenities.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-orange-500 rounded"></div>
          <h2 className="text-lg font-semibold text-gray-800">ตัวกรอง</h2>
          {activeFiltersCount > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4">
        {/* Province Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            จังหวัด
          </label>
          <select
            value={selectedProvince || 'all'}
            onChange={(e) => onProvinceChange(e.target.value === 'all' ? null : parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">ทุกจังหวัด</option>
            {provinces.map(province => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        {/* Color Scheme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            การแสดงสีบนแผนที่
          </label>
          <select
            value={colorScheme}
            onChange={(e) => onColorSchemeChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="priceRange">ตามช่วงราคา</option>
            <option value="amenityScore">ตามคะแนนสิ่งอำนวยความสะดวก</option>
            <option value="proximityScore">ตามคะแนนความใกล้เคียง</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ช่วงราคา (บาท/เดือน)
          </label>
          <select
            value={filters.priceRange}
            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            <option value="0-5000">น้อยกว่า 5,000</option>
            <option value="5000-10000">5,000-10,000</option>
            <option value="10000-20000">10,000-20,000</option>
            <option value="20000-30000">20,000-30,000</option>
            <option value="30000-999999">มากกว่า 30,000</option>
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
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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

        {/* Amenity Score Filter - Moved from map tooltip */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <span>คะแนนสิ่งอำนวยความสะดวก (%)</span>
              <div className="group relative">
                <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  คะแนนจากสิ่งอำนวยความสะดวกที่มีให้
                </div>
              </div>
            </div>
          </label>
          <select
            value={filters.amenityScore}
            onChange={(e) => handleFilterChange('amenityScore', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            <option value="0-25">0-25% (น้อย)</option>
            <option value="25-50">25-50% (ปานกลาง)</option>
            <option value="50-75">50-75% (ดี)</option>
            <option value="75-100">75-100% (ดีเยี่ยม)</option>
          </select>
        </div>

        {/* Proximity Score Filter - Moved from map tooltip */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <span>คะแนนความใกล้เคียง (%)</span>
              <div className="group relative">
                <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  คะแนนจากสถานที่สำคัญใกล้เคียง
                </div>
              </div>
            </div>
          </label>
          <select
            value={filters.proximityScore}
            onChange={(e) => handleFilterChange('proximityScore', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            <option value="0-25">0-25% (ไกล)</option>
            <option value="25-50">25-50% (ปานกลาง)</option>
            <option value="50-75">50-75% (ใกล้)</option>
            <option value="75-100">75-100% (ใกล้มาก)</option>
          </select>
          
          {/* Show proximity score status */}
          {Object.keys(proximityScores).length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              คำนวณแล้ว {Object.keys(proximityScores).length} รายการ
            </div>
          )}
        </div>

        {/* Required Amenities Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สิ่งอำนวยความสะดวกที่จำเป็น
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {[
              { key: 'air', label: 'เครื่องปรับอากาศ', icon: '❄️' },
              { key: 'furniture', label: 'เฟอร์นิเจอร์', icon: '🛋️' },
              { key: 'internet', label: 'อินเทอร์เน็ต', icon: '📶' },
              { key: 'parking', label: 'ที่จอดรถ', icon: '🚗' },
              { key: 'lift', label: 'ลิฟต์', icon: '🛗' },
              { key: 'pool', label: 'สระว่ายน้ำ', icon: '🏊‍♂️' },
              { key: 'fitness', label: 'ฟิตเนส', icon: '💪' },
              { key: 'security', label: 'รักษาความปลอดภัย', icon: '🔒' }
            ].map(amenity => (
              <label key={amenity.key} className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  checked={filters.requiredAmenities.includes(amenity.key)}
                  onChange={(e) => {
                    const newAmenities = e.target.checked 
                      ? [...filters.requiredAmenities, amenity.key]
                      : filters.requiredAmenities.filter(a => a !== amenity.key);
                    handleFilterChange('requiredAmenities', newAmenities);
                  }}
                />
                <span className="ml-2 text-lg">{amenity.icon}</span>
                <span className="ml-2 text-sm text-gray-700">{amenity.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filter Actions */}
        <div className="pt-4 flex gap-2 border-t border-gray-200">
          <button
            onClick={() => onFiltersChange({
              priceRange: 'all',
              propertyType: 'all',
              roomType: 'all',
              sizeRange: 'all',
              amenityScore: 'all',
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
          
          {isMobile && (
            <button
              onClick={() => {
                // Close mobile filters after applying
                if (window.toggleMobileFilters) {
                  window.toggleMobileFilters();
                }
              }}
              className="flex-1 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ใช้ตัวกรอง
              </div>
            </button>
          )}
        </div>

        {/* Filter Summary */}
        {activeFiltersCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-sm text-orange-800">
              <div className="font-medium mb-1">ตัวกรองที่ใช้งาน:</div>
              <div className="space-y-1 text-xs">
                {filters.priceRange !== 'all' && (
                  <div>• ราคา: {filters.priceRange} บาท</div>
                )}
                {filters.propertyType !== 'all' && (
                  <div>• ประเภท: {filters.propertyType}</div>
                )}
                {filters.roomType !== 'all' && (
                  <div>• ห้อง: {filters.roomType}</div>
                )}
                {filters.sizeRange !== 'all' && (
                  <div>• ขนาด: {filters.sizeRange} ตร.ม.</div>
                )}
                {filters.amenityScore !== 'all' && (
                  <div>• คะแนนสิ่งอำนวยความสะดวก: {filters.amenityScore}%</div>
                )}
                {filters.proximityScore !== 'all' && (
                  <div>• คะแนนความใกล้เคียง: {filters.proximityScore}%</div>
                )}
                {filters.requiredAmenities.length > 0 && (
                  <div>• สิ่งอำนวยความสะดวกจำเป็น: {filters.requiredAmenities.length} รายการ</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentFilters;
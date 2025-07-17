import React from 'react';

const ApartmentStatistics = ({ 
  stats, 
  selectedApartment, 
  onClearSelection, 
  provinceName, 
  filteredData,
  isMobile 
}) => {
  const formatNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) return '0';
    return new Intl.NumberFormat('th-TH').format(price);
  };

  // Calculate total from stats object
  const totalFromStats = stats ? (stats.totalProperties || 0) : 0;

  return (
    <div className={`${isMobile ? 'p-4' : 'p-5'} space-y-6`}>
      {/* SELECTED APARTMENT DETAILS - ABOVE OVERALL STATS */}
      {selectedApartment && (
        <div>
          {/* Selected Apartment Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-1 8v-4m0 0h-1m1 0h-4m3 4v-2m0 0h-1" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-800">อพาร์ตเมนต์ที่เลือก</h2>
            </div>
            <button
              onClick={onClearSelection}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="ยกเลิกการเลือก"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Apartment Name */}
          <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200 mb-4">
            <div className="text-lg font-bold text-blue-800">{selectedApartment.name || 'ไม่ระบุชื่อ'}</div>
            <div className="text-sm text-blue-600 mt-1">{selectedApartment.property_type || 'ไม่ระบุประเภท'}</div>
          </div>

          {/* Selected Apartment Overview Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                ฿{formatPrice(selectedApartment.monthly_min_price || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">ราคาเริ่มต้น</div>
              <div className="text-xs text-gray-500">/เดือน</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(selectedApartment.room_size_min || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">ขนาดห้อง</div>
              <div className="text-xs text-gray-500">ตร.ม.</div>
            </div>
          </div>

          {/* Removed room_type and rooms_available cards as requested */}

          {/* Amenities Section - Matching tooltip style */}
          {(() => {
            const amenities = [
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
            ];

            const availableAmenities = amenities.filter(amenity => 
              selectedApartment[amenity.key] === true || 
              selectedApartment[amenity.key] === 'TRUE' ||
              selectedApartment[amenity.key] === 1
            );

            return availableAmenities.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-green-500 rounded"></div>
                  สิ่งอำนวยความสะดวก
                </h3>
                {/* Grid layout matching tooltip style */}
                <div className="grid grid-cols-3 gap-2">
                  {availableAmenities.slice(0, 6).map(amenity => (
                    <div key={amenity.key} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <div className="flex flex-col items-center text-center">
                        <div className="text-lg mb-1">{amenity.icon}</div>
                        <div className="text-xs text-gray-700 font-medium leading-tight">{amenity.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Show additional amenities if more than 6 */}
                {availableAmenities.length > 6 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {availableAmenities.slice(6).map(amenity => (
                      <div key={amenity.key} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <div className="flex flex-col items-center text-center">
                          <div className="text-lg mb-1">{amenity.icon}</div>
                          <div className="text-xs text-gray-700 font-medium leading-tight">{amenity.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200 mb-4">
                <div className="text-sm text-gray-500">ไม่มีข้อมูลสิ่งอำนวยความสะดวก</div>
              </div>
            );
          })()}

          {/* Separator */}
          <div className="border-t border-gray-200 my-4"></div>
        </div>
      )}

      {/* NO OVERALL STATISTICS - Removed as requested */}
      {!selectedApartment && (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-1 8v-4m0 0h-1m1 0h-4m3 4v-2m0 0h-1" />
          </svg>
          <p className="text-gray-500 text-sm">คลิกที่อพาร์ตเมนต์บนแผนที่</p>
          <p className="text-gray-400 text-xs mt-1">เพื่อดูรายละเอียด</p>
        </div>
      )}
    </div>
  );
};

export default ApartmentStatistics;
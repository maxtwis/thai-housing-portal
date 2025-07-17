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

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
              <div className="text-xl font-bold text-orange-600">
                {selectedApartment.room_type || 'ไม่ระบุ'}
              </div>
              <div className="text-sm text-gray-600 mt-1">ประเภทห้อง</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-200">
              <div className="text-xl font-bold text-indigo-600">
                {formatNumber(selectedApartment.rooms_available || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">ห้องว่าง</div>
            </div>
          </div>

          {/* Amenities Section */}
          {(() => {
            const amenities = [
              { key: 'has_air', label: 'เครื่องปรับอากาศ', icon: '❄️' },
              { key: 'has_furniture', label: 'เฟอร์นิเจอร์', icon: '🪑' },
              { key: 'has_internet', label: 'อินเทอร์เน็ต', icon: '📶' },
              { key: 'has_parking', label: 'ที่จอดรถ', icon: '🚗' },
              { key: 'has_lift', label: 'ลิฟต์', icon: '🛗' },
              { key: 'has_pool', label: 'สระว่ายน้ำ', icon: '🏊' },
              { key: 'has_fitness', label: 'ฟิตเนส', icon: '💪' },
              { key: 'has_security', label: 'รักษาความปลอดภัย', icon: '🛡️' }
            ];

            const availableAmenities = amenities.filter(amenity => 
              selectedApartment[amenity.key] === true || selectedApartment[amenity.key] === 'TRUE'
            );

            return availableAmenities.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-green-500 rounded"></div>
                  สิ่งอำนวยความสะดวก
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableAmenities.map(amenity => (
                    <div key={amenity.key} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{amenity.icon}</span>
                        <span className="text-xs text-gray-700">{amenity.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
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

      {/* OVERALL STATISTICS - BELOW SELECTED APARTMENT */}
      <div>
        {/* Overall Stats Header */}
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800">สถิติรวม</h2>
          <span className="text-sm text-gray-500">({provinceName})</span>
        </div>

        {/* Main Overview Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(totalFromStats)}
            </div>
            <div className="text-sm text-gray-600 mt-1">อพาร์ตเมนต์ทั้งหมด</div>
            <div className="text-xs text-gray-500">หน่วย</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(stats?.availableProperties || 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">ห้องว่าง</div>
            <div className="text-xs text-gray-500">หน่วย</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(stats?.availabilityRate || 0)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">อัตราว่าง</div>
            <div className="text-xs text-gray-500">เปอร์เซ็นต์</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">
              ฿{formatPrice(stats?.averagePrice || 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">ราคาเฉลี่ย</div>
            <div className="text-xs text-gray-500">/เดือน</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-200">
            <div className="text-xl font-bold text-indigo-600">
              {formatNumber(stats?.averageSize || 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">ขนาดเฉลี่ย</div>
            <div className="text-xs text-gray-500">ตร.ม.</div>
          </div>
          <div className="bg-pink-50 rounded-lg p-3 text-center border border-pink-200">
            <div className="text-xl font-bold text-pink-600">
              {formatNumber(stats?.averageAmenityScore || 0)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">คะแนนสิ่งอำนวยฯ</div>
            <div className="text-xs text-gray-500">เฉลี่ย</div>
          </div>
        </div>

        {/* Property Types Distribution */}
        {stats?.propertyTypes && Object.keys(stats.propertyTypes).length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded"></div>
              ประเภทที่พักทั้งหมด
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.propertyTypes)
                .sort(([,a], [,b]) => b - a) // Sort by count descending
                .map(([type, count]) => {
                  const percentage = totalFromStats > 0 ? 
                    ((count / totalFromStats) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm text-gray-700">{type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{formatNumber(count)}</span>
                        <span className="text-xs text-gray-500 w-12 text-right">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Price Ranges Distribution */}
        {stats?.priceRanges && Object.values(stats.priceRanges).some(val => val > 0) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-green-500 rounded"></div>
              การกระจายของราคา
            </h3>
            <div className="space-y-2">
              {Object.entries({
                'under5k': 'น้อยกว่า 5,000 บาท',
                '5k-10k': '5,000 - 10,000 บาท',
                '10k-20k': '10,000 - 20,000 บาท',
                '20k-30k': '20,000 - 30,000 บาท',
                'over30k': 'มากกว่า 30,000 บาท'
              }).map(([key, label]) => {
                const count = stats.priceRanges[key] || 0;
                const percentage = totalFromStats > 0 ? 
                  ((count / totalFromStats) * 100).toFixed(1) : 0;
                
                return count > 0 ? (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{formatNumber(count)}</span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentStatistics;
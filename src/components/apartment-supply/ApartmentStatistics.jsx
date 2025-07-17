import React from 'react';

const ApartmentStatistics = ({ 
  selectedApartment, 
  stats, 
  proximityScores = {},
  calculateAmenityScore,
  filteredData = [],
  isMobile 
}) => {

  // Get score color helper
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };

  // Format price helper
  const formatPrice = (price) => {
    if (!price) return 'ไม่ระบุ';
    return `฿${price.toLocaleString()}`;
  };

  // Format size helper
  const formatSize = (minSize, maxSize) => {
    if (minSize && maxSize && minSize !== maxSize) {
      return `${minSize}-${maxSize} ตร.ม.`;
    } else if (maxSize || minSize) {
      return `${maxSize || minSize} ตร.ม.`;
    }
    return 'ไม่ระบุ';
  };

  // Get available amenities for display
  const getAvailableAmenities = (property) => {
    const amenityConfig = [
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

    return amenityConfig.filter(amenity => 
      property[amenity.key] === 'TRUE' || property[amenity.key] === true
    );
  };

  if (selectedApartment) {
    const amenityScore = calculateAmenityScore ? calculateAmenityScore(selectedApartment) : 0;
    const proximityScore = proximityScores[selectedApartment.id] || 0;
    const availableAmenities = getAvailableAmenities(selectedApartment);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-500 rounded"></div>
            <h2 className="text-lg font-semibold text-gray-800">รายละเอียด</h2>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-4">
          {/* Apartment Name */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              {selectedApartment.apartment_name || 'ไม่ระบุชื่อ'}
            </h3>
            <p className="text-sm text-blue-700">
              {selectedApartment.address || 'ไม่ระบุที่อยู่'}
            </p>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">ราคา/เดือน</div>
              <div className="font-semibold text-gray-900">
                {selectedApartment.monthly_min_price && selectedApartment.monthly_max_price && 
                 selectedApartment.monthly_min_price !== selectedApartment.monthly_max_price 
                  ? `${formatPrice(selectedApartment.monthly_min_price)} - ${formatPrice(selectedApartment.monthly_max_price)}`
                  : formatPrice(selectedApartment.monthly_min_price)
                }
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">ขนาดห้อง</div>
              <div className="font-semibold text-gray-900">
                {formatSize(selectedApartment.room_size_min, selectedApartment.room_size_max)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">ประเภทที่พัก</div>
              <div className="font-semibold text-gray-900">
                {selectedApartment.property_type || 'ไม่ระบุ'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">ประเภทห้อง</div>
              <div className="font-semibold text-gray-900">
                {selectedApartment.room_type || 'ไม่ระบุ'}
              </div>
            </div>
          </div>

          {/* Score Cards - Moved from map tooltip */}
          <div className="space-y-3">
            {/* Amenity Score */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">คะแนนสิ่งอำนวยความสะดวก</h4>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(amenityScore)}`}>
                  {amenityScore}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    amenityScore >= 80 ? 'bg-green-500' :
                    amenityScore >= 60 ? 'bg-yellow-500' :
                    amenityScore >= 40 ? 'bg-orange-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${amenityScore}%` }}
                ></div>
              </div>
            </div>

            {/* Proximity Score */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">คะแนนสถานบริการโดยรอบ</h4>
                {proximityScore > 0 ? (
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(proximityScore)}`}>
                    {proximityScore}%
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    ยังไม่คำนวณ
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    proximityScore >= 80 ? 'bg-green-500' :
                    proximityScore >= 60 ? 'bg-yellow-500' :
                    proximityScore >= 40 ? 'bg-orange-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${proximityScore}%` }}
                ></div>
              </div>
              {proximityScore === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  คลิกที่อพาร์ตเมนต์บนแผนที่เพื่อคำนวณ
                </p>
              )}
            </div>
          </div>

          {/* Available Amenities */}
          {availableAmenities.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-green-500 rounded"></div>
                สิ่งอำนวยความสะดวก ({availableAmenities.length} รายการ)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {availableAmenities.map(amenity => (
                  <div key={amenity.key} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                    <div className="flex flex-col items-center text-center">
                      <div className="text-lg mb-1">{amenity.icon}</div>
                      <div className="text-xs text-gray-700 font-medium leading-tight">{amenity.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">สถานะห้องว่าง</span>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                selectedApartment.rooms_available && selectedApartment.rooms_available > 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {selectedApartment.rooms_available && selectedApartment.rooms_available > 0
                  ? `มีห้องว่าง ${selectedApartment.rooms_available} ห้อง`
                  : 'เต็ม'
                }
              </span>
            </div>
          </div>

          {/* Contact Information */}
          {(selectedApartment.contact_phone || selectedApartment.contact_email) && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">ติดต่อ</h4>
              <div className="space-y-2">
                {selectedApartment.contact_phone && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-gray-600">{selectedApartment.contact_phone}</span>
                  </div>
                )}
                {selectedApartment.contact_email && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{selectedApartment.contact_email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show overall statistics when no apartment is selected
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-purple-500 rounded"></div>
          <h2 className="text-lg font-semibold text-gray-800">สถิติภาพรวม</h2>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4">
        {/* Key Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-sm text-blue-600 mb-1">ทั้งหมด</div>
            <div className="text-xl font-bold text-blue-900">
              {stats.totalProperties?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-blue-600">รายการ</div>
          </div>

          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-sm text-green-600 mb-1">มีห้องว่าง</div>
            <div className="text-xl font-bold text-green-900">
              {stats.availableProperties?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-green-600">
              {stats.availabilityRate || 0}% ของทั้งหมด
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <div className="text-sm text-orange-600 mb-1">ราคาเฉลี่ย</div>
            <div className="text-lg font-bold text-orange-900">
              ฿{stats.averagePrice?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-orange-600">ต่อเดือน</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-sm text-purple-600 mb-1">ขนาดเฉลี่ย</div>
            <div className="text-lg font-bold text-purple-900">
              {stats.averageSize || 0}
            </div>
            <div className="text-xs text-purple-600">ตร.ม.</div>
          </div>
        </div>

        {/* Score Averages */}
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">คะแนนสิ่งอำนวยความสะดวกเฉลี่ย</h4>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(stats.averageAmenityScore || 0)}`}>
                {stats.averageAmenityScore || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  (stats.averageAmenityScore || 0) >= 80 ? 'bg-green-500' :
                  (stats.averageAmenityScore || 0) >= 60 ? 'bg-yellow-500' :
                  (stats.averageAmenityScore || 0) >= 40 ? 'bg-orange-500' : 'bg-gray-400'
                }`}
                style={{ width: `${stats.averageAmenityScore || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">คะแนนความใกล้เคียงเฉลี่ย</h4>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(stats.averageProximityScore || 0)}`}>
                {stats.averageProximityScore || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  (stats.averageProximityScore || 0) >= 80 ? 'bg-green-500' :
                  (stats.averageProximityScore || 0) >= 60 ? 'bg-yellow-500' :
                  (stats.averageProximityScore || 0) >= 40 ? 'bg-orange-500' : 'bg-gray-400'
                }`}
                style={{ width: `${stats.averageProximityScore || 0}%` }}
              ></div>
            </div>
            {Object.keys(proximityScores).length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                คำนวณจาก {Object.keys(proximityScores).length} รายการ
              </p>
            )}
          </div>
        </div>

        {/* Popular Amenities */}
        {stats.popularAmenities && Object.keys(stats.popularAmenities).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">สิ่งอำนวยความสะดวกยอดนิยม</h4>
            <div className="space-y-2">
              {Object.entries(stats.popularAmenities)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([amenity, count]) => (
                  <div key={amenity} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{amenity}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${(count / stats.totalProperties) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {Math.round((count / stats.totalProperties) * 100)}%
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Property Type Distribution */}
        {stats.propertyTypes && Object.keys(stats.propertyTypes).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">การกระจายตามประเภทที่พัก</h4>
            <div className="space-y-2">
              {Object.entries(stats.propertyTypes)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${(count / stats.totalProperties) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {count} ({Math.round((count / stats.totalProperties) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center py-6">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-1 8v-4m0 0h-1m1 0h-4m3 4v-2m0 0h-1" />
          </svg>
          <p className="text-gray-500 text-sm mb-1">คลิกที่อพาร์ตเมนต์บนแผนที่</p>
          <p className="text-gray-400 text-xs">เพื่อดูรายละเอียดและคะแนนต่างๆ</p>
        </div>
      </div>
    </div>
  );
};

export default ApartmentStatistics;
import React from 'react';

const ApartmentStatistics = ({ stats, selectedApartment, onClearSelection }) => {
  // If an apartment is selected, show statistics for that apartment only
  if (selectedApartment) {
    const calculateFacilityScore = (apartment) => {
      const facilityKeys = Object.keys(apartment).filter(key => key.startsWith('facility_'));
      const totalFacilities = facilityKeys.length;
      const availableFacilities = facilityKeys.filter(key => apartment[key] > 0).length;
      return totalFacilities > 0 ? (availableFacilities / totalFacilities) * 100 : 0;
    };

    const facilityScore = calculateFacilityScore(selectedApartment);

    // Group facilities by category
    const facilityCategories = {
      security: ['facility_security', 'facility_cctv', 'facility_keycard'],
      comfort: ['facility_aircondition', 'facility_wifi', 'facility_tv', 'facility_furniture'],
      services: ['facility_laundry_shop', 'facility_shop', 'facility_restaurant'],
      recreation: ['facility_pool', 'facility_gym'],
      transport: ['facility_parking', 'facility_moto_parking', 'facility_shuttle'],
      utilities: ['facility_waterheater', 'facility_fan', 'facility_telephone', 'facility_LAN']
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">รายละเอียดอพาร์ตเมนต์</h2>
          <button 
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            ดูภาพรวมทั้งหมด
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Selected Apartment Overview */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">ข้อมูลพื้นฐาน</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="font-medium text-lg text-gray-800 mb-2">
                {selectedApartment.apartment_name || 'Unnamed Apartment'}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">ประเภท:</span>
                  <span className="block font-medium">{selectedApartment.room_type || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">ขนาด:</span>
                  <span className="block font-medium">
                    {selectedApartment.size_min || 'N/A'} - {selectedApartment.size_max || 'N/A'} ตร.ม.
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">ราคาต่ำสุด:</span>
                  <span className="block font-medium text-green-600">
                    ฿{selectedApartment.price_min?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">ราคาสูงสุด:</span>
                  <span className="block font-medium text-red-600">
                    ฿{selectedApartment.price_max?.toLocaleString() || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">ที่อยู่</h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
              {selectedApartment.address || 'ไม่มีข้อมูลที่อยู่'}
            </p>
          </div>

          {/* Facility Score */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">คะแนนสิ่งอำนวยความสะดวก</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">คะแนนรวม:</span>
                <span className="text-lg font-bold text-blue-600">{facilityScore.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${facilityScore}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {facilityScore >= 80 ? 'ดีเยี่ยม' : 
                 facilityScore >= 60 ? 'ดี' : 
                 facilityScore >= 40 ? 'ปานกลาง' : 'พื้นฐาน'}
              </p>
            </div>
          </div>

          {/* Facilities by Category */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">สิ่งอำนวยความสะดวกตามหมวดหมู่</h3>
            <div className="space-y-3">
              {Object.entries(facilityCategories).map(([categoryName, facilities]) => {
                const availableFacilities = facilities.filter(f => selectedApartment[f] > 0);
                const categoryScore = facilities.length > 0 ? (availableFacilities.length / facilities.length) * 100 : 0;
                
                const categoryLabels = {
                  security: 'ความปลอดภัย',
                  comfort: 'ความสะดวกสบาย',
                  services: 'บริการ',
                  recreation: 'นันทนาการ',
                  transport: 'การเดินทาง',
                  utilities: 'สาธารณูปโภค'
                };

                return (
                  <div key={categoryName} className="bg-gray-50 p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {categoryLabels[categoryName]}
                      </span>
                      <span className="text-xs text-gray-600">
                        {availableFacilities.length}/{facilities.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-green-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${categoryScore}%` }}
                      ></div>
                    </div>
                    {availableFacilities.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {availableFacilities.map(facility => {
                          const facilityNames = {
                            facility_security: 'รปภ.',
                            facility_cctv: 'CCTV',
                            facility_keycard: 'Key Card',
                            facility_aircondition: 'แอร์',
                            facility_wifi: 'WiFi',
                            facility_tv: 'TV',
                            facility_furniture: 'เฟอร์',
                            facility_laundry_shop: 'ซักรีด',
                            facility_shop: 'ร้านค้า',
                            facility_restaurant: 'ร้านอาหาร',
                            facility_pool: 'สระ',
                            facility_gym: 'ฟิตเนส',
                            facility_parking: 'จอดรถ',
                            facility_moto_parking: 'จอดมอไซ',
                            facility_shuttle: 'รถรับส่ง',
                            facility_waterheater: 'เครื่องทำน้ำอุ่น',
                            facility_fan: 'พัดลม',
                            facility_telephone: 'โทรศัพท์',
                            facility_LAN: 'LAN'
                          };
                          
                          return (
                            <span 
                              key={facility}
                              className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded"
                            >
                              {facilityNames[facility] || facility.replace('facility_', '')}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show overall statistics when no apartment is selected
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">สถิติ</h2>
      <div className="space-y-4">
        {/* Overall Statistics */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">ภาพรวมอพาร์ตเมนต์</h3>
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-sm text-gray-500">จำนวนอพาร์ตเมนต์ทั้งหมด:</span>
              <span className="block text-lg font-medium">
                {stats.totalApartments.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">ราคาเฉลี่ย:</span>
              <span className="block text-lg font-medium">
                ฿{stats.averagePrice.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">ขนาดเฉลี่ย:</span>
              <span className="block text-lg font-medium">
                {stats.averageSize.toFixed(1)} ตร.ม.
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">คะแนนสิ่งอำนวยความสะดวกเฉลี่ย:</span>
              <span className="block text-lg font-medium">
                {stats.averageFacilityScore.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Room Types Distribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">ประเภทห้อง</h3>
          <div className="mt-2 space-y-2">
            {Object.entries(stats.roomTypes)
              .sort(([,a], [,b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">{type === '' ? 'ไม่มีข้อมูล' : type}:</span>
                  <div className="text-right">
                    <span className="text-base font-medium">
                      {count.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({((count / stats.totalApartments) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Price Ranges */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">การกระจายตามช่วงราคา</h3>
          <div className="mt-2 space-y-3">
            {Object.entries(stats.priceRanges)
              .sort(([a], [b]) => {
                const aMin = parseInt(a.split('-')[0]);
                const bMin = parseInt(b.split('-')[0]);
                return aMin - bMin;
              })
              .map(([range, count]) => (
                <div key={range}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-500">{range} บาท:</span>
                    <span className="text-sm font-medium">
                      {((count / stats.totalApartments) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                    <div 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                      style={{ width: `${(count / stats.totalApartments) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {count.toLocaleString()} อพาร์ตเมนต์
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Popular Facilities */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">สิ่งอำนวยความสะดวกยอดนิยม</h3>
          <div className="mt-2 space-y-2">
            {Object.entries(stats.popularFacilities)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([facility, percentage]) => {
                const facilityNames = {
                  facility_parking: 'ที่จอดรถ',
                  facility_wifi: 'WiFi',
                  facility_aircondition: 'เครื่องปรับอากาศ',
                  facility_security: 'รักษาความปลอดภัย',
                  facility_elevator: 'ลิฟต์',
                  facility_cctv: 'กล้องวงจรปิด',
                  facility_pool: 'สระว่ายน้ำ',
                  facility_gym: 'ฟิตเนส',
                  facility_furniture: 'เฟอร์นิเจอร์',
                  facility_tv: 'โทรทัศน์'
                };
                
                return (
                  <div key={facility} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {facilityNames[facility] || facility.replace('facility_', '')}:
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            * ข้อมูลจากฐานข้อมูลตัวอย่างอพาร์ตเมนต์
            <br />
            * คะแนนสิ่งอำนวยความสะดวกคำนวณจากสัดส่วนสิ่งอำนวยความสะดวกที่มี
            <br />
            * คลิกที่จุดบนแผนที่เพื่อดูรายละเอียดแต่ละอพาร์ตเมนต์
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApartmentStatistics;
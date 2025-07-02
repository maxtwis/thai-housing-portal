import React from 'react';

const ApartmentFilters = ({ filters, setFilters, colorScheme, setColorScheme }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">ตัวกรองข้อมูล</h2>
      
      <div className="space-y-4">
        {/* Color Scheme Selector */}
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
            <option value="Studio">Studio</option>
            <option value="1BR">1 ห้องนอน</option>
            <option value="2BR">2 ห้องนอน</option>
            <option value="3BR">3 ห้องนอน</option>
            <option value="4BR+">4+ ห้องนอน</option>
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
            <option value="0-30">น้อยกว่า 30 ตร.ม.</option>
            <option value="30-50">30-50 ตร.ม.</option>
            <option value="50-80">50-80 ตร.ม.</option>
            <option value="80-120">80-120 ตร.ม.</option>
            <option value="120-999">มากกว่า 120 ตร.ม.</option>
          </select>
        </div>

        {/* Facility Score Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700">คะแนนสิ่งอำนวยความสะดวก</label>
          <select 
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            value={filters.facilities}
            onChange={(e) => setFilters({...filters, facilities: e.target.value})}
          >
            <option value="all">ทุกระดับ</option>
            <option value="80-100">ดีเยี่ยม (80-100%)</option>
            <option value="60-79">ดี (60-79%)</option>
            <option value="40-59">ปานกลาง (40-59%)</option>
            <option value="0-39">พื้นฐาน (0-39%)</option>
          </select>
        </div>

        {/* Key Facilities Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">สิ่งอำนวยความสะดวกที่ต้องการ</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={filters.requiredFacilities?.includes('parking') || false}
                onChange={(e) => {
                  const required = filters.requiredFacilities || [];
                  if (e.target.checked) {
                    setFilters({
                      ...filters, 
                      requiredFacilities: [...required, 'parking']
                    });
                  } else {
                    setFilters({
                      ...filters, 
                      requiredFacilities: required.filter(f => f !== 'parking')
                    });
                  }
                }}
              />
              <span className="ml-2 text-sm text-gray-700">ที่จอดรถ</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={filters.requiredFacilities?.includes('wifi') || false}
                onChange={(e) => {
                  const required = filters.requiredFacilities || [];
                  if (e.target.checked) {
                    setFilters({
                      ...filters, 
                      requiredFacilities: [...required, 'wifi']
                    });
                  } else {
                    setFilters({
                      ...filters, 
                      requiredFacilities: required.filter(f => f !== 'wifi')
                    });
                  }
                }}
              />
              <span className="ml-2 text-sm text-gray-700">WiFi</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={filters.requiredFacilities?.includes('pool') || false}
                onChange={(e) => {
                  const required = filters.requiredFacilities || [];
                  if (e.target.checked) {
                    setFilters({
                      ...filters, 
                      requiredFacilities: [...required, 'pool']
                    });
                  } else {
                    setFilters({
                      ...filters, 
                      requiredFacilities: required.filter(f => f !== 'pool')
                    });
                  }
                }}
              />
              <span className="ml-2 text-sm text-gray-700">สระว่ายน้ำ</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={filters.requiredFacilities?.includes('gym') || false}
                onChange={(e) => {
                  const required = filters.requiredFacilities || [];
                  if (e.target.checked) {
                    setFilters({
                      ...filters, 
                      requiredFacilities: [...required, 'gym']
                    });
                  } else {
                    setFilters({
                      ...filters, 
                      requiredFacilities: required.filter(f => f !== 'gym')
                    });
                  }
                }}
              />
              <span className="ml-2 text-sm text-gray-700">ฟิตเนส</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={filters.requiredFacilities?.includes('security') || false}
                onChange={(e) => {
                  const required = filters.requiredFacilities || [];
                  if (e.target.checked) {
                    setFilters({
                      ...filters, 
                      requiredFacilities: [...required, 'security']
                    });
                  } else {
                    setFilters({
                      ...filters, 
                      requiredFacilities: required.filter(f => f !== 'security')
                    });
                  }
                }}
              />
              <span className="ml-2 text-sm text-gray-700">รักษาความปลอดภัย</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={filters.requiredFacilities?.includes('elevator') || false}
                onChange={(e) => {
                  const required = filters.requiredFacilities || [];
                  if (e.target.checked) {
                    setFilters({
                      ...filters, 
                      requiredFacilities: [...required, 'elevator']
                    });
                  } else {
                    setFilters({
                      ...filters, 
                      requiredFacilities: required.filter(f => f !== 'elevator')
                    });
                  }
                }}
              />
              <span className="ml-2 text-sm text-gray-700">ลิฟต์</span>
            </label>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setFilters({
                priceRange: 'all',
                roomType: 'all',
                sizeRange: 'all',
                facilities: 'all',
                requiredFacilities: []
              });
              setColorScheme('priceRange');
            }}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>

        {/* Info Note */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <p>หมายเหตุ: ข้อมูลอพาร์ตเมนต์จากฐานข้อมูลตัวอย่าง การแสดงผล "What's Nearby" ใช้ข้อมูลจาก OpenStreetMap ผ่าน Overpass API</p>
        </div>
      </div>
    </div>
  );
};

export default ApartmentFilters;
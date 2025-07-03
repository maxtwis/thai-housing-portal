import React from 'react';

const HDSFilters = ({ filters, setFilters, colorScheme, setColorScheme }) => {
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
            <option value="housingSystem">ระบบที่อยู่อาศัยหลัก</option>
            <option value="populationDensity">ความหนาแน่นประชากร</option>
            <option value="housingDensity">ความหนาแน่นที่อยู่อาศัย</option>
            <option value="gridClass">ระดับความหนาแน่น</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ระบบที่อยู่อาศัย</label>
          <select 
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            value={filters.housingSystem}
            onChange={(e) => setFilters({...filters, housingSystem: e.target.value})}
          >
            <option value="all">ทุกระบบ</option>
            <option value="1">ระบบของชุมชนแออัดบนที่ดินรัฐ/เอกชน</option>
            <option value="2">ระบบการถือครองที่ดินชั่วคราว</option>
            <option value="3">ระบบของกลุ่มประชากรแฝง</option>
            <option value="4">ระบบที่อยู่อาศัยของลูกจ้าง</option>
            <option value="5">ระบบที่อยู่อาศัยที่รัฐจัดสร้าง</option>
            <option value="6">ระบบที่อยู่อาศัยที่รัฐสนับสนุน</option>
            <option value="7">ระบบที่อยู่อาศัยเอกชน</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ระดับความหนาแน่น</label>
          <select 
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            value={filters.densityLevel}
            onChange={(e) => setFilters({...filters, densityLevel: e.target.value})}
          >
            <option value="all">ทั้งหมด</option>
            <option value="1">ระดับ 1 (ต่ำสุด)</option>
            <option value="2">ระดับ 2</option>
            <option value="3">ระดับ 3</option>
            <option value="4">ระดับ 4</option>
            <option value="5">ระดับ 5 (สูงสุด)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ช่วงประชากร</label>
          <select 
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            value={filters.populationRange}
            onChange={(e) => setFilters({...filters, populationRange: e.target.value})}
          >
            <option value="all">ทั้งหมด</option>
            <option value="0-500">น้อยกว่า 500 คน</option>
            <option value="500-1000">500-1,000 คน</option>
            <option value="1000-2000">1,000-2,000 คน</option>
            <option value="2000-3000">2,000-3,000 คน</option>
            <option value="3000-5000">3,000-5,000 คน</option>
            <option value="5000-999999">มากกว่า 5,000 คน</option>
          </select>
        </div>

        {/* Note about data source */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          หมายเหตุ: ข้อมูลระบบที่อยู่อาศัยจากการสำรวจพื้นที่จังหวัดขอนแก่น แบ่งตามกริดความหนาแน่น
        </div>
      </div>
    </div>
  );
};

export default HDSFilters;
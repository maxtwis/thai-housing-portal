import React from 'react';

const Filters = ({ filters, setFilters, colorScheme, setColorScheme }) => {
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
            <option value="buildingType">ประเภทอาคาร</option>
            <option value="transportAccess">การเข้าถึงระบบขนส่ง (เฉพาะที่อยู่อาศัย)</option>
            <option value="healthAccess">การเข้าถึงสถานพยาบาล (เฉพาะที่อยู่อาศัย)</option>
            <option value="householdSize">ขนาดครัวเรือน (เฉพาะที่อยู่อาศัย)</option>
            <option value="rentCost">ค่าเช่า (เฉพาะที่อยู่อาศัย)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ประเภทอาคาร</label>
          <select 
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            value={filters.buildingType}
            onChange={(e) => setFilters({...filters, buildingType: e.target.value})}
          >
            <option value="all">ทุกประเภท</option>
            <option value="ที่อยู่อาศัย">ที่อยู่อาศัย</option>
            <option value="พาณิชยกรรม">พาณิชยกรรม</option>
            <option value="ที่อยู่อาศัยกึ่งพาณิชยกรรม">ที่อยู่อาศัยกึ่งพาณิชยกรรม</option>
            <option value="อุตสาหกรรม">อุตสาหกรรม</option>
            <option value="สาธารณูปโภค สาธารณูปการ">สาธารณูปโภค สาธารณูปการ</option>
            <option value="สถาบันการศึกษา">สถาบันการศึกษา</option>
            <option value="สถาบันศาสนา">สถาบันศาสนา</option>
            <option value="สถาบันราชการและการสาธารณสุข">สถาบันราชการและการสาธารณสุข</option>
            <option value="นันทนาการ">นันทนาการ</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">จำนวนชั้น</label>
          <select 
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            value={filters.stories}
            onChange={(e) => setFilters({...filters, stories: e.target.value})}
          >
            <option value="all">ทั้งหมด</option>
            <option value="1-2">1-2 ชั้น</option>
            <option value="3-5">3-5 ชั้น</option>
            <option value="6-10">6-10 ชั้น</option>
            <option value="11-100">มากกว่า 10 ชั้น</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ช่วงค่าเช่า</label>
          <select 
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            value={filters.rentRange}
            onChange={(e) => setFilters({...filters, rentRange: e.target.value})}
          >
            <option value="all">ทั้งหมด</option>
            <option value="0-5000">฿0 - ฿5,000</option>
            <option value="5001-10000">฿5,001 - ฿10,000</option>
            <option value="10001-20000">฿10,001 - ฿20,000</option>
            <option value="20001-999999">มากกว่า ฿20,000</option>
          </select>
        </div>

        {/* Note about residential-only data */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          หมายเหตุ: ข้อมูลการเข้าถึง ขนาดครัวเรือน และค่าเช่า มีเฉพาะอาคารประเภทที่อยู่อาศัยเท่านั้น
        </div>
      </div>
    </div>
  );
};

export default Filters;
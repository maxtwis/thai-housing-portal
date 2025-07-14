import React from 'react';

const HDSFilters = ({ 
  filters, 
  onFiltersChange, 
  colorScheme, 
  onColorSchemeChange, 
  isMobile = false,
  hasSupplyData = false 
}) => {
  
  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    onFiltersChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-4`}>
        ตัวกรองข้อมูล
      </h2>
      
      <div className="space-y-4">
        {/* Color Scheme Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            แสดงสีตาม
          </label>
          <select 
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={colorScheme}
            onChange={(e) => onColorSchemeChange(e.target.value)}
          >
            <option value="housingSystem">ระบบที่อยู่อาศัยหลัก</option>
            <option value="populationDensity">ความหนาแน่นประชากร</option>
            <option value="housingDensity">ความหนาแน่นที่อยู่อาศัย</option>
            <option value="gridClass">ระดับความหนาแน่น</option>
            {hasSupplyData && (
              <>
                <option value="supplyDensity">ความหนาแน่นอุปทานที่อยู่อาศัย</option>
                <option value="averageSalePrice">ราคาขายเฉลี่ย</option>
                <option value="averageRentPrice">ราคาเช่าเฉลี่ย</option>
              </>
            )}
          </select>
        </div>

        {/* Housing System Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ระบบที่อยู่อาศัย
          </label>
          <select 
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={filters.housingSystem}
            onChange={(e) => handleFilterChange('housingSystem', e.target.value)}
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

        {/* Density Level Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ระดับความหนาแน่น
          </label>
          <select 
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={filters.densityLevel}
            onChange={(e) => handleFilterChange('densityLevel', e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            <option value="1">ระดับ 1 (ต่ำสุด)</option>
            <option value="2">ระดับ 2</option>
            <option value="3">ระดับ 3</option>
            <option value="4">ระดับ 4</option>
            <option value="5">ระดับ 5</option>
            <option value="6">ระดับ 6</option>
            <option value="7">ระดับ 7 (สูงสุด)</option>
          </select>
        </div>

        {/* Population Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ช่วงประชากร
          </label>
          <select 
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={filters.populationRange}
            onChange={(e) => handleFilterChange('populationRange', e.target.value)}
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

        {/* Filter Reset Button */}
        <div className="pt-2">
          <button
            onClick={() => onFiltersChange({
              housingSystem: 'all',
              densityLevel: 'all',
              populationRange: 'all'
            })}
            className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            รีเซ็ตตัวกรอง
          </button>
        </div>

        {/* Active Filters Display */}
        {(filters.housingSystem !== 'all' || filters.densityLevel !== 'all' || filters.populationRange !== 'all') && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-gray-600 mb-2">ตัวกรองที่ใช้งาน:</p>
            <div className="space-y-1">
              {filters.housingSystem !== 'all' && (
                <div className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded text-xs">
                  <span>ระบบที่อยู่อาศัย: C{filters.housingSystem}</span>
                  <button 
                    onClick={() => handleFilterChange('housingSystem', 'all')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              )}
              {filters.densityLevel !== 'all' && (
                <div className="flex items-center justify-between bg-green-50 px-2 py-1 rounded text-xs">
                  <span>ระดับความหนาแน่น: {filters.densityLevel}</span>
                  <button 
                    onClick={() => handleFilterChange('densityLevel', 'all')}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </div>
              )}
              {filters.populationRange !== 'all' && (
                <div className="flex items-center justify-between bg-orange-50 px-2 py-1 rounded text-xs">
                  <span>ประชากร: {filters.populationRange.replace('-', ' - ')} คน</span>
                  <button 
                    onClick={() => handleFilterChange('populationRange', 'all')}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Information Note */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">หมายเหตุ:</p>
              <p>ข้อมูลระบบที่อยู่อาศัยจากการสำรวจพื้นที่ แบ่งตามกริดความหนาแน่น การเปลี่ยนตัวกรองจะส่งผลต่อการแสดงผลบนแผนที่ทันที</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HDSFilters;
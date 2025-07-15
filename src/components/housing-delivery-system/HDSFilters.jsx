import React from 'react';

const HDSFilters = ({ 
  filters, 
  onFiltersChange, 
  colorScheme, 
  onColorSchemeChange, 
  isMobile = false 
}) => {
  
  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    onFiltersChange(newFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = filters.housingSystem !== 'all' || 
                          filters.densityLevel !== 'all' || 
                          filters.populationRange !== 'all';

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
          ตัวกรองข้อมูล
        </h2>
        {hasActiveFilters && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {[
              filters.housingSystem !== 'all' ? 1 : 0,
              filters.densityLevel !== 'all' ? 1 : 0,
              filters.populationRange !== 'all' ? 1 : 0
            ].reduce((a, b) => a + b, 0)} Active
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Color Scheme Selector */}
        <div className="bg-gray-50 rounded-lg p-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
              </svg>
              แสดงสีตาม
            </span>
          </label>
          <select 
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            value={colorScheme}
            onChange={(e) => onColorSchemeChange(e.target.value)}
          >
            <option value="housingSystem">ระบบที่อยู่อาศัยหลัก</option>
            <option value="populationDensity">ความหนาแน่นประชากร</option>
            <option value="housingDensity">ความหนาแน่นที่อยู่อาศัย</option>
            <option value="gridClass">ระดับความหนาแน่น</option>
          </select>
        </div>

        {/* Housing System Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              ระบบที่อยู่อาศัย
            </span>
          </label>
          <select 
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            value={filters.housingSystem}
            onChange={(e) => handleFilterChange('housingSystem', e.target.value)}
          >
            <option value="all">ทุกระบบ</option>
            <option value="1">ระบบ 1: ชุมชนแออัดบนที่ดินรัฐ/เอกชน</option>
            <option value="2">ระบบ 2: การถือครองที่ดินชั่วคราว</option>
            <option value="3">ระบบ 3: กลุ่มประชากรแฝง</option>
            <option value="4">ระบบ 4: ที่อยู่อาศัยของลูกจ้าง</option>
            <option value="5">ระบบ 5: ที่อยู่อาศัยที่รัฐจัดสร้าง</option>
            <option value="6">ระบบ 6: ที่อยู่อาศัยที่เอกชนจัดสร้าง</option>
            <option value="7">ระบบ 7: อื่นๆ</option>
          </select>
          {filters.housingSystem !== 'all' && (
            <button 
              onClick={() => handleFilterChange('housingSystem', 'all')}
              className="mt-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              ✕ ล้างการเลือก
            </button>
          )}
        </div>

        {/* Density Level Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              ระดับความหนาแน่น
            </span>
          </label>
          <select 
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            value={filters.densityLevel}
            onChange={(e) => handleFilterChange('densityLevel', e.target.value)}
          >
            <option value="all">ทุกระดับ</option>
            <option value="1">ระดับ 1: ต่ำที่สุด</option>
            <option value="2">ระดับ 2: ต่ำ</option>
            <option value="3">ระดับ 3: ปานกลาง</option>
            <option value="4">ระดับ 4: สูง</option>
            <option value="5">ระดับ 5: สูงมาก</option>
            <option value="6">ระดับ 6: สูงที่สุด</option>
          </select>
          {filters.densityLevel !== 'all' && (
            <button 
              onClick={() => handleFilterChange('densityLevel', 'all')}
              className="mt-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              ✕ ล้างการเลือก
            </button>
          )}
        </div>

        {/* Population Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              ช่วงประชากร
            </span>
          </label>
          <select 
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            value={filters.populationRange}
            onChange={(e) => handleFilterChange('populationRange', e.target.value)}
          >
            <option value="all">ทุกช่วง</option>
            <option value="0-100">0-100 คน</option>
            <option value="100-500">100-500 คน</option>
            <option value="500-1000">500-1,000 คน</option>
            <option value="1000-2000">1,000-2,000 คน</option>
            <option value="2000-3000">2,000-3,000 คน</option>
            <option value="3000-5000">3,000-5,000 คน</option>
            <option value="5000-999999">มากกว่า 5,000 คน</option>
          </select>
          {filters.populationRange !== 'all' && (
            <button 
              onClick={() => handleFilterChange('populationRange', 'all')}
              className="mt-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              ✕ ล้างการเลือก
            </button>
          )}
        </div>

        {/* Filter Reset Button */}
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={() => onFiltersChange({
              housingSystem: 'all',
              densityLevel: 'all',
              populationRange: 'all'
            })}
            disabled={!hasActiveFilters}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              hasActiveFilters 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              รีเซ็ตตัวกรอง
            </span>
          </button>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              ตัวกรองที่ใช้งาน
            </p>
            <div className="space-y-1">
              {filters.housingSystem !== 'all' && (
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded text-xs">
                  <span className="text-gray-700">ระบบที่อยู่อาศัย: C{filters.housingSystem}</span>
                  <button 
                    onClick={() => handleFilterChange('housingSystem', 'all')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ✕
                  </button>
                </div>
              )}
              {filters.densityLevel !== 'all' && (
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded text-xs">
                  <span className="text-gray-700">ระดับความหนาแน่น: {filters.densityLevel}</span>
                  <button 
                    onClick={() => handleFilterChange('densityLevel', 'all')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ✕
                  </button>
                </div>
              )}
              {filters.populationRange !== 'all' && (
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded text-xs">
                  <span className="text-gray-700">ช่วงประชากร: {filters.populationRange.replace('-', '-')} คน</span>
                  <button 
                    onClick={() => handleFilterChange('populationRange', 'all')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HDSFilters;
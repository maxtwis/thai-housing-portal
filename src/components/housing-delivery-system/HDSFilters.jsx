import React from 'react';

const HDSFilters = ({ filters, onFiltersChange, colorScheme, onColorSchemeChange, isMobile }) => {
  const handleFilterChange = (filterType, value) => {
    onFiltersChange({
      ...filters,
      [filterType]: value
    });
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

  return (
    <div className={`${isMobile ? 'p-4' : 'p-5'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800">ตัวกรองข้อมูล</h2>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
      </div>

      {/* Color Scheme Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          รูปแบบการแสดงสี
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onColorSchemeChange('housingSystem')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              colorScheme === 'housingSystem'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              ระบบที่อยู่อาศัย
            </div>
          </button>
          <button
            onClick={() => onColorSchemeChange('gridClass')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              colorScheme === 'gridClass'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              ความหนาแน่น
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Housing System Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ระบบที่อยู่อาศัย
          </label>
          <select
            value={filters.housingSystem}
            onChange={(e) => handleFilterChange('housingSystem', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            <option value="1">C1 - ชุมชนแออัด</option>
            <option value="2">C2 - ถือครองชั่วคราว</option>
            <option value="3">C3 - ประชากรแฝง</option>
            <option value="4">C4 - ที่อยู่อาศัยลูกจ้าง</option>
            <option value="5">C5 - ที่อยู่อาศัยรัฐ</option>
            <option value="6">C6 - รัฐสนับสนุน</option>
            <option value="7">C7 - ที่อยู่อาศัยเอกชน</option>
          </select>
        </div>

        {/* Density Level Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ระดับความหนาแน่น
          </label>
          <select
            value={filters.densityLevel}
            onChange={(e) => handleFilterChange('densityLevel', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            <option value="1">Class 1 - ต่ำมาก</option>
            <option value="2">Class 2 - ต่ำ</option>
            <option value="3">Class 3 - ปานกลาง</option>
            <option value="4">Class 4 - สูง</option>
            <option value="5">Class 5 - สูงมาก</option>
          </select>
        </div>

        {/* Population Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ช่วงประชากร
          </label>
          <select
            value={filters.populationRange}
            onChange={(e) => handleFilterChange('populationRange', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          >
            <option value="all">แสดงทั้งหมด</option>
            <option value="0-500">0-500 คน</option>
            <option value="500-1000">500-1,000 คน</option>
            <option value="1000-2000">1,000-2,000 คน</option>
            <option value="2000-3000">2,000-3,000 คน</option>
            <option value="3000-5000">3,000-5,000 คน</option>
            <option value="5000-999999">มากกว่า 5,000 คน</option>
          </select>
        </div>

        {/* Filter Actions */}
        <div className="pt-2 flex gap-2">
          <button
            onClick={() => onFiltersChange({
              housingSystem: 'all',
              densityLevel: 'all',
              populationRange: 'all'
            })}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              รีเซ็ตตัวกรอง
            </div>
          </button>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">ตัวกรองที่ใช้งาน:</p>
            <div className="space-y-2">
              {filters.housingSystem !== 'all' && (
                <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg group hover:bg-blue-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-800">ระบบที่อยู่อาศัย: C{filters.housingSystem}</span>
                  </div>
                  <button 
                    onClick={() => handleFilterChange('housingSystem', 'all')}
                    className="text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {filters.densityLevel !== 'all' && (
                <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg group hover:bg-green-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-800">ระดับความหนาแน่น: Class {filters.densityLevel}</span>
                  </div>
                  <button 
                    onClick={() => handleFilterChange('densityLevel', 'all')}
                    className="text-green-600 hover:text-green-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {filters.populationRange !== 'all' && (
                <div className="flex items-center justify-between bg-orange-50 px-3 py-2 rounded-lg group hover:bg-orange-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-orange-800">ประชากร: {filters.populationRange.replace('-', ' - ')} คน</span>
                  </div>
                  <button 
                    onClick={() => handleFilterChange('populationRange', 'all')}
                    className="text-orange-600 hover:text-orange-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
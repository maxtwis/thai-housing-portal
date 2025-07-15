import React from 'react';

const HDSStatistics = ({ 
  stats, 
  selectedGrid, 
  onClearSelection, 
  isMobile = false, 
  provinceName 
}) => {
  
  // Format numbers for display
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toLocaleString() || '0';
  };

  // Get percentage for housing systems
  const getHousingSystemPercentage = (value) => {
    const total = Object.values(stats.housingSystems || {}).reduce((sum, val) => sum + val, 0);
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  };

  // Get percentage for density levels
  const getDensityLevelPercentage = (value) => {
    const total = Object.values(stats.densityLevels || {}).reduce((sum, val) => sum + val, 0);
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
            สถิติภาพรวม
          </h2>
          {provinceName && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {provinceName}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Selected Grid Information */}
          {selectedGrid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-800">
                  Selected Grid
                </h3>
                <button
                  onClick={onClearSelection}
                  className="text-xs text-yellow-600 hover:text-yellow-800 font-medium"
                >
                  ✕ Clear
                </button>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-yellow-700">Grid ID:</span>
                  <span className="font-medium text-yellow-900">
                    {selectedGrid.FID || selectedGrid.OBJECTID_1 || selectedGrid.Grid_Code || selectedGrid.Grid_CODE || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700">Population:</span>
                  <span className="font-medium text-yellow-900">
                    {Math.round(selectedGrid.Grid_POP || 0).toLocaleString()} คน
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700">Housing Units:</span>
                  <span className="font-medium text-yellow-900">
                    {(selectedGrid.Grid_HOU || 0).toLocaleString()} หน่วย
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700">Density Level:</span>
                  <span className="font-medium text-yellow-900">
                    ระดับ {selectedGrid.Grid_Class || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Overview Statistics */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              ข้อมูลพื้นฐาน
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-900">
                    {formatNumber(stats.totalGrids || 0)}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">กริดทั้งหมด</div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-900">
                    {formatNumber(Math.round(stats.totalPopulation || 0))}
                  </div>
                  <div className="text-xs text-green-700 mt-1">ประชากรรวม</div>
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-900">
                    {formatNumber(stats.totalHousing || 0)}
                  </div>
                  <div className="text-xs text-purple-700 mt-1">ที่อยู่อาศัยรวม</div>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-900">
                    {formatNumber(Math.round(stats.averageDensity || 0))}
                  </div>
                  <div className="text-xs text-orange-700 mt-1">ความหนาแน่นเฉลี่ย</div>
                </div>
              </div>
            </div>
          </div>

          {/* Housing Delivery Systems */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              ระบบที่อยู่อาศัย
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.housingSystems || {})
                .filter(([, count]) => count > 0)
                .sort(([,a], [,b]) => b - a)
                .map(([system, count]) => (
                  <div key={system} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{system}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatNumber(count)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getHousingSystemPercentage(count)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {getHousingSystemPercentage(count)}%
                      </span>
                    </div>
                  </div>
                ))}
              
              {Object.keys(stats.housingSystems || {}).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  ไม่มีข้อมูลระบบที่อยู่อาศัย
                </div>
              )}
            </div>
          </div>

          {/* Density Levels */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              ระดับความหนาแน่น
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.densityLevels || {})
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([level, count]) => (
                  <div key={level} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{level}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatNumber(count)} กริด
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getDensityLevelPercentage(count)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {getDensityLevelPercentage(count)}%
                      </span>
                    </div>
                  </div>
                ))}
              
              {Object.keys(stats.densityLevels || {}).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  ไม่มีข้อมูลระดับความหนาแน่น
                </div>
              )}
            </div>
          </div>

          {/* Problem Areas */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              พื้นที่ปัญหา
            </h3>
            <div className="space-y-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">
                    ปัญหาการจัดหาที่อยู่อาศัย
                  </span>
                  <span className="text-sm font-bold text-red-900">
                    {formatNumber(stats.problemAreas?.supply || 0)}
                  </span>
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {((stats.problemAreas?.supply || 0) / (stats.totalGrids || 1) * 100).toFixed(1)}% ของพื้นที่ทั้งหมด
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-700">
                    ปัญหาการอุดหนุนที่อยู่อาศัย
                  </span>
                  <span className="text-sm font-bold text-yellow-900">
                    {formatNumber(stats.problemAreas?.subsidies || 0)}
                  </span>
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  {((stats.problemAreas?.subsidies || 0) / (stats.totalGrids || 1) * 100).toFixed(1)}% ของพื้นที่ทั้งหมด
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-700">
                    ปัญหาความมั่นคงที่อยู่อาศัย
                  </span>
                  <span className="text-sm font-bold text-orange-900">
                    {formatNumber(stats.problemAreas?.stability || 0)}
                  </span>
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  {((stats.problemAreas?.stability || 0) / (stats.totalGrids || 1) * 100).toFixed(1)}% ของพื้นที่ทั้งหมด
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              สรุปภาพรวม
            </h3>
            <div className="text-xs text-gray-600 leading-relaxed">
              <p className="mb-2">
                <strong className="text-gray-800">จังหวัด{provinceName}</strong> มีกริดทั้งหมด{' '}
                <strong className="text-blue-600">{formatNumber(stats.totalGrids || 0)}</strong> กริด 
                ประชากรรวม <strong className="text-green-600">{formatNumber(Math.round(stats.totalPopulation || 0))}</strong> คน
              </p>
              <p className="mb-2">
                ความหนาแน่นประชากรเฉลี่ย{' '}
                <strong className="text-purple-600">{formatNumber(Math.round(stats.averageDensity || 0))}</strong> คน/กริด
              </p>
              <p>
                พื้นที่ที่มีปัญหาเกี่ยวกับที่อยู่อาศัยรวม{' '}
                <strong className="text-red-600">
                  {formatNumber((stats.problemAreas?.supply || 0) + (stats.problemAreas?.subsidies || 0) + (stats.problemAreas?.stability || 0))}
                </strong> กริด
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HDSStatistics;
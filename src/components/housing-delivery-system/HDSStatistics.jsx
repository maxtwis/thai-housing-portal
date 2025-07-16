import React from 'react';

const HDSStatistics = ({ stats, selectedGrid, onClearSelection, isMobile, provinceName }) => {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const housingSystemNames = {
    HDS_C1: 'ชุมชนแออัด',
    HDS_C2: 'ถือครองชั่วคราว',
    HDS_C3: 'ประชากรแฝง',
    HDS_C4: 'ที่อยู่อาศัยลูกจ้าง',
    HDS_C5: 'ที่อยู่อาศัยรัฐ',
    HDS_C6: 'รัฐสนับสนุน',
    HDS_C7: 'ที่อยู่อาศัยเอกชน'
  };

  const densityLevelNames = {
    1: 'ความหนาแน่นต่ำมาก',
    2: 'ความหนาแน่นต่ำ',
    3: 'ความหนาแน่นปานกลาง',
    4: 'ความหนาแน่นสูง',
    5: 'ความหนาแน่นสูงมาก'
  };

  // Calculate total housing units from all systems
  const totalHousingUnits = Object.values(stats.housingSystems || {}).reduce((sum, val) => sum + val, 0);

  return (
    <div className={`${isMobile ? 'p-4' : 'p-5'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800">สถิติข้อมูล</h2>
          <span className="text-sm text-gray-500">({provinceName})</span>
        </div>
      </div>

      {/* Selected Grid Info */}
      {selectedGrid && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">กริดที่เลือก: {selectedGrid.GRID_ID}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                <div>ประชากร: {formatNumber(selectedGrid.Grid_POP || 0)} คน</div>
                <div>หลังคาเรือน: {formatNumber(selectedGrid.Grid_House || 0)}</div>
                <div>ความหนาแน่น: Class {selectedGrid.Grid_Class || '-'}</div>
                <div>ระบบหลัก: C{selectedGrid.MainHDS || '-'}</div>
              </div>
            </div>
            <button
              onClick={onClearSelection}
              className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
              title="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-600">จำนวนกริด</p>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalGrids)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-600">ประชากรรวม</p>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalPopulation)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-600">หลังคาเรือน</p>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalHousing)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-600">ความหนาแน่นเฉลี่ย</p>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.averageDensity)}</p>
          <p className="text-xs text-gray-500">คน/กริด</p>
        </div>
      </div>

      {/* Housing Systems Distribution */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-500 rounded"></div>
          การกระจายระบบที่อยู่อาศัย
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.housingSystems || {})
            .filter(([key, value]) => value > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([key, value]) => {
              const percentage = totalHousingUnits > 0 ? ((value / totalHousingUnits) * 100).toFixed(1) : 0;
              return (
                <div key={key} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{housingSystemNames[key] || key}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{formatNumber(value)}</span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default HDSStatistics;
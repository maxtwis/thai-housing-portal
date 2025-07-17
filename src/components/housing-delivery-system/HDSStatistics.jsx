import React from 'react';

const HDSStatistics = ({ stats, selectedGrid, onClearSelection, isMobile, provinceName, supplyData }) => {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const getDensityLevelName = (gridClass) => {
    const densityLevels = {
      1: 'ความหนาแน่นต่ำมาก',
      2: 'ความหนาแน่นต่ำ', 
      3: 'ความหนาแน่นปานกลาง',
      4: 'ความหนาแน่นสูง',
      5: 'ความหนาแน่นสูงมาก'
    };
    
    return densityLevels[gridClass] || `Class ${gridClass}`;
  };

  // Updated housing system names with correct Thai descriptions
  const housingSystemNames = {
    C1: 'C1 - ระบบของชุมชนแออัดบนที่ดินรัฐ/เอกชน',
    C2: 'C2 - ระบบการถือครองที่ดินชั่วคราว',
    C3: 'C3 - ระบบของกลุ่มประชากรแฝง',
    C4: 'C4 - ระบบที่อยู่อาศัยของลูกจ้าง',
    C5: 'C5 - ระบบที่อยู่อาศัยที่รัฐจัดสร้าง',
    C6: 'C6 - ระบบที่อยู่อาศัยที่รัฐสนับสนุน',
    C7: 'C7 - ระบบที่อยู่อาศัยเอกชน'
  };

  // Calculate total housing units from all systems
  const totalHousingUnits = Object.values(stats.housingSystems || {}).reduce((sum, val) => sum + val, 0);

  return (
    <div className={`${isMobile ? 'p-4' : 'p-5'} space-y-6`}>
      {/* SELECTED GRID STATISTICS - ABOVE OVERALL STATS */}
      {selectedGrid && (
        <div>
          {/* Selected Grid Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-800">กริดที่เลือก</h2>
              <span className="text-sm text-gray-500">(ID: {selectedGrid.FID || selectedGrid.OBJECTID_1 || selectedGrid.Grid_Code || selectedGrid.Grid_CODE || selectedGrid.OBJECTID})</span>
            </div>
            <button
              onClick={onClearSelection}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="ยกเลิกการเลือก"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Selected Grid Overview Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{formatNumber(Math.round(selectedGrid.Grid_POP || 0))}</div>
              <div className="text-sm text-gray-600 mt-1">ประชากรรวม</div>
              <div className="text-xs text-gray-500">คน</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
              <div className="text-2xl font-bold text-green-600">{formatNumber(Math.round(selectedGrid.Grid_House || 0))}</div>
              <div className="text-sm text-gray-600 mt-1">ที่อยู่อาศัยรวม</div>
              <div className="text-xs text-gray-500">หน่วย</div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200 mb-4">
            <div className="text-xl font-bold text-purple-600">{getDensityLevelName(selectedGrid.Grid_Class)}</div>
            <div className="text-sm text-gray-600 mt-1">ระดับความหนาแน่น</div>
          </div>

          {/* Selected Grid Housing Systems */}
          {(() => {
            const selectedHdsNumbers = [
              { code: 'C1', count: selectedGrid.HDS_C1_num || 0 },
              { code: 'C2', count: selectedGrid.HDS_C2_num || 0 },
              { code: 'C3', count: selectedGrid.HDS_C3_num || 0 },
              { code: 'C4', count: selectedGrid.HDS_C4_num || 0 },
              { code: 'C5', count: selectedGrid.HDS_C5_num || 0 },
              { code: 'C6', count: selectedGrid.HDS_C6_num || 0 },
              { code: 'C7', count: selectedGrid.HDS_C7_num || 0 }
            ];
            
            const selectedTotalHousing = selectedHdsNumbers.reduce((sum, item) => sum + item.count, 0);
            const activeSystems = selectedHdsNumbers.filter(item => item.count > 0);

            return selectedTotalHousing > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded"></div>
                  ระบบที่อยู่อาศัย
                </h3>
                <div className="space-y-2">
                  {activeSystems
                    .sort((a, b) => {
                      // Sort by system code (C1, C2, C3... instead of by count)
                      return a.code.localeCompare(b.code);
                    })
                    .map(({ code, count }) => {
                      const percentage = selectedTotalHousing > 0 ? 
                        ((count / selectedTotalHousing) * 100).toFixed(1) : 0;
                      
                      return (
                        <div key={code} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{housingSystemNames[code]}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{formatNumber(count)}</span>
                            <span className="text-gray-500 text-xs">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : null;
          })()}

          {/* Separator */}
          <div className="border-t border-gray-200 my-4"></div>
        </div>
      )}

      {/* OVERALL STATISTICS - BELOW SELECTED GRID */}
      <div>
        {/* Overall Stats Header */}
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800">สถิติรวม</h2>
          <span className="text-sm text-gray-500">({provinceName})</span>
        </div>

        {/* Main Overview Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.totalPopulation)}</div>
            <div className="text-sm text-gray-600 mt-1">ประชากรรวม</div>
            <div className="text-xs text-gray-500">คน</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
            <div className="text-2xl font-bold text-green-600">{formatNumber(stats.totalHousing)}</div>
            <div className="text-sm text-gray-600 mt-1">ที่อยู่อาศัยรวม</div>
            <div className="text-xs text-gray-500">หน่วย</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{formatNumber(stats.totalGrids)}</div>
            <div className="text-sm text-gray-600 mt-1">จำนวนกริด</div>
            <div className="text-xs text-gray-500">พื้นที่</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{formatNumber(stats.averageDensity)}</div>
            <div className="text-sm text-gray-600 mt-1">ความหนาแน่นเฉลี่ย</div>
            <div className="text-xs text-gray-500">คน/กริด</div>
          </div>
        </div>

        {/* Overall Housing Systems - Display in proper order C1-C7 */}
        {totalHousingUnits > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded"></div>
              ระบบที่อยู่อาศัยทั้งหมด
            </h3>
            <div className="space-y-2">
              {/* Show systems in proper order C1, C2, C3, C4, C5, C6, C7 */}
              {['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']
                .map(key => ({ key, value: stats.housingSystems[key] || 0 }))
                .filter(({ value }) => value > 0)
                .map(({ key, value }) => {
                  const percentage = totalHousingUnits > 0 ? 
                    ((value / totalHousingUnits) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm text-gray-700">{housingSystemNames[key]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{formatNumber(value)}</span>
                        <span className="text-xs text-gray-500 w-12 text-right">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Problem Areas (if any data exists) */}
        {Object.values(stats.problemAreas || {}).some(val => val > 0) && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-red-500 rounded"></div>
              พื้นที่ปัญหา
            </h3>
            <div className="space-y-2">
              {stats.problemAreas.supply > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">ปัญหาการจัดหา</span>
                  <span className="font-medium text-red-600">{stats.problemAreas.supply.toFixed(1)}%</span>
                </div>
              )}
              {stats.problemAreas.subsidies > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">ปัญหาเงินอุดหนุน</span>
                  <span className="font-medium text-red-600">{stats.problemAreas.subsidies.toFixed(1)}%</span>
                </div>
              )}
              {stats.problemAreas.stability > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">ปัญหาความมั่นคง</span>
                  <span className="font-medium text-red-600">{stats.problemAreas.stability.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HDSStatistics;
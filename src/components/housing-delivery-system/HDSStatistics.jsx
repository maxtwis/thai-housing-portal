// Complete reorganized HDSStatistics.jsx component

import React from 'react';

const HDSStatistics = ({ stats, selectedGrid, onClearSelection, isMobile, provinceName, supplyData }) => {
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
            <div className="text-xl font-bold text-purple-600">Class {selectedGrid.Grid_Class || '-'}</div>
            <div className="text-sm text-gray-600 mt-1">ระดับความหนาแน่น</div>
          </div>

          {/* Selected Grid Housing Systems */}
          {(() => {
            const selectedHdsNumbers = [
              { code: 1, count: selectedGrid.HDS_C1_num || 0 },
              { code: 2, count: selectedGrid.HDS_C2_num || 0 },
              { code: 3, count: selectedGrid.HDS_C3_num || 0 },
              { code: 4, count: selectedGrid.HDS_C4_num || 0 },
              { code: 5, count: selectedGrid.HDS_C5_num || 0 },
              { code: 6, count: selectedGrid.HDS_C6_num || 0 },
              { code: 7, count: selectedGrid.HDS_C7_num || 0 }
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
                  {activeSystems.map(({ code, count }) => {
                    const percentage = selectedTotalHousing > 0 ? ((count / selectedTotalHousing) * 100).toFixed(1) : 0;
                    return (
                      <div key={code} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{housingSystemNames[`HDS_C${code}`] || `C${code}`}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{formatNumber(count)}</span>
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
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200 mb-4">
                <div className="text-sm text-gray-500">ไม่มีข้อมูลระบบที่อยู่อาศัย</div>
              </div>
            );
          })()}

          {/* Supply Data Section - Integrated into Selected Grid Card */}
          {supplyData && Object.keys(supplyData).length > 0 && (() => {
            const gridId = selectedGrid.FID || selectedGrid.OBJECTID_1 || selectedGrid.Grid_Code || selectedGrid.Grid_CODE || selectedGrid.OBJECTID;
            const gridSupplyData = supplyData[gridId];
            
            if (gridSupplyData) {
              return (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-green-500 rounded"></div>
                    ข้อมูลอุปทานที่อยู่อาศัย
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Total Supply */}
                    <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{gridSupplyData.totalSupply.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 mt-1">หน่วยทั้งหมด</div>
                    </div>

                    {/* Prices */}
                    {(gridSupplyData.averageSalePrice > 0 || gridSupplyData.averageRentPrice > 0) && (
                      <div className="grid grid-cols-1 gap-2">
                        {gridSupplyData.averageSalePrice > 0 && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">ราคาขายเฉลี่ย</span>
                              <span className="text-lg font-bold text-blue-600">{(gridSupplyData.averageSalePrice / 1000000).toFixed(2)} ล้านบาท</span>
                            </div>
                          </div>
                        )}

                        {gridSupplyData.averageRentPrice > 0 && (
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">ราคาเช่าเฉลี่ย</span>
                              <span className="text-lg font-bold text-purple-600">{gridSupplyData.averageRentPrice.toLocaleString()} บาท/เดือน</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Housing Types */}
                    {Object.keys(gridSupplyData.housingTypes || {}).length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">ประเภทที่อยู่อาศัย:</h4>
                        <div className="space-y-2">
                          {Object.entries(gridSupplyData.housingTypes).map(([type, data]) => {
                            const percentage = gridSupplyData.totalSupply > 0 ? ((data.supplyCount / gridSupplyData.totalSupply) * 100).toFixed(1) : 0;
                            return (
                              <div key={type} className="group">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-700">{type}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-900">{data.supplyCount} หน่วย</span>
                                    <span className="text-xs text-gray-500">({percentage}%)</span>
                                  </div>
                                </div>
                                <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="absolute h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500 ease-out" 
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            } else {
              return (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-green-500 rounded"></div>
                    ข้อมูลอุปทานที่อยู่อาศัย
                  </h3>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                    <div className="text-sm text-yellow-700">ไม่มีข้อมูลอุปทานสำหรับกริดนี้</div>
                  </div>
                </div>
              );
            }
          })()}
        </div>
      )}

      {/* OVERALL PROVINCE STATISTICS - BELOW SELECTED GRID */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800">สถิติรวม</h2>
            <span className="text-sm text-gray-500">({provinceName})</span>
          </div>
        </div>

        {/* Overall Statistics Cards */}
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

        {/* Overall Housing Systems */}
        {totalHousingUnits > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded"></div>
              ระบบที่อยู่อาศัยทั้งหมด
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.housingSystems || {})
                .filter(([key, value]) => value > 0)
                .sort(([,a], [,b]) => b - a)
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
        )}
      </div>
    </div>
  );
};

export default HDSStatistics;
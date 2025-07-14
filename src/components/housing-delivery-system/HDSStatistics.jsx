import React from 'react';

const HDSStatistics = ({ 
  stats, 
  selectedGrid, 
  onClearSelection, 
  isMobile = false, 
  provinceName = '',
  supplyData = null,
  supplyStats = null
}) => {
  
  // Define housing system names mapping
  const housingSystemNames = {
    'HDS_C1': 'ระบบของชุมชนแออัดบนที่ดินรัฐ/เอกชน',
    'HDS_C2': 'ระบบการถือครองที่ดินชั่วคราว', 
    'HDS_C3': 'ระบบของกลุ่มประชากรแฝง',
    'HDS_C4': 'ระบบที่อยู่อาศัยของลูกจ้าง',
    'HDS_C5': 'ระบบที่อยู่อาศัยที่รัฐจัดสร้าง',
    'HDS_C6': 'ระบบที่อยู่อาศัยที่รัฐสนับสนุน',
    'HDS_C7': 'ระบบที่อยู่อาศัยเอกชน'
  };

  // If a grid is selected, show statistics for that grid only
  if (selectedGrid) {
    const gridId = selectedGrid.OBJECTID || selectedGrid.Grid_Code || selectedGrid.FID || 'ไม่ทราบ';
    const gridSupplyData = supplyData?.[gridId];
    
    const gridStats = {
      gridId: gridId,
      population: selectedGrid.Grid_POP || 0,
      housing: selectedGrid.Grid_House || 0,
      densityLevel: selectedGrid.Grid_Class || 'ไม่มีข้อมูล',
      housingSystems: {
        HDS_C1: selectedGrid.HDS_C1_num || 0,
        HDS_C2: selectedGrid.HDS_C2_num || 0,
        HDS_C3: selectedGrid.HDS_C3_num || 0,
        HDS_C4: selectedGrid.HDS_C4_num || 0,
        HDS_C5: selectedGrid.HDS_C5_num || 0,
        HDS_C6: selectedGrid.HDS_C6_num || 0,
        HDS_C7: selectedGrid.HDS_C7_num || 0
      },
      problems: {
        supply: selectedGrid.Supply_Pro && selectedGrid.Supply_Pro.trim(),
        subsidies: selectedGrid.Subsidies_ && selectedGrid.Subsidies_.trim(),
        stability: selectedGrid.Stability_ && selectedGrid.Stability_.trim()
      }
    };

    const totalHousingInGrid = Object.values(gridStats.housingSystems).reduce((sum, count) => sum + count, 0);

    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
            สถิติกริด ID: {gridStats.gridId}
          </h2>
          <button 
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            ดูภาพรวมทั้งหมด
          </button>
        </div>
      
        <div className="space-y-4">
          {/* Selected Grid Overview */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">ข้อมูลกริดที่เลือก</h3>
            <div className="mt-2 space-y-2">
              <div>
                <span className="text-sm text-gray-500">ประชากร:</span>
                <span className="block text-lg font-medium">
                  {Math.round(gridStats.population).toLocaleString()} คน
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">ที่อยู่อาศัยรวม:</span>
                <span className="block text-lg font-medium">
                  {gridStats.housing.toLocaleString()} หน่วย
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">ระดับความหนาแน่น:</span>
                <span className="block text-lg font-medium">
                  ระดับ {gridStats.densityLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Housing Systems in Selected Grid */}
          {totalHousingInGrid > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">ระบบที่อยู่อาศัยในกริดนี้</h3>
              <div className="mt-2 space-y-2">
                {Object.entries(gridStats.housingSystems)
                  .filter(([, count]) => count > 0)
                  .sort(([,a], [,b]) => b - a)
                  .map(([system, count]) => {
                    return (
                      <div key={system} className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500 pr-2 flex-1">
                          {housingSystemNames[system] || system}:
                        </span>
                        <div className="text-right">
                          <span className="text-base font-medium">
                            {count.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            ({((count / totalHousingInGrid) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Housing Supply Data for Selected Grid */}
          {gridSupplyData && gridSupplyData.totalSupply > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">ข้อมูลอุปทานที่อยู่อาศัย</h3>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="text-sm text-gray-500">อุปทานรวม:</span>
                  <span className="block text-lg font-medium text-green-600">
                    {gridSupplyData.totalSupply.toLocaleString()} หน่วย
                  </span>
                </div>
                
                {gridSupplyData.totalForSale > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">สำหรับขาย:</span>
                      <span className="block text-base font-medium text-blue-600">
                        {gridSupplyData.totalForSale.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">ราคาเฉลี่ย:</span>
                      <span className="block text-base font-medium text-blue-600">
                        {(gridSupplyData.averageSalePrice / 1000000).toFixed(2)} ล้าน
                      </span>
                    </div>
                  </div>
                )}
                
                {gridSupplyData.totalForRent > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">สำหรับเช่า:</span>
                      <span className="block text-base font-medium text-orange-600">
                        {gridSupplyData.totalForRent.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">ค่าเช่าเฉลี่ย:</span>
                      <span className="block text-base font-medium text-orange-600">
                        {gridSupplyData.averageRentPrice.toLocaleString()} บาท
                      </span>
                    </div>
                  </div>
                )}
                
                {gridSupplyData.houseTypes && Object.keys(gridSupplyData.houseTypes).length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">ประเภทที่อยู่อาศัยในกริดนี้:</h4>
                    {Object.entries(gridSupplyData.houseTypes)
                      .sort(([,a], [,b]) => b.count - a.count)
                      .slice(0, 5)
                      .map(([type, data]) => (
                        <div key={type} className="flex justify-between items-baseline mb-1">
                          <span className="text-xs text-gray-500">{type}:</span>
                          <span className="text-sm font-medium">{data.count}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Problem Areas in Selected Grid */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">ปัญหาในกริดนี้</h3>
            <div className="mt-2 space-y-2">
              {gridStats.problems.supply ? (
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-sm font-medium text-red-600">ปัญหาด้าน Supply:</p>
                  <p className="text-xs text-red-700">{gridStats.problems.supply}</p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">✓ ไม่มีปัญหาด้าน Supply</div>
              )}
              
              {gridStats.problems.subsidies ? (
                <div className="bg-orange-50 p-2 rounded">
                  <p className="text-sm font-medium text-orange-600">ปัญหาด้าน Subsidies:</p>
                  <p className="text-xs text-orange-700">{gridStats.problems.subsidies}</p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">✓ ไม่มีปัญหาด้าน Subsidies</div>
              )}
              
              {gridStats.problems.stability ? (
                <div className="bg-yellow-50 p-2 rounded">
                  <p className="text-sm font-medium text-yellow-600">ปัญหาด้าน Stability:</p>
                  <p className="text-xs text-yellow-700">{gridStats.problems.stability}</p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">✓ ไม่มีปัญหาด้าน Stability</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show overall province statistics
  return (
    <div className="p-4">
      <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-4`}>
        สถิติภาพรวม{provinceName ? ` - ${provinceName}` : ''}
      </h2>
      
      <div className="space-y-6">
        {/* Overview Statistics */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">ข้อมูลพื้นฐาน</h3>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">กริดทั้งหมด</span>
              <span className="block text-lg font-medium">
                {stats.totalGrids?.toLocaleString() || 0}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">ประชากรรวม</span>
              <span className="block text-lg font-medium">
                {Math.round(stats.totalPopulation || 0).toLocaleString()} คน
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">ที่อยู่อาศัยรวม</span>
              <span className="block text-lg font-medium">
                {(stats.totalHousing || 0).toLocaleString()} หน่วย
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">ความหนาแน่นเฉลี่ย</span>
              <span className="block text-lg font-medium">
                {Math.round(stats.averageDensity || 0).toLocaleString()} คน/กริด
              </span>
            </div>
          </div>
        </div>

        {/* Housing Delivery Systems */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">ระบบที่อยู่อาศัย</h3>
          <div className="mt-2 space-y-2">
            {Object.entries(stats.housingSystems || {})
              .filter(([, count]) => count > 0) // Only show systems with housing units
              .sort(([,a], [,b]) => b - a) // Sort by count in descending order
              .map(([system, count]) => {
                return (
                  <div key={system} className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-500 pr-2 flex-1">
                      {housingSystemNames[system] || system}:
                    </span>
                    <div className="text-right">
                      <span className="text-base font-medium">
                        {count.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({((count / (stats.totalHousing || 1)) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Housing Supply Statistics - SAFE ACCESS */}
        {supplyStats && typeof supplyStats === 'object' && supplyStats.totalSupply > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">ข้อมูลอุปทานที่อยู่อาศัย</h3>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-500">อุปทานรวม:</span>
                <span className="text-base font-medium text-green-600">
                  {supplyStats.totalSupply.toLocaleString()} หน่วย
                </span>
              </div>
              
              {supplyStats.averageSalePrice && supplyStats.averageSalePrice > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">ราคาขายเฉลี่ย:</span>
                  <span className="text-base font-medium text-blue-600">
                    {(supplyStats.averageSalePrice / 1000000).toFixed(2)} ล้านบาท
                  </span>
                </div>
              )}
              
              {supplyStats.averageRentPrice && supplyStats.averageRentPrice > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">ราคาเช่าเฉลี่ย:</span>
                  <span className="text-base font-medium text-orange-600">
                    {supplyStats.averageRentPrice.toLocaleString()} บาท/เดือน
                  </span>
                </div>
              )}
              
              {supplyStats.houseTypeDistribution && Object.keys(supplyStats.houseTypeDistribution).length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-medium text-gray-600 mb-2">ประเภทที่อยู่อาศัยยอดนิยม:</h4>
                  {Object.entries(supplyStats.houseTypeDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-between items-baseline">
                        <span className="text-xs text-gray-500">{type}:</span>
                        <span className="text-sm font-medium">{count.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              )}
              
              {supplyStats.highestSupplyGrid && (
                <div className="mt-3 pt-2 border-t">
                  <p className="text-xs text-gray-600">
                    🏆 กริดที่มีอุปทานสูงสุด: กริด {supplyStats.highestSupplyGrid.gridId} 
                    ({supplyStats.highestSupplyGrid.totalSupply.toLocaleString()} หน่วย)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show loading message for Songkhla when no supply data */}
        {provinceName === 'สงขลา' && (!supplyStats || !supplyStats.totalSupply) && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">ข้อมูลอุปทานที่อยู่อาศัย</h3>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">กำลังโหลดข้อมูลอุปทาน...</p>
            </div>
          </div>
        )}

        {/* Density Distribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">การกระจายตามระดับความหนาแน่น</h3>
          <div className="mt-2 space-y-3">
            {Object.entries(stats.densityLevels || {})
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([level, count]) => {
                const percentage = ((count / (stats.totalGrids || 1)) * 100).toFixed(1);
                return (
                  <div key={level} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">ระดับ {level}:</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">{count} กริด</span>
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Problem Areas */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">พื้นที่ที่มีปัญหา</h3>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">ปัญหาด้านอุปทาน (Supply):</span>
              <span className="text-base font-medium text-red-600">
                {(stats.problemAreas?.supply || 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">ปัญหาด้านเงินอุดหนุน (Subsidies):</span>
              <span className="text-base font-medium text-orange-600">
                {(stats.problemAreas?.subsidies || 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">ปัญหาด้านความมั่นคง (Stability):</span>
              <span className="text-base font-medium text-yellow-600">
                {(stats.problemAreas?.stability || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HDSStatistics;
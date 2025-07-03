import React from 'react';

const HDSStatistics = ({ stats, selectedGrid, onClearSelection, selectedProvince }) => {
  // Province names mapping
  const provinceNames = {
    'kkn': 'ขอนแก่น',
    'cnx': 'เชียงใหม่'
  };

  const provinceName = provinceNames[selectedProvince] || 'ไม่ทราบ';

  // Show selected grid details if available
  if (selectedGrid) {
    const hdsNumbers = [
      { code: 'HDS_C1', label: 'ระบบของชุมชนแออัดบนที่ดินรัฐ/เอกชน', count: selectedGrid.HDS_C1_num || 0 },
      { code: 'HDS_C2', label: 'ระบบการถือครองที่ดินชั่วคราว', count: selectedGrid.HDS_C2_num || 0 },
      { code: 'HDS_C3', label: 'ระบบของกลุ่มประชากรแฝง', count: selectedGrid.HDS_C3_num || 0 },
      { code: 'HDS_C4', label: 'ระบบที่อยู่อาศัยของลูกจ้าง', count: selectedGrid.HDS_C4_num || 0 },
      { code: 'HDS_C5', label: 'ระบบที่อยู่อาศัยที่รัฐจัดสร้าง', count: selectedGrid.HDS_C5_num || 0 },
      { code: 'HDS_C6', label: 'ระบบที่อยู่อาศัยที่รัฐสนับสนุน', count: selectedGrid.HDS_C6_num || 0 },
      { code: 'HDS_C7', label: 'ระบบที่อยู่อาศัยเอกชน', count: selectedGrid.HDS_C7_num || 0 }
    ];

    const totalHousingInGrid = hdsNumbers.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">ข้อมูลกริดที่เลือก</h2>
          <button 
            onClick={onClearSelection}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            ✕ ปิด
          </button>
        </div>
        
        <div className="space-y-3">
          {/* Grid basic info */}
          <div className="bg-blue-50 p-3 rounded">
            <h3 className="font-medium text-blue-800">กริด ID: {selectedGrid.FID}</h3>
            <p className="text-sm text-blue-600">{provinceName}</p>
          </div>
          
          {/* Population and housing */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">ประชากร</div>
              <div className="font-medium">
                {selectedGrid.Grid_POP ? Math.round(selectedGrid.Grid_POP).toLocaleString() : 'ไม่มีข้อมูล'} คน
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">ที่อยู่อาศัย</div>
              <div className="font-medium">
                {selectedGrid.Grid_House ? Math.round(selectedGrid.Grid_House).toLocaleString() : 'ไม่มีข้อมูล'} หน่วย
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded text-sm">
            <div className="text-gray-600">ระดับความหนาแน่น</div>
            <div className="font-medium">ระดับ {selectedGrid.Grid_Class || 'ไม่มีข้อมูล'}</div>
          </div>

          {/* Housing systems breakdown */}
          {totalHousingInGrid > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">ระบบที่อยู่อาศัย</h4>
              <div className="space-y-1">
                {hdsNumbers
                  .filter(item => item.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .map((item) => (
                    <div key={item.code} className="flex justify-between items-baseline text-xs">
                      <span className="text-gray-600 flex-1 pr-2">{item.label}:</span>
                      <div className="text-right">
                        <span className="font-medium">{item.count.toLocaleString()}</span>
                        <span className="text-gray-500 ml-1">
                          ({((item.count / totalHousingInGrid) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Problem indicators */}
          <div className="space-y-2">
            {selectedGrid.Supply_Pro && selectedGrid.Supply_Pro.trim() && (
              <div className="bg-orange-50 border border-orange-200 p-2 rounded text-xs">
                <div className="font-medium text-orange-800">ปัญหาการจัดหาที่อยู่อาศัย</div>
                <div className="text-orange-700">{selectedGrid.Supply_Pro}</div>
              </div>
            )}
            
            {selectedGrid.Subsidies_ && selectedGrid.Subsidies_.trim() && (
              <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs">
                <div className="font-medium text-yellow-800">ปัญหาการสนับสนุน</div>
                <div className="text-yellow-700">{selectedGrid.Subsidies_}</div>
              </div>
            )}
            
            {selectedGrid.Stability_ && selectedGrid.Stability_.trim() && (
              <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                <div className="font-medium text-red-800">ปัญหาความมั่นคง</div>
                <div className="text-red-700">{selectedGrid.Stability_}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show overall statistics
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">สถิติรวม - {provinceName}</h2>
      
      <div className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-blue-600 text-xs">กริดทั้งหมด</div>
            <div className="text-lg font-bold text-blue-800">
              {stats.totalGrids.toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-green-600 text-xs">ประชากรรวม</div>
            <div className="text-lg font-bold text-green-800">
              {Math.round(stats.totalPopulation).toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-purple-600 text-xs">ที่อยู่อาศัยรวม</div>
            <div className="text-lg font-bold text-purple-800">
              {Math.round(stats.totalHousing).toLocaleString()}
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <div className="text-orange-600 text-xs">ความหนาแน่นเฉลี่ย</div>
            <div className="text-lg font-bold text-orange-800">
              {Math.round(stats.averageDensity).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Housing Delivery Systems */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">ระบบที่อยู่อาศัย</h3>
          <div className="mt-2 space-y-2">
            {Object.entries(stats.housingSystems)
              .sort(([,a], [,b]) => b - a) // Sort by count in descending order
              .map(([system, count]) => {
                const systemNames = {
                  'HDS_C1': 'ระบบของชุมชนแออัดบนที่ดินรัฐ/เอกชน',
                  'HDS_C2': 'ระบบถือครองชั่วคราว',
                  'HDS_C3': 'ระบบกลุ่มประชากรแฝง',
                  'HDS_C4': 'ระบบที่อยู่อาศัยลูกจ้าง',
                  'HDS_C5': 'ระบบที่อยู่อาศัยรัฐ',
                  'HDS_C6': 'ระบบที่อยู่อาศัยรัฐสนับสนุน',
                  'HDS_C7': 'ระบบที่อยู่อาศัยเอกชน'
                };
                
                return (
                  <div key={system} className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-500">
                      {systemNames[system] || system}:
                    </span>
                    <div className="text-right">
                      <span className="text-base font-medium">
                        {count.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({((count / stats.totalHousing) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Density Distribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">การกระจายตามระดับความหนาแน่น</h3>
          <div className="mt-2 space-y-3">
            {Object.entries(stats.densityLevels)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([level, count]) => (
                <div key={level} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">ระดับ {level}:</span>
                  <div className="text-right">
                    <span className="text-base font-medium">{count.toLocaleString()}</span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({((count / stats.totalGrids) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Problem Areas */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">พื้นที่มีปัญหา</h3>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">การจัดหาที่อยู่อาศัย:</span>
              <span className="text-sm font-medium text-orange-600">
                {stats.problemAreas.supply.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">การสนับสนุน:</span>
              <span className="text-sm font-medium text-yellow-600">
                {stats.problemAreas.subsidies.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">ความมั่นคง:</span>
              <span className="text-sm font-medium text-red-600">
                {stats.problemAreas.stability.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          หมายเหตุ: คลิกที่กริดบนแผนที่เพื่อดูรายละเอียด
        </div>
      </div>
    </div>
  );
};

export default HDSStatistics;
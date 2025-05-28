import React from 'react';

const HDSStatistics = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">สถิติ</h2>
      <div className="space-y-4">
        {/* Grid Overview */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">ภาพรวมพื้นที่</h3>
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-sm text-gray-500">จำนวนกริดทั้งหมด:</span>
              <span className="block text-lg font-medium">
                {stats.totalGrids.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">ประชากรรวม:</span>
              <span className="block text-lg font-medium">
                {stats.totalPopulation.toLocaleString()} คน
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">ที่อยู่อาศัยรวม:</span>
              <span className="block text-lg font-medium">
                {stats.totalHousing.toLocaleString()} หน่วย
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">ความหนาแน่นเฉลี่ย:</span>
              <span className="block text-lg font-medium">
                {stats.averageDensity.toFixed(1)} คน/กริด
              </span>
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
                  'HDS_C1': 'ระบบชุมชนบุกรุก',
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
                <div key={level}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-500">ระดับ {level}:</span>
                    <span className="text-sm font-medium">
                      {((count / stats.totalGrids) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                    <div 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                      style={{ width: `${(count / stats.totalGrids) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {count.toLocaleString()} กริด
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Problem Areas */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">พื้นที่มีปัญหา</h3>
          <div className="mt-2 space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">ปัญหาด้าน Supply:</span>
                <span className="text-sm font-medium text-red-600">
                  {stats.problemAreas.supply.toFixed(1)}%
                </span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-red-100">
                <div 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
                  style={{ width: `${stats.problemAreas.supply}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">ปัญหาด้าน Subsidies:</span>
                <span className="text-sm font-medium text-orange-600">
                  {stats.problemAreas.subsidies.toFixed(1)}%
                </span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-orange-100">
                <div 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"
                  style={{ width: `${stats.problemAreas.subsidies}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">ปัญหาด้าน Stability:</span>
                <span className="text-sm font-medium text-yellow-600">
                  {stats.problemAreas.stability.toFixed(1)}%
                </span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-yellow-100">
                <div 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
                  style={{ width: `${stats.problemAreas.stability}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            * ข้อมูลจากการสำรวจระบบที่อยู่อาศัยในพื้นที่จังหวัดขอนแก่น
            <br />
            * การแบ่งกริดตามความหนาแน่นของประชากรและที่อยู่อาศัย
            <br />
            * ระดับความหนาแน่น: 1 = ต่ำสุด, 5 = สูงสุด
          </p>
        </div>
      </div>
    </div>
  );
};

export default HDSStatistics;
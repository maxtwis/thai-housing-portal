import React from 'react';

const Statistics = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">สถิติ</h2>
      <div className="space-y-4">
        {/* Building Overview */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">ภาพรวมอาคาร</h3>
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-sm text-gray-500">จำนวนอาคารทั้งหมด:</span>
              <span className="block text-lg font-medium">
                {stats.totalBuildings.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">จำนวนชั้นเฉลี่ย:</span>
              <span className="block text-lg font-medium">
                {stats.averageStories.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">จำนวนครัวเรือน:</span>
              <span className="block text-lg font-medium">
                {stats.totalHouseholds.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">ค่าเช่าเฉลี่ย:</span>
              <span className="block text-lg font-medium">
                ฿{stats.averageRent.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Building Types */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">ประเภทอาคาร</h3>
          <div className="mt-2 space-y-2">
            {Object.entries(stats.buildingTypes)
              .sort(([,a], [,b]) => b - a) // Sort by count in descending order
              .map(([type, count]) => (
                <div key={type} className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">{type === '' ? 'ไม่มีข้อมูล' : type}:</span>
                  <div className="text-right">
                    <span className="text-base font-medium">
                      {count.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({((count / stats.totalBuildings) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Accessibility */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">การเข้าถึง (เฉพาะที่อยู่อาศัย)</h3>
          <div className="mt-2 space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">การเข้าถึงระบบขนส่ง:</span>
                <span className="text-sm font-medium">
                  {stats.accessibility.goodTransport.toFixed(1)}%
                </span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-100">
                <div 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  style={{ width: `${stats.accessibility.goodTransport}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">การเข้าถึงสถานพยาบาล:</span>
                <span className="text-sm font-medium">
                  {stats.accessibility.goodHealthcare.toFixed(1)}%
                </span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-green-100">
                <div 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                  style={{ width: `${stats.accessibility.goodHealthcare}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            * การเข้าถึงระบบขนส่งที่ดี: อยู่ในระยะ 1 กม. จากระบบขนส่งสาธารณะ
            <br />
            * การเข้าถึงสถานพยาบาลที่ดี: อยู่ในระยะ 2 กม. จากสถานพยาบาล
          </p>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
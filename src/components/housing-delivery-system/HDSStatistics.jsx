import React from 'react';

const HDSStatistics = ({ 
  stats, 
  selectedGrid, 
  isMobile, 
  provinceName,
  hasCSVData = false,
  csvData = null
}) => {
  
  // Format currency
  const formatCurrency = (amount, short = false) => {
    if (!amount || amount === 0) return 'ไม่มีข้อมูล';
    
    if (short && amount >= 1000000) {
      return `฿${(amount / 1000000).toFixed(1)}M`;
    } else if (short && amount >= 1000) {
      return `฿${(amount / 1000).toFixed(0)}K`;
    }
    
    return `฿${Math.round(amount).toLocaleString()}`;
  };

  // Get top house types from CSV data
  const getTopHouseTypes = () => {
    if (!csvData) return [];
    
    const typeStats = {};
    Object.values(csvData).forEach(gridData => {
      gridData.houseTypes.forEach(type => {
        if (type.type && type.supply > 0) {
          if (!typeStats[type.type]) {
            typeStats[type.type] = 0;
          }
          typeStats[type.type] += type.supply;
        }
      });
    });
    
    return Object.entries(typeStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  };

  // Calculate price statistics
  const getPriceStatistics = () => {
    if (!csvData) return null;
    
    const salePrices = [];
    const rentPrices = [];
    
    Object.values(csvData).forEach(gridData => {
      if (gridData.averageSalePrice > 0) {
        salePrices.push(gridData.averageSalePrice);
      }
      if (gridData.averageRentPrice > 0) {
        rentPrices.push(gridData.averageRentPrice);
      }
    });

    const getPercentile = (arr, percentile) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[index] || 0;
    };

    return {
      sale: {
        count: salePrices.length,
        min: salePrices.length > 0 ? Math.min(...salePrices) : 0,
        max: salePrices.length > 0 ? Math.max(...salePrices) : 0,
        median: salePrices.length > 0 ? getPercentile(salePrices, 50) : 0,
        q25: salePrices.length > 0 ? getPercentile(salePrices, 25) : 0,
        q75: salePrices.length > 0 ? getPercentile(salePrices, 75) : 0
      },
      rent: {
        count: rentPrices.length,
        min: rentPrices.length > 0 ? Math.min(...rentPrices) : 0,
        max: rentPrices.length > 0 ? Math.max(...rentPrices) : 0,
        median: rentPrices.length > 0 ? getPercentile(rentPrices, 50) : 0,
        q25: rentPrices.length > 0 ? getPercentile(rentPrices, 25) : 0,
        q75: rentPrices.length > 0 ? getPercentile(rentPrices, 75) : 0
      }
    };
  };

  // Calculate CSV coverage statistics
  const getCSVCoverage = () => {
    if (!csvData || !stats.totalGrids) return null;
    
    const gridsWithData = Object.keys(csvData).length;
    const coveragePercent = Math.round((gridsWithData / stats.totalGrids) * 100);
    
    return {
      gridsWithData,
      totalGrids: stats.totalGrids,
      coveragePercent
    };
  };

  const topHouseTypes = hasCSVData ? getTopHouseTypes() : [];
  const priceStats = hasCSVData ? getPriceStatistics() : null;
  const csvCoverage = hasCSVData ? getCSVCoverage() : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-6">
      <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-4`}>
        สถิติภาพรวม{provinceName ? ` - ${provinceName}` : ''}
      </h2>
      
      <div className="space-y-6">
        {/* Overview Statistics */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">ข้อมูลพื้นฐาน HDS</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-xs text-blue-600">กริดทั้งหมด</span>
              <div className="text-lg font-bold text-blue-900">
                {stats.totalGrids?.toLocaleString() || 0}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-xs text-green-600">ประชากรรวม</span>
              <div className="text-lg font-bold text-green-900">
                {Math.round(stats.totalPopulation || 0).toLocaleString()}
              </div>
              <span className="text-xs text-green-600">คน</span>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <span className="text-xs text-purple-600">ที่อยู่อาศัยรวม</span>
              <div className="text-lg font-bold text-purple-900">
                {(stats.totalHousing || 0).toLocaleString()}
              </div>
              <span className="text-xs text-purple-600">หน่วย</span>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <span className="text-xs text-orange-600">ความหนาแน่นเฉลี่ย</span>
              <div className="text-lg font-bold text-orange-900">
                {Math.round(stats.averageDensity || 0).toLocaleString()}
              </div>
              <span className="text-xs text-orange-600">คน/กริด</span>
            </div>
          </div>
        </div>

        {/* Housing Delivery Systems */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">ระบบที่อยู่อาศัย</h3>
          <div className="space-y-2">
            {Object.entries(stats.housingSystems || {})
              .filter(([, count]) => count > 0)
              .sort(([,a], [,b]) => b - a)
              .map(([system, count]) => {
                const systemNames = {
                  HDS_C1: 'ชุมชนแออัด',
                  HDS_C2: 'ถือครองชั่วคราว',
                  HDS_C3: 'ประชากรแฝง',
                  HDS_C4: 'ลูกจ้าง',
                  HDS_C5: 'รัฐจัดสร้าง',
                  HDS_C6: 'รัฐสนับสนุน',
                  HDS_C7: 'เอกชน'
                };
                const systemColors = {
                  HDS_C1: 'bg-red-100 text-red-800',
                  HDS_C2: 'bg-orange-100 text-orange-800',
                  HDS_C3: 'bg-green-100 text-green-800',
                  HDS_C4: 'bg-blue-100 text-blue-800',
                  HDS_C5: 'bg-purple-100 text-purple-800',
                  HDS_C6: 'bg-pink-100 text-pink-800',
                  HDS_C7: 'bg-gray-100 text-gray-800'
                };
                return (
                  <div key={system} className="flex justify-between items-center p-2 rounded border">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${systemColors[system]}`}>
                        {systemNames[system]}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">{count.toLocaleString()} หน่วย</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Problem Areas */}
        {(stats.problemAreas?.supply > 0 || stats.problemAreas?.subsidies > 0 || stats.problemAreas?.stability > 0) && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">พื้นที่มีปัญหา</h3>
            <div className="space-y-2">
              {stats.problemAreas.supply > 0 && (
                <div className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <span className="text-sm text-red-700">ปัญหาอุปทาน</span>
                  </div>
                  <span className="text-sm font-medium text-red-800">{stats.problemAreas.supply} กริด</span>
                </div>
              )}
              {stats.problemAreas.subsidies > 0 && (
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded border border-orange-200">
                  <div className="flex items-center">
                    <span className="text-orange-600 mr-2">💰</span>
                    <span className="text-sm text-orange-700">ปัญหาเงินอุดหนุน</span>
                  </div>
                  <span className="text-sm font-medium text-orange-800">{stats.problemAreas.subsidies} กริด</span>
                </div>
              )}
              {stats.problemAreas.stability > 0 && (
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded border border-yellow-200">
                  <div className="flex items-center">
                    <span className="text-yellow-600 mr-2">🏠</span>
                    <span className="text-sm text-yellow-700">ปัญหาความมั่นคง</span>
                  </div>
                  <span className="text-sm font-medium text-yellow-800">{stats.problemAreas.stability} กริด</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CSV Data Statistics */}
        {hasCSVData && stats.csvStats && (
          <>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                ข้อมูลอุปทานจาก CKAN
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  CSV
                </span>
              </h3>
              
              {/* CSV Coverage */}
              {csvCoverage && (
                <div className="bg-green-50 p-3 rounded-lg mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-green-800">ความครอบคลุมข้อมูล</span>
                    <span className="text-lg font-bold text-green-900">{csvCoverage.coveragePercent}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${csvCoverage.coveragePercent}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {csvCoverage.gridsWithData} จาก {csvCoverage.totalGrids} กริด
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <span className="text-xs text-blue-600">อุปทานรวม</span>
                  <div className="text-lg font-bold text-blue-900">
                    {(stats.csvStats.totalSupply || 0).toLocaleString()}
                  </div>
                  <span className="text-xs text-blue-600">หน่วย</span>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <span className="text-xs text-green-600">ราคาขายเฉลี่ย</span>
                  <div className="text-sm font-bold text-green-900">
                    {formatCurrency(stats.csvStats.averageSalePrice, true)}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <span className="text-xs text-purple-600">ราคาเช่าเฉลี่ย</span>
                  <div className="text-sm font-bold text-purple-900">
                    {formatCurrency(stats.csvStats.averageRentPrice, true)}
                  </div>
                  <span className="text-xs text-purple-600">/ด.</span>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <span className="text-xs text-orange-600">กริดที่มีข้อมูล</span>
                  <div className="text-lg font-bold text-orange-900">
                    {stats.csvStats.gridsWithData || 0}
                  </div>
                  <span className="text-xs text-orange-600">กริด</span>
                </div>
              </div>
            </div>

            {/* Top House Types */}
            {topHouseTypes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">ประเภทที่อยู่อาศัยยอดนิยม</h3>
                <div className="space-y-2">
                  {topHouseTypes.map((item, index) => (
                    <div key={item.type} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-bold mr-3">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium truncate max-w-32">
                          {item.type}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">
                        {item.count.toLocaleString()} หน่วย
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Statistics */}
            {priceStats && (priceStats.sale.count > 0 || priceStats.rent.count > 0) && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">สถิติราคา</h3>
                <div className="space-y-3">
                  {priceStats.sale.count > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2 flex justify-between items-center">
                        <span>ราคาขาย</span>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                          {priceStats.sale.count} กริด
                        </span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">ต่ำสุด</span>
                          <div className="font-medium">{formatCurrency(priceStats.sale.min, true)}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">สูงสุด</span>
                          <div className="font-medium">{formatCurrency(priceStats.sale.max, true)}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">ค่ากลาง</span>
                          <div className="font-medium">{formatCurrency(priceStats.sale.median, true)}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">Q3 (75%)</span>
                          <div className="font-medium">{formatCurrency(priceStats.sale.q75, true)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {priceStats.rent.count > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800 mb-2 flex justify-between items-center">
                        <span>ราคาเช่า</span>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                          {priceStats.rent.count} กริด
                        </span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">ต่ำสุด</span>
                          <div className="font-medium">{formatCurrency(priceStats.rent.min, true)}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">สูงสุด</span>
                          <div className="font-medium">{formatCurrency(priceStats.rent.max, true)}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">ค่ากลาง</span>
                          <div className="font-medium">{formatCurrency(priceStats.rent.median, true)}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <span className="text-gray-600">Q3 (75%)</span>
                          <div className="font-medium">{formatCurrency(priceStats.rent.q75, true)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Selected Grid Details */}
        {selectedGrid && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">ข้อมูลกริดที่เลือก</h3>
            <div className="bg-blue-50 p-3 rounded-lg space-y-3">
              <div className="border-b border-blue-200 pb-2">
                <div className="text-sm font-semibold text-blue-900">
                  Grid ID: {
                    selectedGrid.FID || 
                    selectedGrid.OBJECTID_1 || 
                    selectedGrid.OBJECTID ||
                    selectedGrid.Grid_Code || 
                    selectedGrid.Grid_CODE || 
                    'ไม่ทราบ'
                  }
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-600 text-xs">ประชากร</span>
                  <div className="font-medium">
                    {selectedGrid.Grid_POP ? Math.round(selectedGrid.Grid_POP).toLocaleString() : 'ไม่มีข้อมูล'} คน
                  </div>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-600 text-xs">ที่อยู่อาศัย</span>
                  <div className="font-medium">
                    {selectedGrid.Grid_House ? Math.round(selectedGrid.Grid_House).toLocaleString() : 'ไม่มีข้อมูล'} หน่วย
                  </div>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-600 text-xs">ระดับความหนาแน่น</span>
                  <div className="font-medium">
                    Class {selectedGrid.Grid_Class || 'ไม่ทราบ'}
                  </div>
                </div>
                <div className="bg-white p-2 rounded">
                  <span className="text-gray-600 text-xs">ความหนาแน่น</span>
                  <div className="font-medium">
                    {selectedGrid.Grid_POP && selectedGrid.Grid_House ? 
                      Math.round(selectedGrid.Grid_POP / selectedGrid.Grid_House * 100) / 100 : 'ไม่ทราบ'} คน/หน่วย
                  </div>
                </div>
              </div>

              {/* Housing Systems for Selected Grid */}
              <div className="border-t border-blue-200 pt-2">
                <span className="text-sm text-blue-800 font-medium">ระบบที่อยู่อาศัยในกริด:</span>
                <div className="mt-1 space-y-1">
                  {[1,2,3,4,5,6,7].map(num => {
                    const count = selectedGrid[`HDS_C${num}_num`] || 0;
                    if (count > 0) {
                      const names = {
                        1: 'ชุมชนแออัด', 2: 'ถือครองชั่วคราว', 3: 'ประชากรแฝง',
                        4: 'ลูกจ้าง', 5: 'รัฐจัดสร้าง', 6: 'รัฐสนับสนุน', 7: 'เอกชน'
                      };
                      return (
                        <div key={num} className="flex justify-between text-xs bg-white p-1 rounded">
                          <span>{names[num]}:</span>
                          <span className="font-medium">{count} หน่วย</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* CSV Data for Selected Grid */}
              {hasCSVData && selectedGrid.csv_totalSupply !== undefined && (
                <div className="border-t border-blue-200 pt-2">
                  <span className="text-sm text-blue-800 font-medium">ข้อมูลอุปทาน:</span>
                  {selectedGrid.csv_totalSupply > 0 ? (
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between text-xs bg-white p-1 rounded">
                        <span>อุปทานรวม:</span>
                        <span className="font-medium">{selectedGrid.csv_totalSupply} หน่วย</span>
                      </div>
                      {selectedGrid.csv_averageSalePrice && (
                        <div className="flex justify-between text-xs bg-white p-1 rounded">
                          <span>ราคาขายเฉลี่ย:</span>
                          <span className="font-medium">{formatCurrency(selectedGrid.csv_averageSalePrice, true)}</span>
                        </div>
                      )}
                      {selectedGrid.csv_averageRentPrice && (
                        <div className="flex justify-between text-xs bg-white p-1 rounded">
                          <span>ราคาเช่าเฉลี่ย:</span>
                          <span className="font-medium">{formatCurrency(selectedGrid.csv_averageRentPrice, true)}/ด.</span>
                        </div>
                      )}
                      {selectedGrid.csv_dominantHouseType && (
                        <div className="flex justify-between text-xs bg-white p-1 rounded">
                          <span>ประเภทหลัก:</span>
                          <span className="font-medium">{selectedGrid.csv_dominantHouseType}</span>
                        </div>
                      )}
                      {selectedGrid.csv_houseTypes && selectedGrid.csv_houseTypes !== '[]' && (
                        <div className="mt-2 bg-white p-2 rounded">
                          <span className="text-xs text-blue-700 font-medium">รายละเอียดประเภท:</span>
                          <div className="mt-1 max-h-20 overflow-y-auto">
                            {JSON.parse(selectedGrid.csv_houseTypes).slice(0, 3).map((type, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="truncate mr-2">{type.type}:</span>
                                <span>{type.supply} หน่วย</span>
                              </div>
                            ))}
                            {JSON.parse(selectedGrid.csv_houseTypes).length > 3 && (
                              <div className="text-xs text-gray-500">...และอื่นๆ</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-gray-500 bg-white p-1 rounded">ไม่มีข้อมูลอุปทาน</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Sources */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">แหล่งข้อมูล</h3>
          <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded">
            <div className="flex items-center">
              <span className="mr-2">🗺️</span>
              <span>ข้อมูล HDS: GeoJSON ({provinceName})</span>
            </div>
            {hasCSVData && (
              <div className="flex items-center">
                <span className="mr-2">📊</span>
                <span>ข้อมูลอุปทาน: CKAN API (Resource: 9cfc5468-36f6-40d3-b76e-febf79e9ca9f)</span>
              </div>
            )}
            <div className="flex items-center">
              <span className="mr-2">🔗</span>
              <span>การเชื่อมโยง: OBJECTID → Grid ID</span>
            </div>
          </div>
        </div>

        {/* Performance Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">ข้อมูลเพื่อการพัฒนา</h3>
            <div className="text-xs text-gray-500 space-y-1 bg-yellow-50 p-3 rounded border border-yellow-200">
              <div>Total Features: {stats.totalGrids}</div>
              {hasCSVData && (
                <>
                  <div>CSV Grids: {Object.keys(csvData || {}).length}</div>
                  <div>Match Rate: {stats.totalGrids > 0 ? 
                    Math.round((Object.keys(csvData || {}).length / stats.totalGrids) * 100) : 0}%
                  </div>
                  <div>CSV Loading: {csvData ? 'Complete' : 'Loading...'}</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HDSStatistics;
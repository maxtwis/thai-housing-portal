import React from 'react';

const HDSFilters = ({ 
  filters, 
  onFilterChange, 
  colorScheme, 
  onColorSchemeChange, 
  selectedGrid, 
  isMobile,
  hasCSVData = false,
  csvData = null
}) => {
  
  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    onFilterChange({ [filterType]: value });
  };

  // Get unique house types from CSV data
  const getHouseTypesFromCSV = () => {
    if (!csvData) return [];
    
    const houseTypes = new Set();
    Object.values(csvData).forEach(gridData => {
      gridData.houseTypes.forEach(type => {
        if (type.type && type.supply > 0) {
          houseTypes.add(type.type);
        }
      });
    });
    
    return Array.from(houseTypes).sort();
  };

  // Color scheme options
  const colorSchemeOptions = [
    { value: 'housingSystem', label: 'ระบบที่อยู่อาศัย', group: 'HDS' },
    { value: 'populationDensity', label: 'ความหนาแน่นประชากร', group: 'HDS' },
    { value: 'housingDensity', label: 'ความหนาแน่นที่อยู่อาศัย', group: 'HDS' },
    { value: 'gridClass', label: 'ระดับความหนาแน่น', group: 'HDS' },
    ...(hasCSVData ? [
      { value: 'csvSupply', label: 'อุปทานที่อยู่อาศัย', group: 'CSV' },
      { value: 'csvSalePrice', label: 'ราคาขาย', group: 'CSV' },
      { value: 'csvRentPrice', label: 'ราคาเช่า', group: 'CSV' },
      { value: 'csvHouseType', label: 'ประเภทที่อยู่อาศัย', group: 'CSV' }
    ] : [])
  ];

  const houseTypes = hasCSVData ? getHouseTypesFromCSV() : [];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-6">
      <div>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-4`}>
          ตัวกรองและการแสดงผล
        </h2>
        
        {/* Color Scheme Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            รูปแบบการแสดงผล
          </label>
          <select
            value={colorScheme}
            onChange={(e) => onColorSchemeChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {colorSchemeOptions.map((option, index, array) => {
              const showGroupHeader = index === 0 || array[index - 1].group !== option.group;
              return (
                <React.Fragment key={option.value}>
                  {showGroupHeader && index > 0 && (
                    <option disabled>---</option>
                  )}
                  <option value={option.value}>
                    {option.group === 'CSV' ? '📊 ' : '🗺️ '}{option.label}
                  </option>
                </React.Fragment>
              );
            })}
          </select>
          {hasCSVData && (
            <p className="text-xs text-blue-600 mt-1">
              📊 = ข้อมูลอุปทานจาก CKAN API
            </p>
          )}
        </div>

        {/* Original HDS Filters */}
        <div className="space-y-4 border-b border-gray-200 pb-4">
          <h3 className="text-sm font-medium text-gray-700">ตัวกรองข้อมูล HDS</h3>
          
          {/* Housing System Filter */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ระบบที่อยู่อาศัย
            </label>
            <select
              value={filters.housingSystem}
              onChange={(e) => handleFilterChange('housingSystem', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="1">ระบบชุมชนแออัด</option>
              <option value="2">ระบบถือครองชั่วคราว</option>
              <option value="3">ระบบประชากรแฝง</option>
              <option value="4">ระบบลูกจ้าง</option>
              <option value="5">ระบบรัฐจัดสร้าง</option>
              <option value="6">ระบบรัฐสนับสนุน</option>
              <option value="7">ระบบเอกชน</option>
            </select>
          </div>

          {/* Density Level Filter */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ระดับความหนาแน่น
            </label>
            <select
              value={filters.densityLevel}
              onChange={(e) => handleFilterChange('densityLevel', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="1">Level 1 (ต่ำสุด)</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
              <option value="6">Level 6</option>
              <option value="7">Level 7</option>
              <option value="8">Level 8</option>
              <option value="9">Level 9 (สูงสุด)</option>
            </select>
          </div>

          {/* Population Range Filter */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ช่วงประชากร
            </label>
            <select
              value={filters.populationRange}
              onChange={(e) => handleFilterChange('populationRange', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="0-50">0-50 คน</option>
              <option value="51-100">51-100 คน</option>
              <option value="101-200">101-200 คน</option>
              <option value="201-400">201-400 คน</option>
              <option value="401">400+ คน</option>
            </select>
          </div>
        </div>

        {/* CSV Data Filters */}
        {hasCSVData && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              ตัวกรองข้อมูลอุปทาน
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                สงขลา
              </span>
            </h3>
            
            {/* Supply Range Filter */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                ช่วงอุปทาน
              </label>
              <select
                value={filters.supplyRange}
                onChange={(e) => handleFilterChange('supplyRange', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="1-5">1-5 หน่วย</option>
                <option value="6-15">6-15 หน่วย</option>
                <option value="16-30">16-30 หน่วย</option>
                <option value="31-50">31-50 หน่วย</option>
                <option value="51">50+ หน่วย</option>
              </select>
            </div>

            {/* House Type Filter */}
            {houseTypes.length > 0 && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  ประเภทที่อยู่อาศัย
                </label>
                <select
                  value={filters.houseType}
                  onChange={(e) => handleFilterChange('houseType', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">ทั้งหมด</option>
                  {houseTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                ช่วงราคาขาย
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="0-1500000">น้อยกว่า 1.5 ล้านบาท</option>
                <option value="1500000-3000000">1.5-3 ล้านบาท</option>
                <option value="3000000-5000000">3-5 ล้านบาท</option>
                <option value="5000000-8000000">5-8 ล้านบาท</option>
                <option value="8000000-12000000">8-12 ล้านบาท</option>
                <option value="12000000">มากกว่า 12 ล้านบาท</option>
              </select>
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => onFilterChange({
              housingSystem: 'all',
              densityLevel: 'all',
              populationRange: 'all',
              supplyRange: 'all',
              houseType: 'all',
              priceRange: 'all'
            })}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded text-sm transition-colors"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      </div>

      {/* Selected Grid Information */}
      {selectedGrid && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">ข้อมูลกริดที่เลือก</h3>
          <div className="bg-blue-50 p-3 rounded text-sm space-y-1">
            <div>
              <span className="font-medium">Grid ID:</span> {
                selectedGrid.FID || 
                selectedGrid.OBJECTID_1 || 
                selectedGrid.OBJECTID ||
                selectedGrid.Grid_Code || 
                selectedGrid.Grid_CODE || 
                'ไม่ทราบ'
              }
            </div>
            <div>
              <span className="font-medium">ประชากร:</span> {
                selectedGrid.Grid_POP ? Math.round(selectedGrid.Grid_POP).toLocaleString() : 'ไม่มีข้อมูล'
              } คน
            </div>
            <div>
              <span className="font-medium">ที่อยู่อาศัย:</span> {
                selectedGrid.Grid_House ? Math.round(selectedGrid.Grid_House).toLocaleString() : 'ไม่มีข้อมูล'
              } หน่วย
            </div>
            <div>
              <span className="font-medium">ระดับความหนาแน่น:</span> Class {selectedGrid.Grid_Class || 'ไม่ทราบ'}
            </div>
            
            {/* Housing Systems for Selected Grid */}
            <div className="border-t border-blue-200 pt-2 mt-2">
              <div className="text-xs font-medium text-blue-800 mb-1">ระบบที่อยู่อาศัย:</div>
              <div className="space-y-1">
                {[1,2,3,4,5,6,7].map(num => {
                  const count = selectedGrid[`HDS_C${num}_num`] || 0;
                  if (count > 0) {
                    const names = {
                      1: 'ชุมชนแออัด', 2: 'ถือครองชั่วคราว', 3: 'ประชากรแฝง',
                      4: 'ลูกจ้าง', 5: 'รัฐจัดสร้าง', 6: 'รัฐสนับสนุน', 7: 'เอกชน'
                    };
                    return (
                      <div key={num} className="flex justify-between text-xs">
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
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="text-xs font-medium text-blue-800 mb-1">ข้อมูลอุปทาน:</div>
                {selectedGrid.csv_totalSupply > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>อุปทาน:</span>
                      <span className="font-medium">{selectedGrid.csv_totalSupply} หน่วย</span>
                    </div>
                    {selectedGrid.csv_averageSalePrice && (
                      <div className="flex justify-between text-xs">
                        <span>ราคาขายเฉลี่ย:</span>
                        <span className="font-medium">฿{Math.round(selectedGrid.csv_averageSalePrice).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedGrid.csv_averageRentPrice && (
                      <div className="flex justify-between text-xs">
                        <span>ราคาเช่าเฉลี่ย:</span>
                        <span className="font-medium">฿{Math.round(selectedGrid.csv_averageRentPrice).toLocaleString()}/เดือน</span>
                      </div>
                    )}
                    {selectedGrid.csv_dominantHouseType && (
                      <div className="flex justify-between text-xs">
                        <span>ประเภทหลัก:</span>
                        <span className="font-medium">{selectedGrid.csv_dominantHouseType}</span>
                      </div>
                    )}
                    {selectedGrid.csv_houseTypes && selectedGrid.csv_houseTypes !== '[]' && (
                      <div className="mt-1">
                        <span className="text-xs text-blue-700">รายละเอียดประเภท:</span>
                        <div className="mt-1 max-h-16 overflow-y-auto">
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
                  <div className="text-xs text-gray-500">ไม่มีข้อมูลอุปทาน</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSV Data Summary */}
      {hasCSVData && csvData && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">สรุปข้อมูลอุปทาน</h3>
          <div className="bg-green-50 p-3 rounded text-sm space-y-1">
            <div className="flex justify-between">
              <span>กริดที่มีข้อมูล:</span>
              <span className="font-medium">{Object.keys(csvData).length} กริด</span>
            </div>
            <div className="flex justify-between">
              <span>อุปทานรวม:</span>
              <span className="font-medium">
                {Object.values(csvData).reduce((sum, grid) => sum + grid.totalSupply, 0).toLocaleString()} หน่วย
              </span>
            </div>
            <div className="flex justify-between">
              <span>ราคาขายเฉลี่ย:</span>
              <span className="font-medium">
                ฿{Math.round(
                  Object.values(csvData)
                    .filter(grid => grid.averageSalePrice > 0)
                    .reduce((sum, grid, _, arr) => sum + grid.averageSalePrice / arr.length, 0)
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>ประเภทยอดนิยม:</span>
              <span className="font-medium text-xs">
                {(() => {
                  const typeStats = {};
                  Object.values(csvData).forEach(grid => {
                    grid.houseTypes.forEach(type => {
                      if (!typeStats[type.type]) typeStats[type.type] = 0;
                      typeStats[type.type] += type.supply;
                    });
                  });
                  const topType = Object.entries(typeStats).sort(([,a], [,b]) => b - a)[0];
                  return topType ? topType[0] : 'ไม่มีข้อมูล';
                })()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Status Indicator */}
      {Object.values(filters).some(filter => filter !== 'all') && (
        <div className="border-t border-gray-200 pt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
            <div className="flex items-center">
              <span className="text-yellow-600 text-sm">🔍</span>
              <span className="text-sm text-yellow-800 ml-2">
                ตัวกรองกำลังใช้งาน - แสดงข้อมูลที่กรองแล้ว
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HDSFilters;
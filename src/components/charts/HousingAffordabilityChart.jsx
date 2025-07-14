import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ExportButton from '../ExportButton';
import { useHousingAffordabilityData, useDistrictsData } from '../../hooks/useCkanQueries';

const HousingAffordabilityChart = ({ provinceName, provinceId }) => {
  const [selectedDemandType, setSelectedDemandType] = useState('ผู้มีรายได้น้อย');
  const [selectedMetric, setSelectedMetric] = useState('Total_Hburden');
  const [dataLevel, setDataLevel] = useState('province'); // 'province' or 'district'
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  
  // Get districts data for the province
  const { data: districtsData, isLoading: districtsLoading } = useDistrictsData(provinceId);
  
  // Check if province has district-level data available
  const hasDistrictData = districtsData && districtsData.length > 0;
  
  // Use React Query for data fetching with level and district support
  const { 
    data: rawData, 
    isLoading, 
    error,
    isFetching
  } = useHousingAffordabilityData(provinceId, dataLevel, selectedDistrict);

  // Auto-select first district when switching to district level
  React.useEffect(() => {
    if (dataLevel === 'district' && hasDistrictData && !selectedDistrict) {
      setSelectedDistrict(districtsData[0].id);
    }
  }, [dataLevel, hasDistrictData, selectedDistrict, districtsData]);

  // House type mapping - completely different for province vs district
  const getHouseTypeMapping = () => {
    if (dataLevel === 'province') {
      // Province uses numeric IDs (1-5)
      return {
        1: 'บ้านเดี่ยว',
        2: 'ห้องแถว',
        3: 'ตึกแถว/ทาวน์เฮาส์',
        4: 'แฟลต/อพาร์ทเม้นท์/คอนโดมิเนี่ยม',
        5: 'ห้องแบ่งเช่า'
      };
    } else {
      // District uses Thai names directly
      return {
        'ห้องแถว/ตึกแถว': 'ห้องแถว/ตึกแถว',
        'ทาวน์เฮ้าส์/ทาวโฮม': 'ทาวน์เฮ้าส์/ทาวโฮม',
        'บ้านเดี่ยว': 'บ้านเดี่ยว',
        'ตึกแถวพาณิชย์': 'ตึกแถวพาณิชย์',
        'หอพัก/แฟลต/อพาร์ทเมนต์': 'หอพัก/แฟลต/อพาร์ทเมนต์'
      };
    }
  };

  // Color mapping - different keys for province vs district
  const getHouseTypeColors = () => {
    if (dataLevel === 'province') {
      return {
        1: '#3B82F6', // Blue
        2: '#10B981', // Green
        3: '#F59E0B', // Yellow
        4: '#EF4444', // Red
        5: '#8B5CF6'  // Purple
      };
    } else {
      return {
        'ห้องแถว/ตึกแถว': '#3B82F6', // Blue
        'ทาวน์เฮ้าส์/ทาวโฮม': '#10B981', // Green
        'บ้านเดี่ยว': '#F59E0B', // Yellow
        'ตึกแถวพาณิชย์': '#EF4444', // Red
        'หอพัก/แฟลต/อพาร์ทเมนต์': '#8B5CF6'  // Purple
      };
    }
  };

  const houseTypeMapping = getHouseTypeMapping();
  const houseTypeColors = getHouseTypeColors();

  // Get available demand types based on actual data
  const availableDemandTypes = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return demandTypes; // Return all if no data yet
    }
    
    // Get unique demand types from the actual data
    const availableTypes = [...new Set(rawData.records.map(record => record.demand_type))]
      .filter(Boolean);
    
    // Return only demand types that exist in the data and are in our predefined list
    return demandTypes.filter(type => availableTypes.includes(type));
  }, [rawData, demandTypes]);

  // Get available quintiles based on actual data  
  const availableQuintiles = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [0, 1, 2, 3, 4, 5]; // Return all if no data yet
    }
    
    // Get unique quintiles from the actual data
    const availableQuints = [...new Set(rawData.records.map(record => parseInt(record.Quintile)))]
      .filter(q => !isNaN(q))
      .sort((a, b) => a - b);
    
    return availableQuints;
  }, [rawData]);

  // Auto-adjust selected demand type if current selection is not available
  React.useEffect(() => {
    if (availableDemandTypes.length > 0 && !availableDemandTypes.includes(selectedDemandType)) {
      console.log(`Selected demand type "${selectedDemandType}" not available, switching to "${availableDemandTypes[0]}"`);
      setSelectedDemandType(availableDemandTypes[0]);
    }
  }, [availableDemandTypes, selectedDemandType]);
  
  // Available metrics (updated for district data)
  const metrics = {
    'Total_Hburden': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัยรวม (%)',
    'Exp_house': 'ค่าใช้จ่ายที่อยู่อาศัย (บาท)'
  };

  // Process data for chart - completely different logic for province vs district
  const chartData = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [];
    }

    // Filter by selected demand type
    const filteredData = rawData.records.filter(item => 
      item.demand_type === selectedDemandType
    );

    console.log('Filtered data:', filteredData);
    console.log('Data level:', dataLevel);

    // Group by quintile (handle quintile 0 as "ไม่ระบุรายได้")
    const groupedByQuintile = {};
    
    // Initialize quintiles based on available data only
    for (let q of availableQuintiles) {
      const quintileLabel = q === 0 ? 'ไม่ระบุรายได้' : `Q${q}`;
      groupedByQuintile[q] = {
        quintile: quintileLabel,
        quintileNumber: q
      };
      
      // Initialize house types based on data level
      Object.keys(houseTypeMapping).forEach(houseTypeKey => {
        groupedByQuintile[q][houseTypeMapping[houseTypeKey]] = 0;
      });
    }

    // Process the data - different logic for province vs district
    filteredData.forEach(item => {
      const quintile = parseInt(item.Quintile);
      let houseTypeKey, houseTypeName;
      
      if (dataLevel === 'province') {
        // Province data: house_type is numeric (1-5)
        houseTypeKey = parseInt(item.house_type);
        houseTypeName = houseTypeMapping[houseTypeKey];
      } else {
        // District data: House_type is Thai name
        houseTypeKey = item.House_type;
        houseTypeName = houseTypeMapping[houseTypeKey];
      }
      
      const value = parseFloat(item[selectedMetric]);
      
      console.log('Processing item:', {
        quintile,
        houseTypeKey,
        houseTypeName,
        value,
        dataLevel
      });
      
      if (quintile >= 0 && quintile <= 5 && 
          availableQuintiles.includes(quintile) && // Only process quintiles that exist in data
          houseTypeName && 
          !isNaN(value) && value !== null && value !== undefined) {
        groupedByQuintile[quintile][houseTypeName] = value;
      }
    });

    // Convert to array and sort by quintile (only available quintiles)
    const result = Object.values(groupedByQuintile).sort((a, b) => a.quintileNumber - b.quintileNumber);
    console.log('Final chart data:', result);
    console.log('Available quintiles used:', availableQuintiles);
    return result;
  }, [rawData, selectedDemandType, selectedMetric, houseTypeMapping, dataLevel, availableQuintiles]);

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Filter out zero values for cleaner tooltip
      const nonZeroPayload = payload.filter(entry => entry.value > 0);
      
      if (nonZeroPayload.length === 0) return null;

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">{label}</h4>
          <p className="text-xs text-gray-600 mb-2">
            {selectedDemandType} • {metrics[selectedMetric]}
            {dataLevel === 'district' && selectedDistrict && (
              <span className="ml-1">• {selectedDistrict}</span>
            )}
          </p>
          {nonZeroPayload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-600">{entry.dataKey}:</span>
              <span className="font-medium">
                {selectedMetric === 'Total_Hburden' 
                  ? `${entry.value}%` 
                  : `${entry.value.toLocaleString()} บาท`
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (isLoading || districtsLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
        </div>
      </div>
    );
  }

  const currentDistrictName = selectedDistrict; // District name is now used directly as ID

  const chartTitle = dataLevel === 'district' && currentDistrictName 
    ? `ความสามารถในการจ่ายค่าที่อยู่อาศัยตามกลุ่มรายได้ (${currentDistrictName})`
    : 'ความสามารถในการจ่ายค่าที่อยู่อาศัยตามกลุ่มรายได้';

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-800">
            {chartTitle}
          </h2>
          <ExportButton 
            data={chartData} 
            filename={`affordability_${provinceName}_${selectedDemandType}_${dataLevel}${currentDistrictName ? `_${currentDistrictName}` : ''}`} 
          />
        </div>
        
        {/* Controls */}
        <div className="space-y-3">
          {/* First Row: Data Level and District */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Data Level Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                ระดับข้อมูล:
              </label>
              <select
                value={dataLevel}
                onChange={(e) => {
                  setDataLevel(e.target.value);
                  if (e.target.value === 'province') {
                    setSelectedDistrict(null);
                  }
                }}
                className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 flex-1"
              >
                <option value="province">จังหวัด</option>
                {hasDistrictData && <option value="district">อำเภอ/เขต</option>}
              </select>
            </div>

            {/* District Selector (only show when district level is selected) */}
            {dataLevel === 'district' && hasDistrictData && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  อำเภอ/เขต:
                </label>
                <select
                  value={selectedDistrict || ''}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 flex-1"
                >
                  {districtsData.map(district => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Second Row: Demand Type and Metric */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Demand Type Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                กลุ่มผู้มีความต้องการ:
              </label>
              <select
                value={selectedDemandType}
                onChange={(e) => setSelectedDemandType(e.target.value)}
                className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 flex-1"
              >
                {availableDemandTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* Metric Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                ตัวชี้วัด:
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 flex-1"
              >
                {Object.entries(metrics).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading indicator for data fetching */}
        {isFetching && (
          <div className="mt-2 text-xs text-blue-600">
            🔄 กำลังอัปเดตข้อมูล...
          </div>
        )}

        {/* Data availability info */}
        {availableDemandTypes.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            กลุ่มข้อมูลที่มี: {availableDemandTypes.join(', ')} 
            {availableQuintiles.length > 0 && (
              <span className="ml-2">
                | กลุ่มรายได้: {availableQuintiles.map(q => q === 0 ? 'ไม่ระบุ' : `Q${q}`).join(', ')}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="px-2 py-1">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="quintile" 
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                fontSize={10}
                label={{ 
                  value: selectedMetric === 'Total_Hburden' ? '%' : 'บาท', 
                  angle: -90, 
                  position: 'insideLeft' 
                }}
              />
              <Tooltip content={customTooltip} />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
                iconType="rect"
              />
              
              {/* Create stacked bars for each house type - different iteration for province vs district */}
              {Object.entries(houseTypeMapping).map(([houseTypeKey, houseTypeName]) => (
                <Bar 
                  key={houseTypeKey}
                  dataKey={houseTypeName}
                  name={houseTypeName}
                  stackId="housing"
                  fill={houseTypeColors[houseTypeKey]}
                  radius={Object.keys(houseTypeMapping).indexOf(houseTypeKey) === Object.keys(houseTypeMapping).length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 text-center">
              {isFetching ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  กำลังโหลดข้อมูล...
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📊</div>
                  ไม่มีข้อมูลสำหรับการเลือกนี้
                  <div className="text-xs mt-2 text-gray-400">
                    ลองเปลี่ยนกลุ่มผู้มีความต้องการ หรือตัวชี้วัด
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Data Source Information */}
      <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <span>
            แหล่งข้อมูล: {dataLevel === 'district' ? 'ข้อมูลสำรวจระดับอำเภอ' : 'ข้อมูลระดับจังหวัด'}
          </span>
          {chartData.length > 0 && (
            <span>
              จำนวนข้อมูล: {chartData.filter(item => 
                Object.values(houseTypeMapping).some(houseType => item[houseType] > 0)
              ).length} กลุ่ม
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousingAffordabilityChart;
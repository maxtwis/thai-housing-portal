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

  // House type mapping (updated for district data compatibility)
  const houseTypeMapping = {
    1: 'บ้านเดี่ยว',
    2: 'ห้องแถว/ตึกแถว',
    3: 'ทาวน์เฮ้าส์/ทาวโฮม',
    4: 'หอพัก/แฟลต/อพาร์ทเมนต์',
    5: 'ตึกแถวพาณิชย์'
  };

  // Color mapping for house types
  const houseTypeColors = {
    1: '#3B82F6', // Blue
    2: '#10B981', // Green
    3: '#F59E0B', // Yellow
    4: '#EF4444', // Red
    5: '#8B5CF6'  // Purple
  };

  // Available demand types
  const demandTypes = ['ผู้มีรายได้น้อย', 'First Jobber', 'ผู้สูงอายุที่อาศัยอยู่คนเดียว'];
  
  // Available metrics (updated for district data)
  const metrics = {
    'Total_Hburden': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัยรวม (%)',
    'Exp_house': 'ค่าใช้จ่ายที่อยู่อาศัย (บาท)'
  };

  // Process data for chart
  const chartData = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [];
    }

    // Filter by selected demand type
    const filteredData = rawData.records.filter(item => 
      item.demand_type === selectedDemandType
    );

    // Group by quintile (handle quintile 0 as "ไม่ระบุรายได้")
    const groupedByQuintile = {};
    
    // Initialize quintiles Q0-Q5 (Q0 for "ไม่ระบุรายได้")
    for (let q = 0; q <= 5; q++) {
      const quintileLabel = q === 0 ? 'ไม่ระบุรายได้' : `Q${q}`;
      groupedByQuintile[q] = {
        quintile: quintileLabel,
        quintileNumber: q
      };
      
      // Initialize house types
      Object.keys(houseTypeMapping).forEach(houseTypeId => {
        groupedByQuintile[q][houseTypeMapping[houseTypeId]] = 0;
      });
    }

    // Process the data
    filteredData.forEach(item => {
      const quintile = parseInt(item.Quintile);
      const houseType = parseInt(item.house_type);
      const value = parseFloat(item[selectedMetric]);
      
      if (quintile >= 0 && quintile <= 5 && 
          houseTypeMapping[houseType] && 
          !isNaN(value) && value !== null && value !== undefined) {
        groupedByQuintile[quintile][houseTypeMapping[houseType]] = value;
      }
    });

    // Convert to array and sort by quintile (Q0 first, then Q1-Q5)
    return Object.values(groupedByQuintile).sort((a, b) => a.quintileNumber - b.quintileNumber);
  }, [rawData, selectedDemandType, selectedMetric, houseTypeMapping]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
              {demandTypes.map(type => (
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

        {/* Data Level Indicator */}
        {dataLevel === 'district' && currentDistrictName && (
          <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            📍 แสดงข้อมูลระดับอำเภอ: {currentDistrictName}
          </div>
        )}
        
        {/* Loading indicator for data fetching */}
        {isFetching && (
          <div className="mt-2 text-xs text-blue-600">
            🔄 กำลังอัปเดตข้อมูล...
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
              
              {/* Create stacked bars for each house type */}
              {Object.entries(houseTypeMapping).map(([houseTypeId, houseTypeName]) => (
                <Bar 
                  key={houseTypeId}
                  dataKey={houseTypeName}
                  name={houseTypeName}
                  stackId="housing"
                  fill={houseTypeColors[houseTypeId]}
                  radius={houseTypeId === '5' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
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
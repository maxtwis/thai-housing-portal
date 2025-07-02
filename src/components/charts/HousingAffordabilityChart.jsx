import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ExportButton from '../ExportButton';
import { useHousingAffordabilityData } from '../../hooks/useCkanQueries';

const HousingAffordabilityChart = ({ provinceName, provinceId }) => {
  const [selectedDemandType, setSelectedDemandType] = useState('ผู้มีรายได้น้อย');
  const [selectedMetric, setSelectedMetric] = useState('Total_Hburden');
  
  // Use React Query for data fetching
  const { 
    data: rawData, 
    isLoading, 
    error,
    isFetching
  } = useHousingAffordabilityData(provinceId);

  // House type mapping (excluding type 6 as requested)
  const houseTypeMapping = {
    1: 'บ้านเดี่ยว',
    2: 'ห้องแถว',
    3: 'ตึกแถว/ทาวน์เฮาส์',
    4: 'แฟลต/อพาร์ทเม้นท์/คอนโดมิเนี่ยม',
    5: 'ห้องแบ่งเช่า'
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
  
  // Available metrics
  const metrics = {
    'Total_Hburden': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัยรวม',
    'Exp_hbrent': 'อัตราส่วนค่าเช่าต่อรายได้',
    'Exp_hbmort': 'อัตราส่วนค่างวดต่อรายได้'
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

    // Group by quintile
    const groupedByQuintile = {};
    
    // Initialize quintiles Q1-Q5
    for (let q = 1; q <= 5; q++) {
      groupedByQuintile[q] = {
        quintile: `Q${q}`,
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
      
      if (quintile >= 1 && quintile <= 5 && 
          houseTypeMapping[houseType] && 
          !isNaN(value) && value !== null) {
        groupedByQuintile[quintile][houseTypeMapping[houseType]] = value;
      }
    });

    // Convert to array and sort by quintile
    return Object.values(groupedByQuintile).sort((a, b) => a.quintileNumber - b.quintileNumber);
  }, [rawData, selectedDemandType, selectedMetric]);

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">{label}</h4>
          <p className="text-xs text-gray-600 mb-2">{selectedDemandType} • {metrics[selectedMetric]}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-600">{entry.dataKey}:</span>
              <span className="font-medium">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">ความสามารถในการจ่ายค่าที่อยู่อาศัยตามกลุ่มรายได้</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลความสามารถในการจ่าย...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">ความสามารถในการจ่ายค่าที่อยู่อาศัยตามกลุ่มรายได้</h2>
            <ExportButton data={[]} filename={`affordability_${provinceName}`} />
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-gray-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
            <p className="text-xs text-gray-500 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-800">ความสามารถในการจ่ายค่าที่อยู่อาศัยตามกลุ่มรายได้</h2>
          <ExportButton data={chartData} filename={`affordability_${provinceName}_${selectedDemandType}`} />
        </div>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700">
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
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700">
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
              />
              <YAxis 
                fontSize={10}
                label={{ value: '%', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={customTooltip} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              
              {/* Create stacked bars for each house type */}
              {Object.entries(houseTypeMapping).map(([houseTypeId, houseTypeName]) => (
                <Bar 
                  key={houseTypeId}
                  dataKey={houseTypeName}
                  name={houseTypeName}
                  stackId="housing"
                  fill={houseTypeColors[houseTypeId]}
                  radius={houseTypeId === '5' ? [2, 2, 0, 0] : [0, 0, 0, 0]} // Only round the top of the last stack
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-gray-400 mb-2">📊</div>
              <p className="text-sm">ไม่มีข้อมูลสำหรับ {selectedDemandType}</p>
              <p className="text-xs text-gray-400 mt-1">ลองเลือกกลุ่มผู้มีความต้องการอื่น</p>
            </div>
          </div>
        )}
        
        {/* Loading indicator for background updates */}
        {isFetching && !isLoading && (
          <div className="text-xs text-blue-600 mt-2 px-1">
            🔄 กำลังอัปเดตข้อมูล...
          </div>
        )}
      </div>
    </div>
  );
};

export default HousingAffordabilityChart;
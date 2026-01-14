import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ExportButton from '../ExportButton';
import { useHousingAffordabilityData, useDistrictsData } from '../../hooks/useCkanQueries';
import { useLocalAffordabilityData, useIncomeRankLabels } from '../../hooks/useLocalAffordabilityData';

// Configuration: Set to true to use local CSV data instead of CKAN API
const USE_LOCAL_DATA = true;

const HousingAffordabilityChart = ({ provinceName, provinceId }) => {
  const [selectedDemandType, setSelectedDemandType] = useState('กลุ่มประชากรทั่วไป'); // Default for local data
  const [selectedMetric, setSelectedMetric] = useState('Total_Hburden');
  const [dataLevel, setDataLevel] = useState('province'); // 'province' or 'district'
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Use local CSV data or CKAN API based on configuration
  const localDataQuery = useLocalAffordabilityData(provinceId);
  const ckanDataQuery = useHousingAffordabilityData(provinceId, dataLevel, selectedDistrict);
  const { data: districtsData, isLoading: districtsLoading } = useDistrictsData(provinceId);

  // Load income rank labels for legend
  const { data: incomeRankLabels } = useIncomeRankLabels();

  // Select data source based on configuration
  const dataQuery = USE_LOCAL_DATA ? localDataQuery : ckanDataQuery;
  const { data: rawData, isLoading, error, isFetching } = dataQuery;

  // Check if province has district-level data available (only for CKAN mode)
  const hasDistrictData = !USE_LOCAL_DATA && districtsData && districtsData.length > 0;

  // Auto-select first district when switching to district level
  React.useEffect(() => {
    if (dataLevel === 'district' && hasDistrictData && !selectedDistrict) {
      setSelectedDistrict(districtsData[0].id);
    }
  }, [dataLevel, hasDistrictData, selectedDistrict, districtsData]);

  // Available demand types (define before useMemo) - moved กลุ่มประชากรทั่วไป to top
  const demandTypes = [
    'กลุ่มประชากรทั่วไป',
    'ผู้มีรายได้น้อย', 
    'First Jobber', 
    'ผู้สูงอายุที่อาศัยอยู่คนเดียว'
  ];
  
  // Available metrics (updated to include all three metrics)
  const metrics = {
    'Total_Hburden': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัยรวม (%)',
    'Exp_hbrent': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัย เช่า (%)',
    'Exp_hbmort': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัย ผ่อน (%)',
    'Exp_house': 'ค่าใช้จ่ายที่อยู่อาศัย (บาท)'
  };

  // Get available metrics based on data level and data source
  const getAvailableMetrics = () => {
    if (USE_LOCAL_DATA) {
      // Local CSV data has all three burden metrics
      return {
        'Total_Hburden': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัยรวม (%)',
        'Exp_hbrent': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัย เช่า (%)',
        'Exp_hbmort': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัย ผ่อน (%)'
      };
    } else if (dataLevel === 'province') {
      // CKAN Province level only has Total_Hburden (no rent/mortgage breakdown)
      return {
        'Total_Hburden': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัยรวม (%)'
      };
    } else {
      // CKAN District level has all metrics including rent and mortgage breakdown
      return metrics;
    }
  };

  const availableMetrics = getAvailableMetrics();

  // House type mapping - different for local data, CKAN province, and CKAN district
  const getHouseTypeMapping = () => {
    if (USE_LOCAL_DATA) {
      // Local CSV data uses Thai house type names directly
      return {
        'บ้านเดี่ยว': 'บ้านเดี่ยว',
        'ตึกแถว': 'ตึกแถว',
        'ทาวน์เฮาส์/บ้านแฝด': 'ทาวน์เฮาส์/บ้านแฝด',
        'แฟลต อาคารชุด อพาร์ตเมนต์': 'แฟลต อาคารชุด อพาร์ตเมนต์',
        'ห้องแบ่งเช่า': 'ห้องแบ่งเช่า',
        'ที่พักกึ่งถาวร': 'ที่พักกึ่งถาวร'
      };
    } else if (dataLevel === 'province') {
      // CKAN Province uses numeric IDs (1-5)
      return {
        1: 'บ้านเดี่ยว',
        2: 'ห้องแถว',
        3: 'ตึกแถว/ทาวน์เฮาส์',
        4: 'แฟลต/อพาร์ทเม้นท์/คอนโดมิเนี่ยม',
        5: 'ห้องแบ่งเช่า'
      };
    } else {
      // CKAN District uses Thai names directly
      return {
        'ห้องแถว/ตึกแถว': 'ห้องแถว/ตึกแถว',
        'ทาวน์เฮ้าส์/ทาวโฮม': 'ทาวน์เฮ้าส์/ทาวโฮม',
        'บ้านเดี่ยว': 'บ้านเดี่ยว',
        'ตึกแถวพาณิชย์': 'ตึกแถวพาณิชย์',
        'หอพัก/แฟลต/อพาร์ทเมนต์': 'หอพัก/แฟลต/อพาร์ทเมนต์'
      };
    }
  };

  // Color mapping - different keys for local data, CKAN province, and CKAN district
  const getHouseTypeColors = () => {
    if (USE_LOCAL_DATA) {
      return {
        'บ้านเดี่ยว': '#3B82F6', // Blue
        'ตึกแถว': '#10B981', // Green
        'ทาวน์เฮาส์/บ้านแฝด': '#F59E0B', // Yellow
        'แฟลต อาคารชุด อพาร์ตเมนต์': '#EF4444', // Red
        'ห้องแบ่งเช่า': '#8B5CF6', // Purple
        'ที่พักกึ่งถาวร': '#EC4899'  // Pink
      };
    } else if (dataLevel === 'province') {
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
    
    console.log('Available demand types in data:', availableTypes);
    
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
    
    console.log('Available quintiles in data:', availableQuints);
    return availableQuints;
  }, [rawData]);

  // Auto-adjust selected demand type if current selection is not available
  React.useEffect(() => {
    if (availableDemandTypes.length > 0 && !availableDemandTypes.includes(selectedDemandType)) {
      console.log(`Selected demand type "${selectedDemandType}" not available, switching to "${availableDemandTypes[0]}"`);
      setSelectedDemandType(availableDemandTypes[0]);
    }
  }, [availableDemandTypes, selectedDemandType]);

  // Auto-adjust selected metric if current selection is not available when switching levels
  React.useEffect(() => {
    const currentAvailableMetrics = Object.keys(getAvailableMetrics());
    if (!currentAvailableMetrics.includes(selectedMetric)) {
      console.log(`Selected metric "${selectedMetric}" not available for ${dataLevel} level, switching to "${currentAvailableMetrics[0]}"`);
      setSelectedMetric(currentAvailableMetrics[0]);
    }
  }, [dataLevel, selectedMetric]);

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

    // Process the data - different logic for local data, CKAN province, and CKAN district
    filteredData.forEach(item => {
      const quintile = parseInt(item.Quintile);
      let houseTypeKey, houseTypeName;

      if (USE_LOCAL_DATA) {
        // Local CSV data: house_type is Thai name directly
        houseTypeKey = item.house_type;
        houseTypeName = houseTypeMapping[houseTypeKey];
      } else if (dataLevel === 'province') {
        // CKAN Province data: house_type is numeric (1-5)
        houseTypeKey = parseInt(item.house_type);
        houseTypeName = houseTypeMapping[houseTypeKey];
      } else {
        // CKAN District data: House_type is Thai name
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
            {selectedDemandType} • {availableMetrics[selectedMetric]}
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
                {selectedMetric === 'Exp_house' 
                  ? `${entry.value.toLocaleString()} บาท`
                  : `${entry.value}%`
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {chartTitle}
            </h2>
            <p className="text-xs text-gray-600">
              {provinceName} • {selectedDemandType}
            </p>
          </div>
          <ExportButton
            data={chartData}
            filename={`affordability_${provinceName}_${selectedDemandType}_${dataLevel}${currentDistrictName ? `_${currentDistrictName}` : ''}`}
          />
        </div>
        
        {/* Controls */}
        <div className="space-y-3">
          {/* First Row: Data Level and District - Only show for CKAN mode */}
          {!USE_LOCAL_DATA && (
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
          )}

          {/* Second Row: Demand Type and Metric */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Demand Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                กลุ่มผู้มีความต้องการ
              </label>
              <select
                value={selectedDemandType}
                onChange={(e) => setSelectedDemandType(e.target.value)}
                className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
              >
                {availableDemandTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Metric Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                ตัวชี้วัด
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
              >
                {Object.entries(availableMetrics).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading indicator for data fetching */}
        {isFetching && (
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังอัปเดตข้อมูล...
          </div>
        )}
      </div>

      <div className="px-4 py-4">
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
                  value: selectedMetric === 'Exp_house' ? 'บาท' : '%', 
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

      {/* Income Rank Legend - Show when using local data */}
      {USE_LOCAL_DATA && incomeRankLabels && (
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-sm font-bold text-blue-900">
              คำอธิบายกลุ่มรายได้ (Income Quintiles)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(incomeRankLabels).map(([id, label]) => (
              <div key={id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white font-bold rounded-full text-sm">
                  Q{id}
                </div>
                <span className="text-sm text-gray-700 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Source Information */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">
              แหล่งข้อมูล: {USE_LOCAL_DATA
                ? 'การสำรวจภาวะเศรษฐกิจและสังคมของครัวเรือน พ.ศ. 2566 สำนักงานสถิติแห่งชาติ'
                : (dataLevel === 'district' ? 'ข้อมูลสำรวจระดับอำเภอ' : 'ข้อมูลระดับจังหวัด')}
            </span>
          </div>
          {chartData.length > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium">
                จำนวนข้อมูล: {chartData.filter(item =>
                  Object.values(houseTypeMapping).some(houseType => item[houseType] > 0)
                ).length} กลุ่ม
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousingAffordabilityChart;
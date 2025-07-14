import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import ExportButton from '../ExportButton';
import { useHousingDemandData } from '../../hooks/useCkanQueries';

const HousingDemandChart = ({ provinceName, provinceId }) => {
  const [selectedQuintile, setSelectedQuintile] = useState('all');
  const [selectedView, setSelectedView] = useState('transition'); // 'transition', 'financing', 'affordability'
  
  // Use React Query for data fetching
  const { 
    data: rawData, 
    isLoading, 
    error,
    isFetching
  } = useHousingDemandData(provinceId);

  // House type mapping for cleaner display
  const houseTypeMapping = {
    'ทาวน์เฮ้าส์/ทาวโฮม': 'ทาวน์เฮาส์',
    'บ้านเดี่ยว/บ้านแฝด': 'บ้านเดี่ยว',
    'ห้องแถว/ตึกแถว': 'ห้องแถว',
    'หอพัก/แฟลต/อพาร์ทเมนต์': 'อพาร์ทเมนต์',
    'ตึกแถวพาณิชย์': 'ตึกแถวพาณิชย์',
    'อาคารชุด (คอนโดมิเนียม)': 'คอนโด',
    'อาคารชุด/คอนโด': 'คอนโด',
    'ที่อยู่อาศัยลักษณะอื่นๆ': 'อื่นๆ',
    'ไม่ระบุ': 'ไม่ระบุ'
  };

  // Color palette for different house types
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  // Available quintiles
  const quintiles = [
    { value: 'all', label: 'ทุกกลุ่ม' },
    { value: '1', label: 'กลุ่มที่ 1 (รายได้ต่ำสุด)' },
    { value: '2', label: 'กลุ่มที่ 2' },
    { value: '3', label: 'กลุ่มที่ 3' },
    { value: '4', label: 'กลุ่มที่ 4' },
    { value: '5', label: 'กลุ่มที่ 5 (รายได้สูงสุด)' },
    { value: 'ไม่ระบุรายได้', label: 'ไม่ระบุรายได้' }
  ];

  // Available views
  const views = [
    { value: 'transition', label: 'การเปลี่ยนประเภทที่อยู่อาศัย' },
    { value: 'financing', label: 'ลักษณะการจ่ายค่าที่อยู่อาศัยที่ต้องการ' },
    { value: 'affordability', label: 'ความสามารถในการจ่าย' }
  ];

  // Process data for chart
  const chartData = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [];
    }

    let filteredData = rawData.records;

    // Filter by quintile if not "all"
    if (selectedQuintile !== 'all') {
      filteredData = filteredData.filter(item => 
        item.Quintile === selectedQuintile
      );
    }

    if (selectedView === 'transition') {
      // Group by current house type and future house type
      const transitions = {};
      
      filteredData.forEach(item => {
        const currentType = houseTypeMapping[item.current_house_type] || item.current_house_type;
        const futureType = houseTypeMapping[item.future_house_type] || item.future_house_type || 'ไม่ระบุ';
        const count = parseInt(item.count) || 0;
        
        if (!transitions[currentType]) {
          transitions[currentType] = {};
        }
        
        transitions[currentType][futureType] = (transitions[currentType][futureType] || 0) + count;
      });

      // Convert to array format for chart
      return Object.entries(transitions).map(([currentType, futures]) => {
        const total = Object.values(futures).reduce((sum, count) => sum + count, 0);
        const result = { currentType, total };
        
        // Add each future type as a property
        Object.entries(futures).forEach(([futureType, count]) => {
          result[futureType] = count;
        });
        
        return result;
      }).sort((a, b) => b.total - a.total);

    } else if (selectedView === 'financing') {
      // Group by financing type
      const financing = {};
      
      filteredData.forEach(item => {
        const type = item.financing_type || 'ไม่ระบุ';
        const count = parseInt(item.count) || 0;
        
        financing[type] = (financing[type] || 0) + count;
      });

      return Object.entries(financing).map(([type, count]) => ({
        name: type,
        value: count,
        percentage: 0 // Will be calculated after we have the total
      })).sort((a, b) => b.value - a.value);

    } else if (selectedView === 'affordability') {
      // Group by quintile and calculate average affordable price
      const affordability = {};
      
      filteredData.forEach(item => {
        const quintile = item.Quintile === 'ไม่ระบุรายได้' ? 'ไม่ระบุ' : `กลุ่มที่ ${item.Quintile}`;
        const price = parseFloat(item.afford_price) || 0;
        const count = parseInt(item.count) || 0;
        
        if (!affordability[quintile]) {
          affordability[quintile] = { totalPrice: 0, totalCount: 0 };
        }
        
        affordability[quintile].totalPrice += price * count;
        affordability[quintile].totalCount += count;
      });

      return Object.entries(affordability).map(([quintile, data]) => ({
        quintile,
        averagePrice: data.totalCount > 0 ? Math.round(data.totalPrice / data.totalCount) : 0,
        respondents: data.totalCount
      })).sort((a, b) => {
        // Sort by quintile order
        if (a.quintile === 'ไม่ระบุ') return 1;
        if (b.quintile === 'ไม่ระบุ') return -1;
        return a.quintile.localeCompare(b.quintile);
      });
    }

    return [];
  }, [rawData, selectedQuintile, selectedView, houseTypeMapping]);

  // Calculate percentages for pie chart
  const pieData = useMemo(() => {
    if (selectedView === 'financing' && chartData.length > 0) {
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      return chartData.map((item, index) => ({
        ...item,
        percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
        fill: colors[index % colors.length]
      }));
    }
    return chartData;
  }, [chartData, selectedView, colors]);

  // Get unique future house types for stacked bar chart
  const futureHouseTypes = useMemo(() => {
    if (selectedView === 'transition' && chartData.length > 0) {
      const types = new Set();
      chartData.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== 'currentType' && key !== 'total') {
            types.add(key);
          }
        });
      });
      return Array.from(types);
    }
    return [];
  }, [chartData, selectedView]);

  // Custom tooltip for transition chart
  const transitionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`ปัจจุบัน: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value} คน`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const pieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p>{`จำนวน: ${data.value} คน`}</p>
          <p>{`สัดส่วน: ${data.percentage}%`}</p>
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
          <h2 className="text-sm font-semibold text-gray-800">ความต้องการที่อยู่อาศัย</h2>
        </div>
        <div className="px-2 py-1 h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลความต้องการที่อยู่อาศัย...</p>
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
          <h2 className="text-sm font-semibold text-gray-800">ความต้องการที่อยู่อาศัย</h2>
        </div>
        <div className="px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-3">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
            <p className="text-gray-500 text-sm">กรุณาลองใหม่อีกครั้ง</p>
          </div>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">ความต้องการที่อยู่อาศัย</h2>
            <ExportButton data={[]} filename={`housing_demand_${provinceName}`} />
          </div>
        </div>
        <div className="px-4 py-8 flex items-center justify-center">
          <p className="text-gray-500">ไม่มีข้อมูลความต้องการที่อยู่อาศัยสำหรับจังหวัดนี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-800">ความต้องการที่อยู่อาศัย</h2>
          <ExportButton data={chartData} filename={`housing_demand_${provinceName}_${selectedView}`} />
        </div>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700">
              ตัวชี้วัด:
            </label>
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 flex-1"
            >
              {views.map(view => (
                <option key={view.value} value={view.value}>{view.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700">
              กลุ่มรายได้:
            </label>
            <select
              value={selectedQuintile}
              onChange={(e) => setSelectedQuintile(e.target.value)}
              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 flex-1"
            >
              {quintiles.map(quintile => (
                <option key={quintile.value} value={quintile.value}>{quintile.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Data source indicator */}
        {isFetching && (
          <div className="mt-2 text-xs text-blue-600">
            🔄 กำลังอัปเดตข้อมูล...
          </div>
        )}
      </div>
      
      <div className="px-2 py-1">
        {/* Transition View - Stacked Bar Chart */}
        {selectedView === 'transition' && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="currentType" 
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
                label={{ value: 'ที่อยู่อาศัยปัจจุบัน', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                fontSize={10}
                label={{ value: 'จำนวน (คน)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={transitionTooltip} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              
              {futureHouseTypes.map((houseType, index) => (
                <Bar 
                  key={houseType}
                  dataKey={houseType}
                  name={houseType}
                  stackId="transition"
                  fill={colors[index % colors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Financing View - Pie Chart */}
        {selectedView === 'financing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={pieTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col justify-center">
              <h3 className="text-sm font-semibold mb-3">สรุปลักษณะการจ่ายค่าที่อยู่อาศัย</h3>
              <div className="space-y-2">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div 
                      className="w-4 h-4 rounded mr-2" 
                      style={{ backgroundColor: item.fill }}
                    ></div>
                    <span className="flex-1">{item.name}</span>
                    <span className="font-medium">{item.value} คน ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Affordability View - Bar Chart */}
        {selectedView === 'affordability' && (
          <ResponsiveContainer width="100%" height={350}>
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
                label={{ value: 'ราคา (บาท)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `${Math.round(value / 1000)}K`}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `${Math.round(value).toLocaleString()} บาท`,
                  'ราคาเฉลี่ยที่สามารถจ่ายได้'
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              
              <Bar 
                dataKey="averagePrice" 
                name="ราคาเฉลี่ยที่สามารถจ่ายได้"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default HousingDemandChart;
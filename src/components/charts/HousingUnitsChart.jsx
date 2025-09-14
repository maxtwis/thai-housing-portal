import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { processHousingSupplyData } from '../../utils/ckanClient';
import { housingCategories } from '../../utils/dataUtils';
import { useHousingSupplyData } from '../../hooks/useCkanQueries';
import ExportButton from '../ExportButton';

const HousingUnitsChart = ({ provinceName, provinceId }) => {
  // Use React Query for data fetching
  const { 
    data: rawData, 
    isLoading, 
    error
  } = useHousingSupplyData(provinceId);
  
  // Process data for chart
  const processedData = React.useMemo(() => {
    if (!rawData || !rawData.records || !housingCategories) {
      return [];
    }

    // Process the rawData
    const processedSupplyData = processHousingSupplyData(rawData.records, housingCategories);
    
    if (processedSupplyData.length === 0) return [];
    
    // Get the latest year data
    const latestYear = processedSupplyData[processedSupplyData.length - 1];
    
    // Convert to the format needed for the bar chart
    return housingCategories.map(category => ({
      name: category.name, 
      value: latestYear[category.name] || 0
    })).filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [rawData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">หน่วยที่อยู่อาศัยจำแนกตามประเภท</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลที่อยู่อาศัย...</p>
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
            <h2 className="text-sm font-semibold text-gray-800">หน่วยที่อยู่อาศัยจำแนกตามประเภท</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p>โหลดข้อมูลไม่สำเร็จ</p>
            <p className="text-xs">{error.message}</p>
          </div>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <p>แหล่งที่มา: สำนักงานสถิติแห่งชาติ</p>
        </div>
      </div>
    );
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">หน่วยที่อยู่อาศัยจำแนกตามประเภท</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <p className="text-gray-500">ไม่มีข้อมูล</p>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <p>แหล่งที่มา: สำนักงานสถิติแห่งชาติ</p>
        </div>
      </div>
    );
  }

  // Calculate latest year for display
  const latestYear = rawData && rawData.records && rawData.records.length > 0 ? 
    Math.max(...rawData.records.map(r => r.year)) : null;

  // Number formatter for tooltip
  const numberFormatter = (value) => {
    return new Intl.NumberFormat('th-TH').format(value) + ' หน่วย';
  };

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">
            หน่วยที่อยู่อาศัยจำแนกตามประเภท {latestYear ? `(ปี พ.ศ. ${latestYear + 543})` : ''}
          </h2>
          <ExportButton data={processedData} filename={`housing_units_${provinceName}`} />
        </div>
      </div>
      <div className="px-2 py-1" style={{ height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 5, right: 15, left: 20, bottom: 5 }}
            layout="vertical"
            barSize={15}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(value)}
            />
            <YAxis 
              type="category"
              dataKey="name"
              tick={{ fontSize: 10 }}
              width={70}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={numberFormatter} contentStyle={{ fontSize: 12 }}
              labelFormatter={(value) => `ปี พ.ศ. ${value + 543}`}
            />
            <Bar 
              dataKey="value" 
              fill="#1f77b4" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">แหล่งที่มา: สำนักงานสถิติแห่งชาติ</p>
      </div>
    </div>
  );
};

export default HousingUnitsChart;
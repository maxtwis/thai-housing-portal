import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ExportButton from '../ExportButton';
import { processHousingSupplyData } from '../../utils/ckanClient';
import { housingCategories } from '../../utils/dataUtils';
import { useHousingSupplyData } from '../../hooks/useCkanQueries';

const HousingSupplyChart = ({ provinceName, provinceId }) => {
  // Use React Query for data fetching
  const { 
    data: rawData, 
    isLoading, 
    error,
    isFetching,
    isStale,
    dataUpdatedAt
  } = useHousingSupplyData(provinceId);
  
  // Process data for chart
  const data = React.useMemo(() => {
    if (rawData && rawData.records) {
      return processHousingSupplyData(rawData.records, housingCategories);
    }
    return [];
  }, [rawData]);
  
  // Show loading only for initial load
  if (isLoading) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Housing Supply by Type</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading housing data...</p>
            <p className="text-xs text-gray-500 mt-1">Initial load may take a moment</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Housing Supply by Type</h2>
            <ExportButton data={[]} filename={`housing_supply_${provinceName}`} />
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">{error.message}</p>
            <p className="text-xs text-gray-400 mt-1">Province: {provinceName} (ID: {provinceId})</p>
          </div>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <p>Source: Thailand National Statistics Office</p>
        </div>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Housing Supply by Type</h2>
            <ExportButton data={[]} filename={`housing_supply_${provinceName}`} />
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">No data available</p>
            <p className="text-xs text-gray-400 mt-1">Province: {provinceName} (ID: {provinceId})</p>
          </div>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <p>Source: Thailand National Statistics Office</p>
        </div>
      </div>
    );
  }
  
  // Shorter housing category names for better display
  const shortNames = {
    "บ้านเดี่ยว": "บ้านเดี่ยว",
    "บ้านแฝด": "บ้านแฝด",
    "ทาวน์เฮ้าส์": "ทาวน์เฮ้าส์",
    "อาคารชุด": "คอนโด",
    "ตึกแถวและห้องแถว": "ตึกแถว",
    "พาณิชยกรรม": "พาณิชย์",
    "ตึก": "ตึก",
    "โฮมออฟฟิศ": "ออฟฟิศ"
  };

  // Get colors for each housing type
  const getColorForIndex = (index) => {
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', 
      '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'
    ];
    return colors[index % colors.length];
  };

  // Number formatter for tooltip
  const numberFormatter = (value) => {
    return new Intl.NumberFormat('th-TH').format(value) + ' หน่วย';
  };

  // Get housing category names that exist in the data
  const housingCategoryNames = housingCategories
    .map(category => category.name)
    .filter(name => {
      // Check if this category exists in any data point
      return data.some(dataPoint => dataPoint[name] !== undefined && dataPoint[name] > 0);
    });

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">Housing Supply by Type</h2>
          <div className="flex items-center space-x-2">
            {/* Show cache status */}
            <ExportButton data={data} filename={`housing_supply_${provinceName}`} />
          </div>
        </div>
      </div>
      <div className="px-2 py-1" style={{ height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 15, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={(value) => new Intl.NumberFormat('th-TH').format(value)}
              tick={{ fontSize: 12 }}
              width={40}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={numberFormatter} contentStyle={{ fontSize: 12 }} />
            <Legend 
              verticalAlign="bottom" 
              height={20}
              wrapperStyle={{ fontSize: 9, paddingTop: 0 }}
              formatter={(value) => shortNames[value] || value}
            />
            {housingCategoryNames.map((category, index) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                fill={getColorForIndex(index)}
                stroke={getColorForIndex(index)}
                fillOpacity={0.6}
                strokeWidth={1}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">Source: Thailand National Statistics Office</p>
      </div>
      
      {/* Debug info (show in development) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-2 text-xs border-t border-gray-200 pt-2">
          <summary className="font-medium text-blue-600 cursor-pointer">Debug Info (React Query)</summary>
          <div className="p-2 bg-gray-50 mt-1 rounded">
            <p>Query Key: ['housing-supply', {provinceId}]</p>
            <p>Province ID: {provinceId}</p>
            <p>Records: {data.length}</p>
            <p>Categories with data: {housingCategoryNames.length}</p>
            <p>Is Loading: {isLoading.toString()}</p>
            <p>Is Fetching: {isFetching.toString()}</p>
            <p>Is Stale: {isStale.toString()}</p>
            <p>Has Error: {!!error}</p>
            <p>Last Updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleString() : 'Never'}</p>
          </div>
        </details>
      )}
    </div>
  );
};

export default HousingSupplyChart;
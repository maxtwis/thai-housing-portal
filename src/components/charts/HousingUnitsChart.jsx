import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

const HousingUnitsChart = ({ data, housingCategories }) => {
  // Process the data for the bar chart
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0 || !housingCategories) {
      return [];
    }

    const latestYear = data[data.length - 1];
    return housingCategories.map(category => ({
      name: category.name, // Shorter names
      value: latestYear[category.name] || 0
    })).filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [data, housingCategories]);

  if (!processedData || processedData.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Housing Units by Type</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <p className="text-gray-500">No data available</p>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <p>Source: Thailand National Statistics Office</p>
        </div>
      </div>
    );
  }

  // Calculate latest year
  const latestYear = data && data.length > 0 ? data[data.length - 1].year : '';

  // Number formatter for tooltip
  const numberFormatter = (value) => {
    return new Intl.NumberFormat('th-TH').format(value) + ' หน่วย';
  };

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">Housing Units by Type ({latestYear})</h2>
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
            <Tooltip formatter={numberFormatter} contentStyle={{ fontSize: 12 }}/>
            <Bar 
              dataKey="value" 
              fill="#1f77b4" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">Source: Thailand National Statistics Office</p>
      </div>
    </div>
  );
};

export default HousingUnitsChart;
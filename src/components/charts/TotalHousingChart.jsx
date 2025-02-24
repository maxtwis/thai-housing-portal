import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const TotalHousingChart = ({ data, housingCategories }) => {
  // Process the data for the line chart
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0 || !housingCategories) {
      return [];
    }

    const housingCategoryNames = housingCategories.map(category => category.name);
    
    return data.map(yearData => {
      const totalUnits = Object.entries(yearData)
        .filter(([key]) => housingCategoryNames.includes(key))
        .reduce((sum, [_, value]) => sum + (value || 0), 0);
      
      return {
        year: yearData.year,
        total: totalUnits
      };
    });
  }, [data, housingCategories]);

  if (!processedData || processedData.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Total Housing Units Over Time</h2>
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

  // Number formatter for tooltip
  const numberFormatter = (value) => {
    return new Intl.NumberFormat('th-TH').format(value) + ' หน่วย';
  };

  // Calculate growth percentage
  const getGrowthPercentage = () => {
    if (processedData.length < 2) return 'N/A';
    
    const firstYear = processedData[0].total;
    const lastYear = processedData[processedData.length - 1].total;
    
    if (firstYear === 0) return 'N/A';
    
    const growth = ((lastYear / firstYear) - 1) * 100;
    return growth.toFixed(1) + '%';
  };

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">Total Housing Units Over Time</h2>
          <div className="text-xs font-medium text-green-600">
            Growth: {getGrowthPercentage()}
          </div>
        </div>
      </div>
      <div className="px-2 py-1" style={{ height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{ top: 15, right: 15, left: 15, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={(value) => new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(value)}
              tick={{ fontSize: 12 }}
              width={40}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={numberFormatter} contentStyle={{ fontSize: 12 }}/>
            <Legend 
              verticalAlign="bottom" 
              height={20}
              wrapperStyle={{ fontSize: 10, paddingTop: 0 }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#1f77b4"
              activeDot={{ r: 4 }}
              strokeWidth={1.5}
              dot={{ r: 2 }}
              name="รวมที่อยู่อาศัย"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">Source: Thailand National Statistics Office</p>
      </div>
    </div>
  );
};

export default TotalHousingChart;
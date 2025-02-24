import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ExportButton from '../ExportButton';

const HouseholdChart = ({ data, provinceName }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Total Households Over Time</h2>
            <ExportButton data={[]} filename={`households_${provinceName}`} />
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

  // Formatter for household numbers
  const numberFormatter = (value) => {
    return new Intl.NumberFormat('th-TH').format(value);
  };

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">Total Households Over Time</h2>
          <ExportButton data={data} filename={`households_${provinceName}`} />
        </div>
      </div>
      <div className="px-2 py-1" style={{ height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 15, right: 15, left: 15, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={numberFormatter}
              tick={{ fontSize: 12 }}
              width={30}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={numberFormatter} contentStyle={{ fontSize: 12 }} />
            <Legend 
              verticalAlign="bottom" 
              height={20}
              wrapperStyle={{ fontSize: 12, paddingTop: 0 }}
            />
            <Line
              type="monotone"
              dataKey="household"
              stroke="#ff7f0e"
              activeDot={{ r: 4 }}
              strokeWidth={1.5}
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

export default HouseholdChart;
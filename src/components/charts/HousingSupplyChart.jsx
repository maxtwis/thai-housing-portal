import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ExportButton from '../ExportButton';

const HousingSupplyChart = ({ data, housingCategories, provinceName }) => {
  if (!data || data.length === 0 || !housingCategories) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Housing Supply by Type</h2>
            <ExportButton data={[]} filename={`housing_supply_${provinceName}`} />
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

  // Get housing category names
  const housingCategoryNames = housingCategories.map(category => category.name);
  
  // Shorter housing category names
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

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">Housing Supply by Type</h2>
          <ExportButton data={data} filename={`housing_supply_${provinceName}`} />
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
    </div>
  );
};

export default HousingSupplyChart;
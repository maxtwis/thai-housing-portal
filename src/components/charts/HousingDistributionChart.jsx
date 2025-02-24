import React from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const HousingDistributionChart = ({ data, housingCategories }) => {
  // Process the data for the pie chart
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0 || !housingCategories) {
      return [];
    }

    const latestYear = data[data.length - 1];
    return housingCategories.map(category => ({
      name: category.name,
      value: latestYear[category.name] || 0
    })).filter(item => item.value > 0);
  }, [data, housingCategories]);

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
  const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'];

  if (!processedData || processedData.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Housing Distribution (Latest Year)</h2>
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-xs">
          <p className="font-semibold">{shortNames[payload[0].name] || payload[0].name}</p>
          <p>{numberFormatter(payload[0].value)}</p>
          <p className="text-gray-500 text-xs">
            {((payload[0].value / processedData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show labels for segments that are large enough
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">Housing Distribution ({latestYear})</h2>
        </div>
      </div>
      <div className="px-2 py-1" style={{ height: 224 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              layout="horizontal"
              align="center"
              formatter={(value) => shortNames[value] || value}
              wrapperStyle={{ fontSize: 8, paddingTop: 0 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">Source: Thailand National Statistics Office</p>
      </div>
    </div>
  );
};

export default HousingDistributionChart;
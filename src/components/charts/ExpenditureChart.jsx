import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ExportButton from '../ExportButton';
import { useAllExpenditureData } from '../../hooks/useCkanQueries';

const ExpenditureChart = ({ provinceName, provinceId }) => {
  // Use React Query for data fetching via the custom hook
  const expenditureQueries = useAllExpenditureData(provinceId);
  
  // Check loading and error states
  const isLoading = expenditureQueries.some(q => q.isLoading);
  const isError = expenditureQueries.some(q => q.isError);
  const isFetching = expenditureQueries.some(q => q.isFetching);
  
  // Process data for chart display
  const processedData = React.useMemo(() => {
    if (isLoading || isError || !expenditureQueries.length) {
      return [];
    }
    
    // Define expenditure categories
    const expenditureCategories = [
      { id: 1, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย' },
      { id: 2, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย (เช่า)' },
      { id: 3, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย (ผ่อน)' },
      { id: 5, name: 'ค่าใช้จ่ายด้านไฟฟ้า' }
    ];
    
    // Define quintiles
    const quintiles = [
      { id: 1, name: 'Quintile 1 (Lowest 20%)' },
      { id: 2, name: 'Quintile 2' },
      { id: 3, name: 'Quintile 3' },
      { id: 4, name: 'Quintile 4' },
      { id: 5, name: 'Quintile 5 (Highest 20%)' }
    ];
    
    // Shortened quintile names for better display
    const shortenedNames = {
      "Quintile 1 (Lowest 20%)": "Q1",
      "Quintile 2": "Q2",
      "Quintile 3": "Q3", 
      "Quintile 4": "Q4",
      "Quintile 5 (Highest 20%)": "Q5"
    };
    
    const result = [];
    
    expenditureQueries.forEach((query, index) => {
      const quintileId = index + 1;
      const quintileData = query.data || [];
      
      if (quintileData.length > 0) {
        const fullName = quintiles.find(q => q.id === quintileId)?.name || `Quintile ${quintileId}`;
        
        const chartData = {};
        chartData.name = shortenedNames[fullName] || fullName;
        
        quintileData.forEach(item => {
          const expCategory = expenditureCategories.find(c => c.id === item.expenditure_id);
          if (expCategory) {
            // Use full category name as the key
            chartData[expCategory.name] = item.amount;
          }
        });
        
        result.push(chartData);
      }
    });
    
    return result;
  }, [expenditureQueries, isLoading, isError]);

  // Get the top 4 categories to display
  const topCategories = React.useMemo(() => {
    const expenditureCategories = [
      { id: 1, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย' },
      { id: 2, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย (เช่า)' },
      { id: 3, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย (ผ่อน)' },
      { id: 5, name: 'ค่าใช้จ่ายด้านไฟฟ้า' }
    ];
    
    return expenditureCategories
      .slice(0, 4)
      .map(category => category.name);
  }, []);

  // Define chart colors
  const barColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Expenditure by Income Quintile</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading expenditure data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Expenditure by Income Quintile</h2>
            <ExportButton data={[]} filename={`expenditure_${provinceName}`} />
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p>Failed to load data</p>
            <p className="text-xs">Please try again later</p>
          </div>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <p>Source: Thailand National Statistics Office</p>
        </div>
      </div>
    );
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Expenditure by Income Quintile</h2>
            <ExportButton data={[]} filename={`expenditure_${provinceName}`} />
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

  // Percentage formatter for tooltip
  const percentageFormatter = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Custom tooltip with full category name display
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {percentageFormatter(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">Expenditure by Income Quintile</h2>
          <div className="flex items-center space-x-2">
            {isFetching && (
              <div className="text-xs text-blue-600">
                <span className="inline-block animate-pulse">●</span>
              </div>
            )}
            <ExportButton data={processedData} filename={`expenditure_${provinceName}`} />
          </div>
        </div>
      </div>
      <div className="px-2 py-1" style={{ height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 5, right: 15, left: 15, bottom: 5 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={(value) => `${value}`}
              tick={{ fontSize: 12 }}
              width={25}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
              label={{ value: '%', angle: -90, position: 'insideLeft', offset: -5, fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />}  />
            <Legend 
              verticalAlign="bottom" 
              height={40}
              wrapperStyle={{ fontSize: 10, paddingTop: 0 }}
            />
            {topCategories.map((category, index) => (
              <Bar 
                key={category}
                dataKey={category}
                stackId="stack"
                fill={barColors[index % barColors.length]}
                name={category}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">Source: Thailand National Statistics Office</p>
      </div>
    </div>
  );
};

export default ExpenditureChart;
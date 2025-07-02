import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ExportButton from '../ExportButton';
import { usePopulationAgeData } from '../../hooks/useCkanQueries';

const PopulationAgeChart = ({ provinceName, provinceId }) => {
  // Use React Query for data fetching via the custom hook
  const { 
    data: rawData, 
    isLoading, 
    error,
    isFetching
  } = usePopulationAgeData(provinceId);

  // Process data for the chart
  const processedData = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    
    const latestYear = Math.max(...rawData.map(d => d.year));
    const latestData = rawData.filter(d => d.year === latestYear);
    
    // Define custom sort order for age groups
    const ageOrder = {
      '0-6': 1,
      '7-14': 2,
      '15-24': 3,
      '25-49': 4,
      '50-59': 5,
      '60+': 6
    };
    
    return latestData.map(d => ({
      age_group: d.age_group,
      population: d.age_population
    })).sort((a, b) => {
      return (ageOrder[a.age_group] || 999) - (ageOrder[b.age_group] || 999);
    });
  }, [rawData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Population by Age Group</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading population age data...</p>
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
            <h2 className="text-sm font-semibold text-gray-800">Population by Age Group</h2>
            <ExportButton data={[]} filename={`population_age_${provinceName}`} />
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p>Failed to load data</p>
            <p className="text-xs">{error.message}</p>
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
            <h2 className="text-sm font-semibold text-gray-800">Population by Age Group</h2>
            <ExportButton data={[]} filename={`population_age_${provinceName}`} />
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

  // Get the latest year for display
  const latestYear = rawData && rawData.length > 0 ? Math.max(...rawData.map(d => d.year)) : '';

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">
            Population by Age Group {latestYear ? `(${latestYear})` : ''}
          </h2>
          <div className="flex items-center space-x-2">
            {isFetching && (
              <div className="text-xs text-blue-600">
                <span className="inline-block animate-pulse">●</span>
              </div>
            )}
            <ExportButton data={processedData} filename={`population_age_${provinceName}`} />
          </div>
        </div>
      </div>
      <div className="px-2 py-1" style={{ height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 15, right: 15, left: 15, bottom: 5 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="age_group" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tickFormatter={(value) => new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(value)}
              tick={{ fontSize: 12 }}
              width={45}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              formatter={(value) => new Intl.NumberFormat('th-TH').format(value)}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar 
              dataKey="population" 
              fill="#1f77b4"
              radius={[4, 4, 0, 0]}
              name="Population"
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

export default PopulationAgeChart;
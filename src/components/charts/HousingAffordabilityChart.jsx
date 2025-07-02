import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ExportButton from '../ExportButton';
import { useHousingAffordabilityData } from '../../hooks/useCkanQueries';

const HousingAffordabilityChart = ({ provinceName, provinceId }) => {
  const [selectedQuintile, setSelectedQuintile] = useState('all');
  
  // Use React Query for data fetching
  const { 
    data: rawData, 
    isLoading, 
    error,
    isFetching
  } = useHousingAffordabilityData(provinceId);

  // House type mapping (excluding type 6 as requested)
  const houseTypeMapping = {
    1: 'บ้านเดี่ยว',
    2: 'ห้องแถว',
    3: 'ตึกแถว/ทาวน์เฮาส์',
    4: 'แฟลต/อพาร์ทเม้นท์/คอนโดมิเนี่ยม',
    5: 'ห้องแบ่งเช่า'
  };

  // Process data for chart
  const chartData = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [];
    }

    let filteredData = rawData.records.filter(item => {
      const quintileMatch = selectedQuintile === 'all' || item.Quintile == selectedQuintile;
      return quintileMatch;
    });

    // Group by demand_type and calculate averages
    const groupedData = {};
    
    filteredData.forEach(item => {
      const demandType = item.demand_type;
      if (!groupedData[demandType]) {
        groupedData[demandType] = {
          demand_type: demandType,
          Total_Hburden: [],
          Exp_hbrent: [],
          Exp_hbmort: []
        };
      }
      
      if (item.Total_Hburden !== null && !isNaN(parseFloat(item.Total_Hburden))) {
        groupedData[demandType].Total_Hburden.push(parseFloat(item.Total_Hburden));
      }
      if (item.Exp_hbrent !== null && !isNaN(parseFloat(item.Exp_hbrent))) {
        groupedData[demandType].Exp_hbrent.push(parseFloat(item.Exp_hbrent));
      }
      if (item.Exp_hbmort !== null && !isNaN(parseFloat(item.Exp_hbmort))) {
        groupedData[demandType].Exp_hbmort.push(parseFloat(item.Exp_hbmort));
      }
    });

    // Calculate averages
    return Object.values(groupedData).map(group => ({
      demand_type: group.demand_type,
      Total_Hburden: group.Total_Hburden.length > 0 
        ? parseFloat((group.Total_Hburden.reduce((a, b) => a + b, 0) / group.Total_Hburden.length).toFixed(2))
        : 0,
      Exp_hbrent: group.Exp_hbrent.length > 0 
        ? parseFloat((group.Exp_hbrent.reduce((a, b) => a + b, 0) / group.Exp_hbrent.length).toFixed(2))
        : 0,
      Exp_hbmort: group.Exp_hbmort.length > 0 
        ? parseFloat((group.Exp_hbmort.reduce((a, b) => a + b, 0) / group.Exp_hbmort.length).toFixed(2))
        : 0
    }));
  }, [rawData, selectedQuintile]);

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">{label}</h4>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium">{entry.value}%</span>
            </div>
          ))}
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
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Housing Affordability by Demand Type</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading affordability data...</p>
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
            <h2 className="text-sm font-semibold text-gray-800">Housing Affordability by Demand Type</h2>
            <ExportButton data={[]} filename={`affordability_${provinceName}`} />
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-gray-600">Error loading data</p>
            <p className="text-xs text-gray-500 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-800">Housing Affordability by Demand Type</h2>
          <ExportButton data={chartData} filename={`affordability_${provinceName}`} />
        </div>
        
        {/* Quintile selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700">
            Income Group:
          </label>
          <select
            value={selectedQuintile}
            onChange={(e) => setSelectedQuintile(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Groups</option>
            <option value="1">Q1 (Lowest Income)</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
            <option value="5">Q5 (Highest Income)</option>
          </select>
        </div>
      </div>
      
      <div className="px-2 py-1">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="demand_type" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                fontSize={10}
              />
              <YAxis 
                fontSize={10}
                label={{ value: '%', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={customTooltip} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar 
                dataKey="Total_Hburden" 
                name="Total Housing Burden" 
                fill="#3B82F6" 
                radius={[1, 1, 0, 0]}
              />
              <Bar 
                dataKey="Exp_hbrent" 
                name="Rent-to-Income" 
                fill="#10B981" 
                radius={[1, 1, 0, 0]}
              />
              <Bar 
                dataKey="Exp_hbmort" 
                name="Mortgage-to-Income" 
                fill="#F59E0B" 
                radius={[1, 1, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-52 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-gray-400 mb-2">📊</div>
              <p className="text-sm">No data available for selected criteria</p>
            </div>
          </div>
        )}
        
        {/* Loading indicator for background updates */}
        {isFetching && !isLoading && (
          <div className="text-xs text-blue-600 mt-2 px-1">
            🔄 Updating data...
          </div>
        )}
      </div>
      
      {/* Info section */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-600">
        <p><strong>Total Housing Burden:</strong> Total housing expenditure as % of income</p>
        <p><strong>Rent-to-Income:</strong> Rental costs as % of income</p>
        <p><strong>Mortgage-to-Income:</strong> Mortgage payments as % of income</p>
        <p className="text-gray-500 mt-1">
          Showing: {selectedQuintile === 'all' ? 'All income groups' : `Income group ${selectedQuintile}`} • {provinceName}
        </p>
      </div>
    </div>
  );
};

export default HousingAffordabilityChart;
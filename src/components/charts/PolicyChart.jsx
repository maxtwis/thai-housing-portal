import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { countPoliciesByStatus, getPoliciesByType } from '../../utils/policyUtils';

const PolicyChart = ({ policies, onFilterChange, activeFilter }) => {
  if (!policies || policies.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Policy Distribution</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <p className="text-gray-500">No policy data available</p>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <p>Source: National Housing Authority of Thailand</p>
        </div>
      </div>
    );
  }

  // Count policies by status
  const statusCounts = countPoliciesByStatus(policies);
  
  // Prepare data for status pie chart
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    filter: `status:${name}`
  })).filter(item => item.value > 0);
  
  // Prepare data for policy type bar chart
  const policyByType = getPoliciesByType(policies);
  const typeData = Object.entries(policyByType).map(([type, policies]) => {
    // Extract the base type code (S1, S2, S3, SC)
    const baseType = type.split(':')[0].trim();
    
    return {
      name: baseType,
      count: policies.length,
      fullName: type,
      filter: `type:${baseType}`
    };
  }).sort((a, b) => b.count - a.count);
  
  // Colors for status pie chart
  const STATUS_COLORS = {
    'Active': '#2ca02c',
    'Pending': '#ff7f0e',
    'Inactive': '#7f7f7f'
  };
  
  // Colors for policy type bar chart
  const TYPE_COLORS = {
    'S1': '#1f77b4',
    'S2': '#9467bd',
    'S3': '#d62728'
  };
  
  // Custom tooltip for status pie chart
  const StatusTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-xs">
          <p className="font-semibold">{payload[0].name}</p>
          <p>{payload[0].value} policies</p>
          <p className="text-gray-500 text-xs">
            {((payload[0].value / policies.length) * 100).toFixed(1)}%
          </p>
          <p className="text-blue-500 text-xs mt-1">Click to filter</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for policy type bar chart
  const TypeTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-xs">
          <p className="font-semibold">{payload[0].payload.fullName}</p>
          <p>{payload[0].value} policies</p>
          <p className="text-blue-500 text-xs mt-1">Click to filter</p>
        </div>
      );
    }
    return null;
  };

  // Handle click on chart elements for filtering
  const handlePieClick = (data) => {
    if (data && data.filter) {
      if (activeFilter === data.filter) {
        // If already filtered by this, clear the filter
        onFilterChange(null);
      } else {
        // Apply new filter
        onFilterChange(data.filter);
      }
    }
  };
  
  // Handle click on bar chart
  const handleBarClick = (data, index, event) => {
    if (data && data.filter) {
      if (activeFilter === data.filter) {
        // If already filtered by this, clear the filter
        onFilterChange(null);
      } else {
        // Apply new filter
        onFilterChange(data.filter);
      }
    }
  };

  // Determine if a segment/bar is active based on current filter
  const isFilterActive = (item) => activeFilter === item.filter;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Policy Status Pie Chart */}
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Policy Status</h2>
            {activeFilter && activeFilter.startsWith('status:') && (
              <button 
                onClick={() => onFilterChange(null)} 
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
        <div className="px-2 py-1" style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelStyle={{
                  fontSize: '9px',
                }}
                onClick={handlePieClick}
                cursor="pointer"
              >
                {statusData.map((entry) => (
                  <Cell 
                    key={entry.name} 
                    fill={STATUS_COLORS[entry.name] || '#8884d8'} 
                    stroke={isFilterActive(entry) ? '#000' : undefined}
                    strokeWidth={isFilterActive(entry) ? 2 : undefined}
                    opacity={activeFilter && !isFilterActive(entry) ? 0.5 : 1}
                  />
                ))}
              </Pie>
              <Tooltip content={<StatusTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">Total policies: {policies.length}</p>
        </div>
      </div>
      
      {/* Policy Type Bar Chart */}
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Policy Types (3S Model)</h2>
            {activeFilter && activeFilter.startsWith('type:') && (
              <button 
                onClick={() => onFilterChange(null)} 
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
        <div className="px-2 py-1" style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={typeData}
              layout="vertical"
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 9 }} 
                width={25} 
              />
              <Tooltip content={<TypeTooltip />} />
              <Bar 
                dataKey="count" 
                barSize={20}
                onClick={handleBarClick}
                cursor="pointer"
              >
                {typeData.map((entry) => (
                  <Cell 
                    key={entry.name} 
                    fill={TYPE_COLORS[entry.name] || '#8884d8'} 
                    stroke={isFilterActive(entry) ? '#000' : undefined}
                    strokeWidth={isFilterActive(entry) ? 2 : undefined}
                    opacity={activeFilter && !isFilterActive(entry) ? 0.5 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs">S1: Supply</span>
            <span className="text-xs">S2: Subsidy</span>
            <span className="text-xs">S3: Stability</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyChart;
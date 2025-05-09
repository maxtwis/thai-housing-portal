import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ExportButton from '../ExportButton';
import { getCkanData, ckanSqlQuery } from '../../utils/ckanClient';

// Housing Supply Resource ID from CKAN
const HOUSING_SUPPLY_RESOURCE_ID = '15132377-edb0-40b0-9aad-8fd9f6769b92';

// Categories for housing types
const housingCategories = [
  { id: 1, name: 'บ้านเดี่ยว' },
  { id: 2, name: 'บ้านแฝด' },
  { id: 3, name: 'ทาวน์เฮ้าส์' },
  { id: 4, name: 'อาคารชุด' },
  { id: 5, name: 'ตึกแถวและห้องแถว' },
  { id: 6, name: 'พาณิชยกรรม' },
  { id: 7, name: 'ตึก' },
  { id: 8, name: 'โฮมออฟฟิศ' }
];

const HousingSupplyChart = ({ provinceName, provinceId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Option 1: Using the datastore_search action with filters
        const result = await getCkanData(HOUSING_SUPPLY_RESOURCE_ID, {
          filters: JSON.stringify({ geo_id: provinceId }),
          limit: 1000
        });
        
        // Option 2: Using SQL query
        // const sql = `
        //   SELECT * FROM "${HOUSING_SUPPLY_RESOURCE_ID}" 
        //   WHERE geo_id = ${provinceId}
        // `;
        // const result = await ckanSqlQuery(sql);
        
        // Process data for chart
        const processedData = processHousingData(result.records || []);
        setData(processedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching housing supply data:', err);
        setError('Failed to load housing data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [provinceId]);
  
  // Process raw CKAN data into chart-friendly format
  const processHousingData = (rawData) => {
    // Group by year
    const groupedByYear = {};
    
    rawData.forEach(item => {
      const year = item.year;
      if (!groupedByYear[year]) {
        groupedByYear[year] = {};
      }
      
      // Find housing category name
      const housingCategory = housingCategories.find(
        cat => cat.id === parseInt(item.housing_id)
      );
      
      if (housingCategory) {
        groupedByYear[year][housingCategory.name] = parseInt(item.housing_unit);
      }
    });
    
    // Convert to array format for Recharts
    return Object.keys(groupedByYear).map(year => {
      return {
        year: parseInt(year),
        ...groupedByYear[year]
      };
    }).sort((a, b) => a.year - b.year); // Sort by year
  };
  
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

  if (loading) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Housing Supply by Type</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-2 text-gray-500">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Housing Supply by Type</h2>
            <ExportButton data={[]} filename={`housing_supply_${provinceName}`} />
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <p className="text-gray-500">{error || "No data available"}</p>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <p>Source: Thailand National Statistics Office</p>
        </div>
      </div>
    );
  }

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
      return data.some(dataPoint => dataPoint[name] !== undefined);
    });

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
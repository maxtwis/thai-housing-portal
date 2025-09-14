import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { processHousingSupplyData } from '../../utils/ckanClient';
import { housingCategories } from '../../utils/dataUtils';
import { useHousingSupplyData } from '../../hooks/useCkanQueries';
import ExportButton from '../ExportButton';

const TotalHousingChart = ({ provinceName, provinceId }) => {
  // Use React Query for data fetching
  const { 
    data: rawData, 
    isLoading, 
    error
  } = useHousingSupplyData(provinceId);
  
  // Process data for chart
  const processedData = React.useMemo(() => {
    if (!rawData || !rawData.records || !housingCategories) {
      return [];
    }

    // Process the rawData
    const processedSupplyData = processHousingSupplyData(rawData.records, housingCategories);
    
    if (processedSupplyData.length === 0) return [];
    
    // Calculate total units for each year
    const housingCategoryNames = housingCategories.map(category => category.name);
    
    return processedSupplyData.map(yearData => {
      const totalUnits = housingCategoryNames.reduce((sum, catName) => {
        return sum + (yearData[catName] || 0);
      }, 0);
      
      return {
        year: yearData.year,
        total: totalUnits
      };
    });
  }, [rawData]);

  // Calculate growth percentage
  const getGrowthPercentage = () => {
    if (!processedData || processedData.length < 2) return 'N/A';
    
    const firstYear = processedData[0].total;
    const lastYear = processedData[processedData.length - 1].total;
    
    if (firstYear === 0) return 'N/A';
    
    const growth = ((lastYear / firstYear) - 1) * 100;
    return growth.toFixed(1) + '%';
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">จำนวนหน่วยที่อยู่อาศัยรวมตลอดช่วงเวลา</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลที่อยู่อาศัย...</p>
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
            <h2 className="text-sm font-semibold text-gray-800">จำนวนหน่วยที่อยู่อาศัยรวมตลอดช่วงเวลา</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p>โหลดข้อมูลไม่สำเร็จ</p>
            <p className="text-xs">{error.message}</p>
          </div>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <p>แหล่งที่มา: สำนักงานสถิติแห่งชาติ</p>
        </div>
      </div>
    );
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">จำนวนหน่วยที่อยู่อาศัยรวมตลอดช่วงเวลา</h2>
            <div className="text-xs font-medium text-green-600">
  การเติบโต: ไม่มีข้อมูล
            </div>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <p className="text-gray-500">ไม่มีข้อมูล</p>
        </div>
        <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
          <p>แหล่งที่มา: สำนักงานสถิติแห่งชาติ</p>
        </div>
      </div>
    );
  }

  // Number formatter for tooltip
  const numberFormatter = (value) => {
    return new Intl.NumberFormat('th-TH').format(value) + ' หน่วย';
  };

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">จำนวนหน่วยที่อยู่อาศัยรวมตลอดช่วงเวลา</h2>
          <div className="text-xs font-medium text-green-600">
การเติบโต: {getGrowthPercentage()}
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
            <Tooltip formatter={numberFormatter} contentStyle={{ fontSize: 12 }}
              labelFormatter={(value) => `ปี พ.ศ. ${value + 543}`}
            />
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
        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap">แหล่งที่มา: สำนักงานสถิติแห่งชาติ</p>
      </div>
    </div>
  );
};

export default TotalHousingChart;
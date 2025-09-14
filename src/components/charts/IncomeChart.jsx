import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ExportButton from '../ExportButton';
import { useIncomeData } from '../../hooks/useCkanQueries';

const IncomeChart = ({ provinceName, provinceId }) => {
  // Use React Query for data fetching via the custom hook
  const { 
    data, 
    isLoading, 
    error,
    isFetching
  } = useIncomeData(provinceId);

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">รายได้เฉลี่ยครัวเรือนตามช่วงเวลา</h2>
          </div>
        </div>
        <div className="px-2 py-1 h-52 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลรายได้...</p>
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
            <h2 className="text-sm font-semibold text-gray-800">รายได้เฉลี่ยครัวเรือนตามช่วงเวลา</h2>
            <ExportButton data={[]} filename={`income_${provinceName}`} />
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

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">รายได้เฉลี่ยครัวเรือนตามช่วงเวลา</h2>
            <ExportButton data={[]} filename={`income_${provinceName}`} />
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

  // Formatter for income values
  const currencyFormatter = (value) => {
    return new Intl.NumberFormat('th-TH').format(value) + ' บาท';
  };

  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">รายได้เฉลี่ยครัวเรือนตามช่วงเวลา</h2>
          <div className="flex items-center space-x-2">
            {isFetching && (
              <div className="text-xs text-blue-600">
                <span className="inline-block animate-pulse">●</span>
              </div>
            )}
            <ExportButton data={data} filename={`income_${provinceName}`} />
          </div>
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
              tickFormatter={(value) => new Intl.NumberFormat('th-TH').format(value)}
              tick={{ fontSize: 12 }}
              width={40}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={currencyFormatter} contentStyle={{ fontSize: 12 }}
              labelFormatter={(value) => `ปี พ.ศ. ${value + 543}`}
            />
            <Legend 
              verticalAlign="bottom" 
              height={20}
              wrapperStyle={{ fontSize: 12, paddingTop: 0 }}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#2ca02c"
              activeDot={{ r: 4 }}
              strokeWidth={1.5}
              name="รายได้มัธยฐาน"
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

export default IncomeChart;
import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import ExportButton from '../ExportButton';
import { useLocalPopulationData } from '../../hooks/useLocalHouseholdData';

const PopulationByYearChart = ({ provinceName, provinceId }) => {
  // Use local CSV data only
  const { data: rawData, isLoading, error, isFetching } = useLocalPopulationData(provinceId);

  // Process data for chart
  const chartData = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [];
    }

    console.log('Processing population data:', rawData.records);
    return rawData.records;
  }, [rawData]);

  // Custom tooltip
  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border-2 border-blue-200 rounded-lg shadow-xl max-w-xs">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
            <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white font-bold rounded-full text-xs">
              {label}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-sm">ปี พ.ศ. {label}</h4>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-700">จำนวนประชากร</span>
              <span className="text-sm font-bold text-gray-900">
                {payload[0].value.toLocaleString()} คน
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              จำนวนประชากรตามปี
            </h2>
            <p className="text-xs text-gray-600">
              {provinceName}
            </p>
          </div>
          <ExportButton
            data={chartData}
            filename={`population_by_year_${provinceName}`}
          />
        </div>
      </div>

      <div className="px-6 py-4 bg-gradient-to-b from-gray-50 to-white">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 40, left: 30, bottom: 20 }}
            >
              <defs>
                <linearGradient id="gradient-population" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5470C6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#5470C6" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                strokeOpacity={0.5}
                vertical={false}
              />

              <XAxis
                dataKey="year"
                fontSize={13}
                fontWeight={600}
                stroke="#6b7280"
                tick={{ fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
                label={{
                  value: 'ปี พ.ศ.',
                  position: 'insideBottom',
                  offset: -10,
                  style: {
                    fontSize: 12,
                    fontWeight: 'bold',
                    fill: '#6b7280'
                  }
                }}
              />

              <YAxis
                fontSize={12}
                fontWeight={500}
                stroke="#6b7280"
                tick={{ fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
                tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
                label={{
                  value: 'ประชากร (ล้านคน)',
                  angle: -90,
                  position: 'insideLeft',
                  style: {
                    fontSize: 13,
                    fontWeight: 'bold',
                    fill: '#1f2937'
                  }
                }}
              />

              <Tooltip
                content={customTooltip}
                cursor={{ stroke: '#5470C6', strokeWidth: 2, strokeDasharray: '5 5' }}
              />

              <Legend
                wrapperStyle={{
                  fontSize: '13px',
                  fontWeight: 500,
                  paddingTop: '5px'
                }}
                iconType="line"
                iconSize={20}
              />

              <Area
                type="monotone"
                dataKey="population"
                name="จำนวนประชากร"
                stroke="#5470C6"
                strokeWidth={3}
                fill="url(#gradient-population)"
                dot={{ fill: '#5470C6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 text-center">
              {isFetching ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  กำลังโหลดข้อมูล...
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📊</div>
                  ไม่มีข้อมูลสำหรับจังหวัดนี้
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Data Source Information */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">
              แหล่งข้อมูล: สำนักงานสถิติแห่งชาติ
            </span>
          </div>
          {chartData.length > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">
                ช่วงเวลา: {chartData[0].year} - {chartData[chartData.length - 1].year}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopulationByYearChart;

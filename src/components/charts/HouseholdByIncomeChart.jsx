import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ExportButton from '../ExportButton';
import { useLocalHouseholdByIncomeData } from '../../hooks/useLocalHouseholdData';
import { useIncomeRankLabels } from '../../hooks/useLocalAffordabilityData';

const HouseholdByIncomeChart = ({ provinceName, provinceId }) => {
  // Use local CSV data only
  const { data: rawData, isLoading, error, isFetching } = useLocalHouseholdByIncomeData(provinceId);

  // Load income rank labels for legend
  const { data: incomeRankLabels } = useIncomeRankLabels();

  // Process data for chart
  const chartData = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [];
    }

    console.log('Processing household data:', rawData.records);

    // Group by income rank
    const groupedData = rawData.records.map(record => {
      const quintileLabel = record.Quintile === 0
        ? 'ไม่ระบุรายได้'
        : `Q${record.Quintile}`;

      return {
        quintile: quintileLabel,
        quintileNumber: record.Quintile,
        incomeRank: record.income_rank,
        households: record.household_number
      };
    }).sort((a, b) => a.quintileNumber - b.quintileNumber);

    console.log('Grouped household data:', groupedData);
    return groupedData;
  }, [rawData]);

  // Custom tooltip
  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const quintileNumber = label.replace('Q', '').replace('ไม่ระบุรายได้', '0');
      const incomeLevel = incomeRankLabels && incomeRankLabels[quintileNumber]
        ? incomeRankLabels[quintileNumber]
        : data.incomeRank || '';

      return (
        <div className="bg-white p-4 border-2 border-blue-200 rounded-lg shadow-xl max-w-xs">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
            <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white font-bold rounded-full text-xs">
              {label}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-sm">{label}</h4>
              {incomeLevel && (
                <p className="text-xs text-blue-700 font-medium">{incomeLevel}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-700">จำนวนครัวเรือน</span>
              <span className="text-sm font-bold text-gray-900">
                {payload[0].value.toLocaleString()} ครัวเรือน
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
              จำนวนครัวเรือนจำแนกตามระดับรายได้
            </h2>
            <p className="text-xs text-gray-600">
              {provinceName}
            </p>
          </div>
          <ExportButton
            data={chartData}
            filename={`household_by_income_${provinceName}`}
          />
        </div>
      </div>

      <div className="px-6 py-4 bg-gradient-to-b from-gray-50 to-white">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 40, left: 30, bottom: 20 }}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient id="gradient-households" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5470C6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#5470C6" stopOpacity={0.7} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                strokeOpacity={0.5}
                vertical={false}
              />

              <XAxis
                dataKey="quintile"
                fontSize={13}
                fontWeight={600}
                angle={0}
                textAnchor="middle"
                height={60}
                stroke="#6b7280"
                tick={{ fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
              />

              <YAxis
                fontSize={12}
                fontWeight={500}
                stroke="#6b7280"
                tick={{ fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
                tickFormatter={(value) => value.toLocaleString()}
                label={{
                  value: 'ครัวเรือน',
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
                cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
              />

              <Legend
                wrapperStyle={{
                  fontSize: '13px',
                  fontWeight: 500,
                  paddingTop: '5px'
                }}
                iconType="circle"
                iconSize={10}
              />

              <Bar
                dataKey="households"
                name="จำนวนครัวเรือน"
                fill="url(#gradient-households)"
                radius={[8, 8, 0, 0]}
                stroke="#5470C6"
                strokeWidth={1}
                strokeOpacity={0.3}
              />
            </BarChart>
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

      {/* Income Rank Legend */}
      {incomeRankLabels && (
        <div className="px-6 pt-3 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-sm font-bold text-blue-900">
              คำอธิบายกลุ่มรายได้ (Income Quintiles)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(incomeRankLabels).map(([id, label]) => (
              <div key={id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white font-bold rounded-full text-sm">
                  Q{id}
                </div>
                <span className="text-sm text-gray-700 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Source Information */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">
              แหล่งข้อมูล: การสำรวจภาวะเศรษฐกิจและสังคมของครัวเรือน พ.ศ. 2566 สำนักงานสถิติแห่งชาติ
            </span>
          </div>
          {chartData.length > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium">
                จำนวนข้อมูล: {chartData.length} กลุ่ม
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HouseholdByIncomeChart;

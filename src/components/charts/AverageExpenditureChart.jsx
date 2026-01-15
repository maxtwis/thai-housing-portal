import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ExportButton from '../ExportButton';
import { useLocalExpenditureData } from '../../hooks/useLocalExpenditureData';
import { useIncomeRankLabels } from '../../hooks/useLocalAffordabilityData';

const AverageExpenditureChart = ({ provinceName, provinceId }) => {
  const [selectedExpType, setSelectedExpType] = useState('all');
  const { data, isLoading, isError } = useLocalExpenditureData(provinceId);
  const { data: incomeRankLabels } = useIncomeRankLabels();

  // Professional academic color palette - using purple/pink for expenditure
  const chartColor = '#9A60B4';

  // Expenditure type mapping
  const expenditureTypes = {
    all: 'ทั้งหมด',
    exp_water_electricity: 'น้ำประปา-ไฟฟ้า',
    exp_cooking_fuel: 'เชื้อเพลิงทำครัว',
    exp_garbage: 'ค่าขยะ',
    exp_services: 'บริการ',
    exp_health: 'สุขภาพ',
    exp_fuel: 'น้ำมันเชื้อเพลิง',
    exp_transportation: 'การเดินทาง',
    exp_food: 'อาหาร',
    exp_house_repair: 'ซ่อมแซมบ้าน',
    exp_rental: 'ค่าเช่า',
    exp_mortgage: 'ผ่อนบ้าน'
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data?.records) return [];

    if (selectedExpType === 'all') {
      // Show total expenditure for each income quintile
      return data.records.map(record => {
        const total =
          record.exp_water_electricity +
          record.exp_cooking_fuel +
          record.exp_garbage +
          record.exp_services +
          record.exp_health +
          record.exp_fuel +
          record.exp_transportation +
          record.exp_food +
          record.exp_house_repair +
          record.exp_rental +
          record.exp_mortgage;

        return {
          income_rank: `Q${record.income_rank_id}`,
          income_rank_id: record.income_rank_id,
          income_level: record.income_rank,
          value: total,
          label: 'รายจ่ายรวม'
        };
      });
    } else {
      // Show specific expenditure type
      return data.records.map(record => ({
        income_rank: `Q${record.income_rank_id}`,
        income_rank_id: record.income_rank_id,
        income_level: record.income_rank,
        value: record[selectedExpType],
        label: expenditureTypes[selectedExpType]
      }));
    }
  }, [data, selectedExpType]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          รายจ่ายเฉลี่ยตามระดับรายได้
        </h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">ไม่มีข้อมูล</div>
        </div>
      </div>
    );
  }

  // Custom tooltip
  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // Get income level from income_rank_id
      const incomeLevel = incomeRankLabels && incomeRankLabels[data.income_rank_id]
        ? incomeRankLabels[data.income_rank_id]
        : data.income_level || '';

      return (
        <div className="bg-white p-4 border-2 border-purple-200 rounded-lg shadow-xl max-w-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center justify-center w-7 h-7 bg-purple-600 text-white font-bold rounded-full text-xs flex-shrink-0">
              {data.income_rank}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-sm">
                {data.income_rank} {incomeLevel}
              </h4>
              <p className="text-xs text-gray-600">{data.label}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-700">รายจ่าย:</span>
              <span className="text-sm font-bold text-gray-900">
                {data.value.toLocaleString()} บาท
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Format Y-axis
  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              รายจ่ายเฉลี่ยตามระดับรายได้
            </h2>
            <p className="text-xs text-gray-500">{provinceName}</p>
          </div>

          <ExportButton
            data={chartData}
            filename={`average_expenditure_${provinceName}`}
          />
        </div>
      </div>

      {/* Filter Section */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            ประเภทรายจ่าย
          </label>
          <select
            value={selectedExpType}
            onChange={(e) => setSelectedExpType(e.target.value)}
            className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
          >
            {Object.entries(expenditureTypes).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="px-6 py-4 bg-gradient-to-b from-gray-50 to-white">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 40, left: 30, bottom: 20 }}
            barCategoryGap="20%"
          >
            <defs>
              <linearGradient id="gradient-expenditure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.9} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0.7} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              strokeOpacity={0.5}
              vertical={false}
            />

            <XAxis
              dataKey="income_rank"
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
              tickFormatter={formatYAxis}
              label={{
                value: 'บาท',
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
              cursor={{ fill: 'rgba(154, 96, 180, 0.08)' }}
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
              dataKey="value"
              name={chartData[0]?.label || 'รายจ่าย'}
              fill="url(#gradient-expenditure)"
              radius={[8, 8, 0, 0]}
              stroke={chartColor}
              strokeWidth={1}
              strokeOpacity={0.3}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Source Information */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">
              แหล่งข้อมูล: การสำรวจรายจ่ายของครัวเรือน สำนักงานสถิติแห่งชาติ
            </span>
          </div>
          {chartData.length > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="font-medium">
                จำนวนข้อมูล: {chartData.length} ระดับรายได้
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AverageExpenditureChart;

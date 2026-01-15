import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ExportButton from '../ExportButton';
import { useLocalHousingAveragePriceData } from '../../hooks/useLocalHousingData';

const HousingSupplyAveragePriceChart = ({ provinceName, provinceId }) => {
  const [selectedType, setSelectedType] = useState('all');
  const { data, isLoading, isError } = useLocalHousingAveragePriceData(provinceId);

  // Professional academic color palette - using orange/yellow for price data
  const chartColor = '#FAC858';

  // Get all unique housing types from data
  const housingTypes = useMemo(() => {
    if (!data?.records) return [];
    const types = [...new Set(data.records.map(r => r.supply_type))];
    return types.filter(t => t && t !== 'อื่น ๆ'); // Filter out null and "other"
  }, [data]);

  // Filter and prepare chart data
  const chartData = useMemo(() => {
    if (!data?.records) return [];

    let filteredData = data.records;

    // Filter by housing type
    if (selectedType !== 'all') {
      filteredData = filteredData.filter(row => row.supply_type === selectedType);
    }

    // Filter out records with 0 price
    filteredData = filteredData.filter(row => row.average_price > 0);

    // Sort by average price descending
    return filteredData.sort((a, b) => b.average_price - a.average_price);
  }, [data, selectedType]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2">
          ราคาเฉลี่ยอุปทานที่อยู่อาศัย - {provinceName}
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">ไม่มีข้อมูล</div>
        </div>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold text-gray-800 mb-1">{data.supply_type}</p>
          <p className="text-sm text-gray-600">
            ราคาเฉลี่ย: <span className="font-semibold">{data.average_price.toLocaleString()} บาท</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Format price for Y-axis (in millions)
  const formatPrice = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header with title and filter */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              ราคาเฉลี่ยอุปทานที่อยู่อาศัย
            </h2>
            <p className="text-xs text-gray-500">{provinceName}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Housing Type Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                ประเภทที่อยู่อาศัย
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
              >
                <option value="all">ทั้งหมด</option>
                {housingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <ExportButton
              data={chartData}
              filename={`housing_supply_average_price_${provinceName}`}
            />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-6 py-4 bg-gradient-to-b from-gray-50 to-white">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 40, left: 30, bottom: 80 }}
          >
            <defs>
              <linearGradient id="gradient-average-price" x1="0" y1="0" x2="0" y2="1">
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
              dataKey="supply_type"
              fontSize={13}
              fontWeight={600}
              angle={-45}
              textAnchor="end"
              height={100}
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
              tickFormatter={formatPrice}
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
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(250, 173, 88, 0.08)' }}
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
              dataKey="average_price"
              name="ราคาเฉลี่ย (บาท)"
              fill="url(#gradient-average-price)"
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
              แหล่งข้อมูล: การสำรวจอุปทานที่อยู่อาศัย สำนักงานสถิติแห่งชาติ
            </span>
          </div>
          {chartData.length > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="font-medium">
                จำนวนข้อมูล: {chartData.length} ประเภท (ไม่รวมรายการที่ราคาเป็น 0)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousingSupplyAveragePriceChart;

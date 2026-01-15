import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with title and filter */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              ราคาเฉลี่ยอุปทานที่อยู่อาศัย
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{provinceName}</p>
          </div>

          {/* Housing Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">ประเภท:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              {housingTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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
                <stop offset="100%" stopColor={chartColor} stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="supply_type"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 11, fill: '#4B5563' }}
              stroke="#9CA3AF"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#4B5563' }}
              stroke="#9CA3AF"
              tickFormatter={formatPrice}
              label={{
                value: 'ราคาเฉลี่ย (บาท)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11, fill: '#6B7280' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '5px', fontSize: '11px' }}
              iconType="rect"
            />
            <Bar
              dataKey="average_price"
              fill="url(#gradient-average-price)"
              name="ราคาเฉลี่ย (บาท)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Info note */}
      <div className="px-6 pt-3 pb-4 text-xs text-gray-500 border-t border-gray-100">
        <p>หมายเหตุ: ราคาเฉลี่ยของอุปทานที่อยู่อาศัยแต่ละประเภท (ไม่รวมรายการที่ราคาเป็น 0)</p>
      </div>
    </div>
  );
};

export default HousingSupplyAveragePriceChart;

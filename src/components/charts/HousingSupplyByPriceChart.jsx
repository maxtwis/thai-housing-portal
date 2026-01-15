import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ExportButton from '../ExportButton';
import { useLocalHousingSupplyData, usePriceRankLabels } from '../../hooks/useLocalHousingData';

const HousingSupplyByPriceChart = ({ provinceName, provinceId }) => {
  const [selectedMetric, setSelectedMetric] = useState('supply_unit');
  const [selectedHousingType, setSelectedHousingType] = useState('all');

  // Use local CSV data only
  const { data: rawData, isLoading, error, isFetching } = useLocalHousingSupplyData(provinceId);
  const { data: priceRankLabels } = usePriceRankLabels();

  // Get unique housing types
  const housingTypes = useMemo(() => {
    if (!rawData || !rawData.records) return [];
    const types = [...new Set(rawData.records.map(r => r.supply_type))];
    return ['all', ...types];
  }, [rawData]);

  // Metric options
  const metrics = {
    'supply_unit': 'อุปทานรวม (เช่า + ขาย)',
    'supply_rent': 'อุปทานเช่า',
    'supply_sale': 'อุปทานขาย'
  };

  // Process data for chart
  const chartData = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [];
    }

    console.log('Processing housing supply data:', rawData.records);

    // Filter by housing type if selected
    let filteredData = rawData.records;
    if (selectedHousingType !== 'all') {
      filteredData = rawData.records.filter(r => r.supply_type === selectedHousingType);
    }

    // Group by price rank and sum supply units
    const groupedByPriceRank = {};

    for (let i = 1; i <= 6; i++) {
      groupedByPriceRank[i] = {
        price_rank: `P${i}`,
        price_rank_number: i,
        supply_unit: 0,
        supply_rent: 0,
        supply_sale: 0,
        price_rank_rent: priceRankLabels?.[i]?.rent || '-',
        price_rank_sale: priceRankLabels?.[i]?.sale || '-'
      };
    }

    filteredData.forEach(item => {
      const priceRank = item.price_rank;
      if (priceRank >= 1 && priceRank <= 6) {
        groupedByPriceRank[priceRank].supply_unit += item.supply_unit;
        groupedByPriceRank[priceRank].supply_rent += item.supply_rent;
        groupedByPriceRank[priceRank].supply_sale += item.supply_sale;
      }
    });

    const result = Object.values(groupedByPriceRank).sort((a, b) => a.price_rank_number - b.price_rank_number);

    console.log('Grouped housing supply data:', result);
    return result;
  }, [rawData, selectedHousingType, priceRankLabels]);

  // Custom tooltip
  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const priceRankNum = label.replace('P', '');

      return (
        <div className="bg-white p-4 border-2 border-green-200 rounded-lg shadow-xl max-w-xs">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
            <div className="flex items-center justify-center w-7 h-7 bg-green-600 text-white font-bold rounded-full text-xs">
              {label}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-sm">ระดับราคา {label}</h4>
            </div>
          </div>
          <div className="space-y-1 mb-2 pb-2 border-b border-gray-100">
            <div className="text-xs text-gray-600">
              <span className="font-semibold">ค่าเช่า:</span> {data.price_rank_rent} บาท/เดือน
            </div>
            <div className="text-xs text-gray-600">
              <span className="font-semibold">ราคาขาย:</span> {data.price_rank_sale} บาท
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-700">อุปทานรวม</span>
              <span className="text-sm font-bold text-gray-900">
                {data.supply_unit.toLocaleString()} หน่วย
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-green-700">เช่า</span>
              <span className="text-xs font-semibold text-green-700">
                {data.supply_rent.toLocaleString()} หน่วย
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-blue-700">ขาย</span>
              <span className="text-xs font-semibold text-blue-700">
                {data.supply_sale.toLocaleString()} หน่วย
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
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              อุปทานที่อยู่อาศัยตามระดับราคา
            </h2>
            <p className="text-xs text-gray-600">
              {provinceName}
            </p>
          </div>
          <ExportButton
            data={chartData}
            filename={`housing_supply_by_price_${provinceName}`}
          />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Housing Type Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              ประเภทที่อยู่อาศัย
            </label>
            <select
              value={selectedHousingType}
              onChange={(e) => setSelectedHousingType(e.target.value)}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
            >
              <option value="all">ทั้งหมด</option>
              {housingTypes.filter(t => t !== 'all').map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Metric Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              ประเภทอุปทาน
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
            >
              {Object.entries(metrics).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
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
                <linearGradient id="gradient-supply" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#91CC75" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#91CC75" stopOpacity={0.7} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                strokeOpacity={0.5}
                vertical={false}
              />

              <XAxis
                dataKey="price_rank"
                fontSize={13}
                fontWeight={600}
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
                  value: 'หน่วย',
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
                cursor={{ fill: 'rgba(34, 197, 94, 0.08)' }}
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
                dataKey={selectedMetric}
                name={metrics[selectedMetric]}
                fill="url(#gradient-supply)"
                radius={[8, 8, 0, 0]}
                stroke="#91CC75"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                  กำลังโหลดข้อมูล...
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📊</div>
                  ไม่มีข้อมูลสำหรับการเลือกนี้
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Price Rank Legend */}
      {priceRankLabels && (
        <div className="px-6 pt-3 pb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-sm font-bold text-green-900">
              คำอธิบายระดับราคา (Price Ranks)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(priceRankLabels).map(([id, labels]) => (
              <div key={id} className="bg-white px-3 py-2 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center justify-center w-7 h-7 bg-green-600 text-white font-bold rounded-full text-xs">
                    P{id}
                  </div>
                  <span className="text-xs font-semibold text-gray-800">ระดับราคา {id}</span>
                </div>
                <div className="ml-9 space-y-0.5">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">เช่า:</span> {labels.rent} บาท/เดือน
                  </div>
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">ขาย:</span> {labels.sale} บาท
                  </div>
                </div>
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
              แหล่งข้อมูล: การสำรวจอุปทานที่อยู่อาศัย สำนักงานสถิติแห่งชาติ
            </span>
          </div>
          {chartData.length > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">
                รวม: {chartData.reduce((sum, item) => sum + item.supply_unit, 0).toLocaleString()} หน่วย
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousingSupplyByPriceChart;

import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ExportButton from '../ExportButton';
import { useLocalPopulationData } from '../../hooks/useLocalHouseholdData';

const PopulationByYearChart = ({ provinceName, provinceId }) => {
  // Use local CSV data only
  const { data: rawData, isLoading, error, isFetching } = useLocalPopulationData(provinceId);

  // Process data for chart - Convert AD year to BE year
  const chartData = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [];
    }

    console.log('Processing population data:', rawData.records);

    // Convert Christian year (AD) to Buddhist year (BE) by adding 543
    return rawData.records.map(record => ({
      ...record,
      year: record.year + 543,
      year_ad: record.year // Keep original for reference
    }));
  }, [rawData]);

  // Calculate Y-axis domain and ticks using OWID-inspired "nice" scaling
  const { yAxisTicks, yAxisDomain, yAxisUnit } = useMemo(() => {
    if (!chartData || chartData.length === 0) return { yAxisTicks: [], yAxisDomain: [0, 'auto'], yAxisUnit: 'คน' };

    const populations = chartData.map(d => d.population);
    const minPop = Math.min(...populations);
    const maxPop = Math.max(...populations);

    // Determine appropriate interval based on max population
    let interval;
    let unit;
    if (maxPop >= 1000000) {
      interval = 1000000; // 1M for provinces 1M+
      unit = 'ล้านคน'; // Million people
    } else if (maxPop >= 500000) {
      interval = 100000; // 100K for provinces 500K-1M
      unit = 'แสนคน'; // Hundred thousand people
    } else if (maxPop >= 100000) {
      interval = 50000; // 50K for provinces 100K-500K
      unit = 'แสนคน'; // Hundred thousand people
    } else {
      interval = 10000; // 10K for very small provinces (<100K)
      unit = 'หมื่นคน'; // Ten thousand people
    }

    // Calculate "nice" domain bounds (OWID approach)
    // Round min down to nearest interval, max up to nearest interval
    const niceMax = Math.ceil(maxPop / interval) * interval;

    // Always start domain at 0
    const domainMin = 0;
    const domainMax = niceMax;

    // Generate ticks from 0 to domain end
    const ticks = [];
    for (let tick = domainMin; tick <= domainMax; tick += interval) {
      ticks.push(tick);
    }

    return {
      yAxisTicks: ticks,
      yAxisDomain: [domainMin, domainMax],
      yAxisUnit: unit
    };
  }, [chartData]);

  // Custom tooltip - Our World in Data style
  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 shadow-lg rounded">
          <div className="text-sm font-semibold text-gray-900 mb-1">{label}</div>
          <div className="text-sm text-gray-700">
            จำนวนประชากร <span className="font-semibold text-gray-900">{payload[0].value.toLocaleString()}</span> คน
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
    <div className="bg-white border border-gray-200 shadow-sm">
      <div className="px-6 py-5 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
              จำนวนประชากรตามปี
            </h2>
            <p className="text-sm text-gray-600">
              {provinceName}
            </p>
          </div>
          <ExportButton
            data={chartData}
            filename={`population_by_year_${provinceName}`}
          />
        </div>
      </div>

      <div className="px-6 py-6 bg-white">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="0"
                stroke="#e0e0e0"
                strokeOpacity={0.5}
                horizontal={true}
                vertical={false}
              />

              <XAxis
                dataKey="year"
                fontSize={12}
                stroke="#666"
                tick={{ fill: '#666' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={false}
                height={50}
                dy={10}
              />

              <YAxis
                fontSize={12}
                stroke="#666"
                tick={{ fill: '#666' }}
                axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return (value / 1000000).toFixed(1) + 'M';
                  } else if (value >= 1000) {
                    return (value / 1000).toFixed(0) + 'K';
                  }
                  return value.toString();
                }}
                width={70}
                dx={-5}
                domain={yAxisDomain}
                ticks={yAxisTicks}
                allowDataOverflow={false}
                label={{
                  value: `ประชากร (${yAxisUnit})`,
                  angle: -90,
                  position: 'insideLeft',
                  style: {
                    textAnchor: 'middle',
                    fontSize: 12,
                    fill: '#666'
                  }
                }}
              />

              <Tooltip
                content={customTooltip}
                cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '3 3' }}
              />

              <Legend
                wrapperStyle={{
                  fontSize: '13px',
                  paddingTop: '10px'
                }}
                iconType="plainline"
                iconSize={16}
              />

              <Line
                type="monotone"
                dataKey="population"
                name="จำนวนประชากร"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
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
      <div className="px-6 py-3 border-t border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-gray-600">
          <div>
            แหล่งข้อมูล: สำนักงานสถิติแห่งชาติ
          </div>
          {chartData.length > 0 && (
            <div>
              ช่วงเวลา: {chartData[0].year} - {chartData[chartData.length - 1].year}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopulationByYearChart;

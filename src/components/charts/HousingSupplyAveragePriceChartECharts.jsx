import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import ExportButton from '../ExportButton';
import { useLocalHousingAveragePriceData } from '../../hooks/useLocalHousingData';

const HousingSupplyAveragePriceChartECharts = ({ provinceName, provinceId }) => {
  const [selectedType, setSelectedType] = useState('all');
  const { data, isLoading, isError } = useLocalHousingAveragePriceData(provinceId);

  // Professional color - using orange/yellow for price data
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

  // ECharts option configuration
  const option = useMemo(() => {
    if (!chartData || chartData.length === 0) return {};

    const categories = chartData.map(d => d.supply_type);
    const values = chartData.map(d => d.average_price);
    const maxValue = Math.max(...values);

    // Format price for Y-axis
    const formatPrice = (value) => {
      if (value >= 1000000) {
        const millions = value / 1000000;
        return millions % 1 === 0 ? millions + 'M' : millions.toFixed(1) + 'M';
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
      }
      return value.toLocaleString();
    };

    return {
      grid: {
        left: 80,
        right: 40,
        top: 40,
        bottom: 100
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: {
          lineStyle: {
            color: '#d1d5db',
            width: 1
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#666',
          fontSize: 12,
          fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif',
          fontWeight: 600,
          rotate: 0,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: 'บาท',
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          color: '#666',
          fontSize: 12,
          fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif',
          fontWeight: 600
        },
        axisLine: {
          lineStyle: {
            color: '#d1d5db',
            width: 1
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#666',
          fontSize: 12,
          fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif',
          formatter: formatPrice
        },
        splitLine: {
          lineStyle: {
            color: '#e0e0e0',
            opacity: 0.5
          }
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(250, 200, 88, 0.1)'
          }
        },
        backgroundColor: '#fff',
        borderColor: '#d1d5db',
        borderWidth: 1,
        padding: 12,
        textStyle: {
          color: '#374151',
          fontSize: 14,
          fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif'
        },
        formatter: (params) => {
          const param = params[0];
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${param.name}</div>
            <div>ราคาเฉลี่ย <span style="font-weight: 600;">${param.value.toLocaleString()}</span> บาท</div>
          `;
        }
      },
      series: [
        {
          name: 'ราคาเฉลี่ย (บาท)',
          type: 'bar',
          data: values,
          itemStyle: {
            color: chartColor,
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#F4B740',
              shadowBlur: 10,
              shadowColor: 'rgba(250, 200, 88, 0.3)'
            }
          },
          barWidth: '60%'
        }
      ]
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            ราคาเฉลี่ยอุปทานที่อยู่อาศัย
          </h2>
          <p className="text-sm text-gray-600">{provinceName}</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">ไม่มีข้อมูล</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm">
      <div className="px-6 py-5 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              ราคาเฉลี่ยอุปทานที่อยู่อาศัย
            </h2>
            <p className="text-sm text-gray-600">
              {provinceName}
            </p>
          </div>
          <ExportButton
            data={chartData}
            filename={`housing_supply_average_price_${provinceName}`}
          />
        </div>

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
      </div>

      {/* Chart */}
      <div className="px-6 py-6 bg-white">
        <ReactECharts
          option={option}
          style={{ height: '400px' }}
          opts={{ renderer: 'svg' }}
        />
      </div>

      {/* Data Source Information */}
      <div className="px-6 py-3 border-t border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-gray-600">
          <div>
            แหล่งข้อมูล: การสำรวจอุปทานที่อยู่อาศัย สำนักงานสถิติแห่งชาติ
          </div>
          {chartData.length > 0 && (
            <div>
              จำนวนข้อมูล: {chartData.length} ประเภท (ไม่รวมรายการที่ราคาเป็น 0)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousingSupplyAveragePriceChartECharts;

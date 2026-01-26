import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import ExportButton from '../ExportButton';
import { useLocalHousingSupplyData, usePriceRankLabels } from '../../hooks/useLocalHousingData';

const HousingSupplyByPriceChartECharts = ({ provinceName, provinceId }) => {
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
    return result;
  }, [rawData, selectedHousingType, priceRankLabels]);

  // ECharts option configuration
  const option = useMemo(() => {
    if (!chartData || chartData.length === 0) return {};

    const categories = chartData.map(d => d.price_rank);
    const values = chartData.map(d => d[selectedMetric]);

    return {
      grid: {
        left: 80,
        right: 40,
        top: 40,
        bottom: 60
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
          fontWeight: 600
        }
      },
      yAxis: {
        type: 'value',
        name: 'หน่วย',
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
          formatter: (value) => value.toLocaleString()
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
            color: 'rgba(145, 204, 117, 0.1)'
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
          const dataIndex = param.dataIndex;
          const data = chartData[dataIndex];

          return `
            <div style="font-weight: 600; margin-bottom: 8px;">${param.name}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
              <div>ค่าเช่า: ${data.price_rank_rent} บาท/เดือน</div>
              <div>ราคาขาย: ${data.price_rank_sale} บาท</div>
            </div>
            <div style="margin-bottom: 4px;">
              <strong>อุปทานรวม:</strong> ${data.supply_unit.toLocaleString()} หน่วย
            </div>
            <div style="font-size: 12px; color: #16a34a;">
              เช่า: ${data.supply_rent.toLocaleString()} หน่วย
            </div>
            <div style="font-size: 12px; color: #2563eb;">
              ขาย: ${data.supply_sale.toLocaleString()} หน่วย
            </div>
          `;
        }
      },
      series: [
        {
          name: metrics[selectedMetric],
          type: 'bar',
          data: values,
          itemStyle: {
            color: '#91CC75',
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#7CB560',
              shadowBlur: 10,
              shadowColor: 'rgba(145, 204, 117, 0.3)'
            }
          },
          barWidth: '60%'
        }
      ]
    };
  }, [chartData, selectedMetric]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
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
              อุปทานที่อยู่อาศัยตามระดับราคา
            </h2>
            <p className="text-sm text-gray-600">
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

      <div className="px-6 py-6 bg-white">
        {chartData.length > 0 ? (
          <ReactECharts
            option={option}
            style={{ height: '400px' }}
            opts={{ renderer: 'svg' }}
          />
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
        <div className="px-6 pt-4 pb-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-sm font-semibold text-gray-900">
              คำอธิบายระดับราคา
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(priceRankLabels).map(([id, labels]) => (
              <div key={id} className="flex items-start gap-2 bg-white px-3 py-2 rounded border border-gray-200">
                <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white font-bold rounded-full text-sm shrink-0">
                  P{id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 mb-1">ระดับราคา {id}</div>
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">เช่า:</span> {labels.rent}
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">ขาย:</span> {labels.sale}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Source Information */}
      <div className="px-6 py-3 border-t border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-gray-600">
          <div>
            แหล่งข้อมูล: การสำรวจอุปทานที่อยู่อาศัย สำนักงานสถิติแห่งชาติ
          </div>
          {chartData.length > 0 && (
            <div>
              รวม: {chartData.reduce((sum, item) => sum + item.supply_unit, 0).toLocaleString()} หน่วย
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousingSupplyByPriceChartECharts;

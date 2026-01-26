import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import ExportButton from '../ExportButton';
import { useLocalPopulationData } from '../../hooks/useLocalHouseholdData';

const PopulationByYearChartECharts = ({ provinceName, provinceId }) => {
  // Use local CSV data only
  const { data: rawData, isLoading, error, isFetching } = useLocalPopulationData(provinceId);

  // Process data for chart - Convert AD year to BE year
  const chartData = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [];
    }

    // Convert Christian year (AD) to Buddhist year (BE) by adding 543
    return rawData.records.map(record => ({
      ...record,
      year: record.year + 543,
      year_ad: record.year // Keep original for reference
    }));
  }, [rawData]);

  // Calculate Y-axis configuration
  const yAxisConfig = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        min: 0,
        max: 100000,
        interval: 10000,
        unit: 'คน',
        formatter: (value) => value.toLocaleString()
      };
    }

    const populations = chartData.map(d => d.population);
    const minPop = Math.min(...populations);
    const maxPop = Math.max(...populations);

    // Determine appropriate interval based on max population
    let interval, unit, formatter;

    if (maxPop >= 1000000) {
      interval = 1000000; // 1M for provinces 1M+
      unit = 'ล้านคน'; // Million people
      formatter = (value) => {
        const millions = value / 1000000;
        return millions % 1 === 0 ? millions + 'M' : millions.toFixed(1) + 'M';
      };
    } else if (maxPop >= 500000) {
      interval = 100000; // 100K for provinces 500K-1M
      unit = 'แสนคน'; // Hundred thousand people
      formatter = (value) => (value / 1000) + 'K';
    } else if (maxPop >= 100000) {
      interval = 50000; // 50K for provinces 100K-500K
      unit = 'แสนคน'; // Hundred thousand people
      formatter = (value) => (value / 1000) + 'K';
    } else {
      interval = 10000; // 10K for very small provinces (<100K)
      unit = 'หมื่นคน'; // Ten thousand people
      formatter = (value) => (value / 1000) + 'K';
    }

    const niceMax = Math.ceil(maxPop / interval) * interval;

    return {
      min: 0,
      max: niceMax,
      interval,
      unit,
      formatter
    };
  }, [chartData]);

  // ECharts option configuration
  const option = useMemo(() => {
    if (!chartData || chartData.length === 0) return {};

    const years = chartData.map(d => d.year);
    const populations = chartData.map(d => d.population);

    // Find min and max values for annotations
    const maxPop = Math.max(...populations);
    const minPop = Math.min(...populations);
    const maxIndex = populations.indexOf(maxPop);
    const minIndex = populations.indexOf(minPop);

    // Calculate population change
    const firstPop = populations[0];
    const lastPop = populations[populations.length - 1];
    const popChange = lastPop - firstPop;
    const popChangePercent = ((popChange / firstPop) * 100).toFixed(1);
    const isGrowth = popChange > 0;

    // Determine if peak is in top 20% of chart (label should go below)
    const peakRatio = (maxPop - yAxisConfig.min) / (yAxisConfig.max - yAxisConfig.min);
    const labelPosition = peakRatio > 0.85 ? 'bottom' : 'top';

    // Detect significant changes (drops or spikes > 2%)
    const changes = [];
    for (let i = 1; i < populations.length; i++) {
      const change = ((populations[i] - populations[i-1]) / populations[i-1]) * 100;
      if (Math.abs(change) > 2) {
        changes.push({ index: i, year: years[i], change: change.toFixed(1) });
      }
    }

    return {
      grid: {
        left: 80,
        right: 40,
        top: 80,
        bottom: 60
      },
      xAxis: {
        type: 'category',
        data: years,
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
          fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif'
        }
      },
      yAxis: {
        type: 'value',
        min: yAxisConfig.min,
        max: yAxisConfig.max,
        interval: yAxisConfig.interval,
        name: `ประชากร (${yAxisConfig.unit})`,
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          color: '#666',
          fontSize: 12,
          fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif'
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
          formatter: yAxisConfig.formatter,
          fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif'
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
            <div style="font-weight: 600; margin-bottom: 4px;">${param.axisValue}</div>
            <div>จำนวนประชากร <span style="font-weight: 600;">${param.value.toLocaleString()}</span> คน</div>
          `;
        }
      },
      series: [
        {
          name: 'จำนวนประชากร',
          type: 'line',
          data: populations,
          smooth: false,
          lineStyle: {
            color: '#6366f1',
            width: 2.5
          },
          itemStyle: {
            color: '#6366f1'
          },
          symbol: 'circle',
          symbolSize: 6,
          emphasis: {
            itemStyle: {
              color: '#6366f1',
              borderColor: '#fff',
              borderWidth: 2,
              shadowBlur: 4,
              shadowColor: 'rgba(99, 102, 241, 0.3)'
            },
            scale: 1.5
          },
          // Mark the max point with annotation
          markPoint: {
            data: [
              {
                name: 'Peak',
                type: 'max',
                label: {
                  show: true,
                  position: labelPosition,
                  distance: 15,
                  formatter: (params) => {
                    return `สูงสุด: ${params.value.toLocaleString()} คน\n(ปี ${years[maxIndex]})`;
                  },
                  fontSize: 11,
                  fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif',
                  color: '#374151',
                  backgroundColor: '#fff',
                  borderColor: '#6366f1',
                  borderWidth: 1,
                  padding: [6, 10],
                  borderRadius: 4,
                  shadowBlur: 4,
                  shadowColor: 'rgba(0,0,0,0.1)'
                },
                itemStyle: {
                  color: '#6366f1',
                  borderColor: '#fff',
                  borderWidth: 2
                }
              }
            ],
            symbol: 'circle',
            symbolSize: 10
          },
          // Add reference area if there's a significant trend
          markArea: {
            silent: true,
            data: isGrowth ? [
              [
                {
                  name: 'แนวโน้มเติบโต',
                  xAxis: years[0],
                  itemStyle: {
                    color: 'rgba(99, 102, 241, 0.05)'
                  },
                  label: {
                    show: true,
                    position: 'insideTop',
                    formatter: `แนวโน้มเติบโต ${popChangePercent}%`,
                    fontSize: 11,
                    fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif',
                    color: '#059669',
                    fontWeight: 600
                  }
                },
                {
                  xAxis: years[years.length - 1]
                }
              ]
            ] : [
              [
                {
                  name: 'แนวโน้มลดลง',
                  xAxis: years[0],
                  itemStyle: {
                    color: 'rgba(239, 68, 68, 0.05)'
                  },
                  label: {
                    show: true,
                    position: 'insideTop',
                    formatter: `แนวโน้มลดลง ${popChangePercent}%`,
                    fontSize: 11,
                    fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif',
                    color: '#dc2626',
                    fontWeight: 600
                  }
                },
                {
                  xAxis: years[years.length - 1]
                }
              ]
            ]
          }
        }
      ]
    };
  }, [chartData, yAxisConfig]);

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
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
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

export default PopulationByYearChartECharts;

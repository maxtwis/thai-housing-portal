import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import ExportButton from '../ExportButton';
import { useLocalHouseholdByIncomeData } from '../../hooks/useLocalHouseholdData';
import { useIncomeRankLabels } from '../../hooks/useLocalAffordabilityData';
import { useResponsive, getResponsiveChartConfig } from '../../hooks/useResponsive';

const HouseholdByIncomeChartECharts = ({ provinceName, provinceId }) => {
  // Use local CSV data only
  const { data: rawData, isLoading, error, isFetching } = useLocalHouseholdByIncomeData(provinceId);
  const { isMobile } = useResponsive();

  // Load income rank labels for legend
  const { data: incomeRankLabels } = useIncomeRankLabels();

  // Process data for chart
  const chartData = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [];
    }

    // Group by income rank
    const groupedData = rawData.records.map(record => {
      const quintileLabel = record.Quintile === 0
        ? 'ไม่ระบุรายได้'
        : `กลุ่ม ${record.Quintile}`;

      return {
        quintile: quintileLabel,
        quintileNumber: record.Quintile,
        incomeRank: record.income_rank,
        households: record.household_number
      };
    }).sort((a, b) => a.quintileNumber - b.quintileNumber);

    return groupedData;
  }, [rawData]);

  // ECharts option configuration
  const option = useMemo(() => {
    if (!chartData || chartData.length === 0) return {};

    const categories = chartData.map(d => d.quintile);
    const values = chartData.map(d => d.households);
    const responsive = getResponsiveChartConfig(isMobile, false);

    return {
      grid: responsive.grid,
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
          ...responsive.xAxisLabel,
          color: '#666',
          fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif'
        }
      },
      yAxis: {
        type: 'value',
        name: 'ครัวเรือน',
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
            color: 'rgba(99, 102, 241, 0.1)'
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
          const quintileNumber = param.name.replace('กลุ่ม ', '').replace('ไม่ระบุรายได้', '0');
          const incomeLevel = incomeRankLabels && incomeRankLabels[quintileNumber]
            ? incomeRankLabels[quintileNumber]
            : '';

          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${param.name}</div>
            ${incomeLevel ? `<div style="color: #6366f1; font-size: 12px; margin-bottom: 4px;">${incomeLevel}</div>` : ''}
            <div>จำนวนครัวเรือน <span style="font-weight: 600;">${param.value.toLocaleString()}</span> ครัวเรือน</div>
          `;
        }
      },
      series: [
        {
          name: 'จำนวนครัวเรือน',
          type: 'bar',
          data: values,
          itemStyle: {
            color: '#6366f1',
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#4f46e5',
              shadowBlur: 10,
              shadowColor: 'rgba(99, 102, 241, 0.3)'
            }
          },
          barWidth: '60%'
        }
      ]
    };
  }, [chartData, incomeRankLabels, isMobile]);

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
              จำนวนครัวเรือนจำแนกตามระดับรายได้
            </h2>
            <p className="text-sm text-gray-600">
              {provinceName}
            </p>
          </div>
          <ExportButton
            data={chartData}
            filename={`household_by_income_${provinceName}`}
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

      {/* Income Rank Legend */}
      {incomeRankLabels && (
        <div className="px-6 pt-4 pb-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-sm font-semibold text-gray-900">
              คำอธิบายกลุ่มรายได้
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(incomeRankLabels).map(([id, label]) => (
              <div key={id} className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white font-bold rounded-full text-sm shrink-0">
                  {id}
                </div>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Source Information */}
      <div className="px-6 py-3 border-t border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-gray-600">
          <div>
            แหล่งข้อมูล: การสำรวจภาวะเศรษฐกิจและสังคมของครัวเรือน พ.ศ. 2566 สำนักงานสถิติแห่งชาติ
          </div>
          {chartData.length > 0 && (
            <div>
              จำนวนข้อมูล: {chartData.length} กลุ่ม
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HouseholdByIncomeChartECharts;

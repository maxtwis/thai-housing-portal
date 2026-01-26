import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import ExportButton from '../ExportButton';
import { useLocalExpenditureData } from '../../hooks/useLocalExpenditureData';
import { useIncomeRankLabels } from '../../hooks/useLocalAffordabilityData';

const AverageExpenditureChartECharts = ({ provinceName, provinceId }) => {
  const [selectedExpType, setSelectedExpType] = useState('all');
  const { data, isLoading, isError } = useLocalExpenditureData(provinceId);
  const { data: incomeRankLabels } = useIncomeRankLabels();

  // Professional color - using purple for expenditure
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
          income_rank: `กลุ่ม ${record.income_rank_id}`,
          income_rank_id: record.income_rank_id,
          income_level: record.income_rank,
          value: total,
          label: 'รายจ่ายรวม'
        };
      });
    } else {
      // Show specific expenditure type
      return data.records.map(record => ({
        income_rank: `กลุ่ม ${record.income_rank_id}`,
        income_rank_id: record.income_rank_id,
        income_level: record.income_rank,
        value: record[selectedExpType],
        label: expenditureTypes[selectedExpType]
      }));
    }
  }, [data, selectedExpType]);

  // ECharts option configuration
  const option = useMemo(() => {
    if (!chartData || chartData.length === 0) return {};

    const categories = chartData.map(d => d.income_rank);
    const values = chartData.map(d => d.value);

    // Format Y-axis
    const formatYAxis = (value) => {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    };

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
          formatter: formatYAxis
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
            color: 'rgba(154, 96, 180, 0.1)'
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

          const incomeLevel = incomeRankLabels && incomeRankLabels[data.income_rank_id]
            ? incomeRankLabels[data.income_rank_id]
            : data.income_level || '';

          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${param.name}</div>
            ${incomeLevel ? `<div style="font-size: 12px; color: #9A60B4; margin-bottom: 8px;">${incomeLevel}</div>` : ''}
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${data.label}</div>
            <div>รายจ่าย <span style="font-weight: 600;">${param.value.toLocaleString()}</span> บาท</div>
          `;
        }
      },
      series: [
        {
          name: chartData[0]?.label || 'รายจ่าย',
          type: 'bar',
          data: values,
          itemStyle: {
            color: chartColor,
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#8A50A4',
              shadowBlur: 10,
              shadowColor: 'rgba(154, 96, 180, 0.3)'
            }
          },
          barWidth: '60%'
        }
      ]
    };
  }, [chartData, incomeRankLabels]);

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
            รายจ่ายเฉลี่ยตามระดับรายได้
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
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              รายจ่ายเฉลี่ยตามระดับรายได้
            </h2>
            <p className="text-sm text-gray-600">{provinceName}</p>
          </div>
          <ExportButton
            data={chartData}
            filename={`average_expenditure_${provinceName}`}
          />
        </div>

        {/* Filter Section */}
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
            แหล่งข้อมูล: การสำรวจรายจ่ายของครัวเรือน สำนักงานสถิติแห่งชาติ
          </div>
          {chartData.length > 0 && (
            <div>
              จำนวนข้อมูล: {chartData.length} ระดับรายได้
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AverageExpenditureChartECharts;

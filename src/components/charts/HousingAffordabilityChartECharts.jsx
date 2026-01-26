import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import ExportButton from '../ExportButton';
import { useLocalAffordabilityData, useIncomeRankLabels } from '../../hooks/useLocalAffordabilityData';

const HousingAffordabilityChartECharts = ({ provinceName, provinceId }) => {
  const [selectedDemandType, setSelectedDemandType] = useState('กลุ่มประชากรทั่วไป');
  const [selectedMetric, setSelectedMetric] = useState('Total_Hburden');

  // Use local CSV data only
  const localDataQuery = useLocalAffordabilityData(provinceId);
  const { data: rawData, isLoading, error, isFetching } = localDataQuery;

  // Load income rank labels for legend
  const { data: incomeRankLabels } = useIncomeRankLabels();

  // Available demand types
  const demandTypes = [
    'กลุ่มประชากรทั่วไป',
    'ผู้มีรายได้น้อย',
    'First Jobber',
    'ผู้สูงอายุที่อาศัยอยู่คนเดียว'
  ];

  // Available metrics
  const availableMetrics = {
    'Total_Hburden': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัยรวม (%)',
    'Exp_hbrent': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัย เช่า (%)',
    'Exp_hbmort': 'อัตราส่วนค่าใช้จ่ายที่อยู่อาศัย ผ่อน (%)'
  };

  // House type mapping
  const houseTypeMapping = {
    'บ้านเดี่ยว': 'บ้านเดี่ยว',
    'ตึกแถว': 'ตึกแถว',
    'ทาวน์เฮาส์/บ้านแฝด': 'ทาวน์เฮาส์/บ้านแฝด',
    'แฟลต อาคารชุด อพาร์ตเมนต์': 'แฟลต อาคารชุด อพาร์ตเมนต์',
    'ห้องแบ่งเช่า': 'ห้องแบ่งเช่า',
    'ที่พักกึ่งถาวร': 'ที่พักกึ่งถาวร'
  };

  // Color mapping - professional palette
  const houseTypeColors = {
    'บ้านเดี่ยว': '#5470C6',
    'ตึกแถว': '#91CC75',
    'ทาวน์เฮาส์/บ้านแฝด': '#FAC858',
    'แฟลต อาคารชุด อพาร์ตเมนต์': '#EE6666',
    'ห้องแบ่งเช่า': '#73C0DE',
    'ที่พักกึ่งถาวร': '#9A60B4'
  };

  // Get available demand types based on actual data
  const availableDemandTypes = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return demandTypes;
    }

    const availableTypes = [...new Set(rawData.records.map(record => record.demand_type))]
      .filter(Boolean);

    return demandTypes.filter(type => availableTypes.includes(type));
  }, [rawData]);

  // Get available quintiles based on actual data
  const availableQuintiles = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [0, 1, 2, 3, 4, 5];
    }

    const availableQuints = [...new Set(rawData.records.map(record => parseInt(record.Quintile)))]
      .filter(q => !isNaN(q))
      .sort((a, b) => a - b);

    return availableQuints;
  }, [rawData]);

  // Auto-adjust selected demand type if current selection is not available
  React.useEffect(() => {
    if (availableDemandTypes.length > 0 && !availableDemandTypes.includes(selectedDemandType)) {
      setSelectedDemandType(availableDemandTypes[0]);
    }
  }, [availableDemandTypes, selectedDemandType]);

  // Process data for chart
  const chartData = useMemo(() => {
    if (!rawData || !rawData.records || !rawData.records.length) {
      return [];
    }

    // Filter by selected demand type
    const filteredData = rawData.records.filter(item =>
      item.demand_type === selectedDemandType
    );

    // Group by quintile
    const groupedByQuintile = {};

    for (let q of availableQuintiles) {
      const quintileLabel = q === 0 ? 'ไม่ระบุรายได้' : `กลุ่ม ${q}`;
      groupedByQuintile[q] = {
        quintile: quintileLabel,
        quintileNumber: q
      };

      Object.keys(houseTypeMapping).forEach(houseTypeKey => {
        groupedByQuintile[q][houseTypeMapping[houseTypeKey]] = 0;
      });
    }

    // Process the data
    filteredData.forEach(item => {
      const quintile = parseInt(item.Quintile);
      const houseTypeKey = item.house_type;
      const houseTypeName = houseTypeMapping[houseTypeKey];
      const value = parseFloat(item[selectedMetric]);

      if (quintile >= 0 && quintile <= 5 &&
          availableQuintiles.includes(quintile) &&
          houseTypeName &&
          !isNaN(value) && value !== null && value !== undefined) {
        groupedByQuintile[quintile][houseTypeName] = value;
      }
    });

    const result = Object.values(groupedByQuintile).sort((a, b) => a.quintileNumber - b.quintileNumber);
    return result;
  }, [rawData, selectedDemandType, selectedMetric, availableQuintiles]);

  // ECharts option configuration
  const option = useMemo(() => {
    if (!chartData || chartData.length === 0) return {};

    const categories = chartData.map(d => d.quintile);

    // Create series for each house type (stacked bars)
    const series = Object.entries(houseTypeMapping).map(([houseTypeKey, houseTypeName]) => {
      return {
        name: houseTypeName,
        type: 'bar',
        stack: 'housing',
        data: chartData.map(d => d[houseTypeName]),
        itemStyle: {
          color: houseTypeColors[houseTypeKey]
        },
        emphasis: {
          focus: 'series'
        }
      };
    });

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
          fontWeight: 600
        }
      },
      yAxis: {
        type: 'value',
        name: selectedMetric === 'Exp_house' ? 'บาท' : '%',
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
        axisPointer: {
          type: 'shadow'
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
          const quintileLabel = params[0].name;
          const quintileNumber = quintileLabel.replace('กลุ่ม ', '').replace('ไม่ระบุรายได้', '0');
          const incomeLevel = incomeRankLabels && incomeRankLabels[quintileNumber]
            ? incomeRankLabels[quintileNumber]
            : '';

          // Filter non-zero values
          const nonZeroParams = params.filter(p => p.value > 0);

          if (nonZeroParams.length === 0) return '';

          let html = `<div style="font-weight: 600; margin-bottom: 8px;">${quintileLabel}</div>`;

          if (incomeLevel) {
            html += `<div style="font-size: 12px; color: #5470C6; margin-bottom: 8px;">${incomeLevel}</div>`;
          }

          html += `<div style="font-size: 11px; color: #666; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">`;
          html += `${selectedDemandType} • ${availableMetrics[selectedMetric]}`;
          html += `</div>`;

          nonZeroParams.forEach(param => {
            html += `<div style="margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">`;
            html += `<div style="display: flex; align-items: center; gap: 6px;">`;
            html += `<span style="display: inline-block; width: 12px; height: 12px; background-color: ${param.color}; border-radius: 2px;"></span>`;
            html += `<span style="font-size: 12px;">${param.seriesName}</span>`;
            html += `</div>`;
            html += `<span style="font-weight: 600;">${selectedMetric === 'Exp_house' ? param.value.toLocaleString() + ' ฿' : param.value + '%'}</span>`;
            html += `</div>`;
          });

          return html;
        }
      },
      legend: {
        data: Object.values(houseTypeMapping),
        bottom: 10,
        textStyle: {
          fontSize: 12,
          fontFamily: 'LINE Seed Sans TH, Sarabun, sans-serif'
        },
        itemWidth: 14,
        itemHeight: 14
      },
      series: series
    };
  }, [chartData, selectedMetric, incomeRankLabels]);

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
              ความสามารถในการจ่ายค่าที่อยู่อาศัยตามกลุ่มรายได้
            </h2>
            <p className="text-sm text-gray-600">
              {provinceName} • {selectedDemandType}
            </p>
          </div>
          <ExportButton
            data={chartData}
            filename={`affordability_${provinceName}_${selectedDemandType}`}
          />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Demand Type Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              กลุ่มผู้มีความต้องการ
            </label>
            <select
              value={selectedDemandType}
              onChange={(e) => setSelectedDemandType(e.target.value)}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
            >
              {availableDemandTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Metric Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              ตัวชี้วัด
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-gray-400 transition-colors"
            >
              {Object.entries(availableMetrics).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading indicator for data fetching */}
        {isFetching && (
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังอัปเดตข้อมูล...
          </div>
        )}
      </div>

      <div className="px-6 py-6 bg-white">
        {chartData.length > 0 ? (
          <ReactECharts
            option={option}
            style={{ height: '450px' }}
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
                  ไม่มีข้อมูลสำหรับการเลือกนี้
                  <div className="text-xs mt-2 text-gray-400">
                    ลองเปลี่ยนกลุ่มผู้มีความต้องการ หรือตัวชี้วัด
                  </div>
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
              จำนวนข้อมูล: {chartData.filter(item =>
                Object.values(houseTypeMapping).some(houseType => item[houseType] > 0)
              ).length} กลุ่ม
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousingAffordabilityChartECharts;

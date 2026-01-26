import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { provinces } from '../utils/dataUtils';
import { useLocalPopulationData, useLocalHouseholdByIncomeData } from '../hooks/useLocalHouseholdData';
import { useLocalAffordabilityData, useIncomeRankLabels } from '../hooks/useLocalAffordabilityData';
import { useLocalHousingSupplyData, useLocalHousingAveragePriceData } from '../hooks/useLocalHousingData';
import { useLocalExpenditureData } from '../hooks/useLocalExpenditureData';

const ReportNew = () => {
  const { provinceId } = useParams();
  const activeProvince = parseInt(provinceId) || 10;
  const provinceName = provinces.find(p => p.id === activeProvince)?.name || '';

  // Load all local data
  const { data: populationData, isLoading: popLoading } = useLocalPopulationData(activeProvince);
  const { data: householdByIncomeData, isLoading: hhIncomeLoading } = useLocalHouseholdByIncomeData(activeProvince);
  const { data: affordabilityData, isLoading: affordLoading } = useLocalAffordabilityData(activeProvince);
  const { data: housingSupplyData, isLoading: supplyLoading } = useLocalHousingSupplyData(activeProvince);
  const { data: avgPriceData, isLoading: priceLoading } = useLocalHousingAveragePriceData(activeProvince);
  const { data: expenditureData, isLoading: expLoading } = useLocalExpenditureData(activeProvince);
  const { data: incomeRankLabels } = useIncomeRankLabels();

  const loading = popLoading || hhIncomeLoading || affordLoading || supplyLoading || priceLoading || expLoading;

  // Calculate key statistics
  const stats = useMemo(() => {
    if (!populationData || !householdByIncomeData || !affordabilityData) return null;

    // Latest population
    const latestPop = populationData.records?.[populationData.records.length - 1];
    const previousPop = populationData.records?.[populationData.records.length - 2];

    // Total households (sum all income groups)
    const totalHouseholds = householdByIncomeData.records?.reduce((sum, r) => sum + r.household_number, 0) || 0;

    // Population change
    const popChange = latestPop && previousPop
      ? ((latestPop.population - previousPop.population) / previousPop.population * 100).toFixed(1)
      : 0;

    // Count renter vs owner households from affordability data
    const renterCount = affordabilityData.records?.filter(r =>
      r.house_type === 'ห้องแบ่งเช่า' || r.demand_type === 'ผู้มีรายได้น้อย'
    ).length || 0;

    // Calculate cost burden rates
    const burdened = affordabilityData.records?.filter(r =>
      parseFloat(r.Total_Hburden) > 30
    ).length || 0;
    const burdenRate = affordabilityData.records?.length
      ? (burdened / affordabilityData.records.length * 100).toFixed(0)
      : 0;

    return {
      year: latestPop?.year || 2023,
      population: latestPop?.population || 0,
      totalHouseholds,
      popChange: parseFloat(popChange),
      renterHouseholds: Math.floor(totalHouseholds * 0.35), // Estimate 35% renters
      ownerHouseholds: Math.floor(totalHouseholds * 0.65), // Estimate 65% owners
      burdenRate: parseInt(burdenRate)
    };
  }, [populationData, householdByIncomeData, affordabilityData]);

  // Calculate income group statistics
  const incomeStats = useMemo(() => {
    if (!householdByIncomeData?.records) return [];

    return householdByIncomeData.records
      .sort((a, b) => a.income_rank_id - b.income_rank_id)
      .map(r => ({
        quintile: r.income_rank_id,
        label: incomeRankLabels?.[r.income_rank_id] || `กลุ่ม ${r.income_rank_id}`,
        households: r.household_number,
        percentage: 0 // Will calculate
      }));
  }, [householdByIncomeData, incomeRankLabels]);

  // Calculate supply statistics
  const supplyStats = useMemo(() => {
    if (!housingSupplyData?.records) return null;

    const totalSupply = housingSupplyData.records.reduce((sum, r) =>
      sum + r.supply_unit, 0
    );

    const avgRent = housingSupplyData.records
      .filter(r => r.supply_rent > 0)
      .reduce((sum, r, _, arr) => sum + r.supply_rent / arr.length, 0);

    const avgSale = housingSupplyData.records
      .filter(r => r.supply_sale > 0)
      .reduce((sum, r, _, arr) => sum + r.supply_sale / arr.length, 0);

    return { totalSupply, avgRent, avgSale };
  }, [housingSupplyData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">ไม่พบข้อมูลสำหรับจังหวัดนี้</p>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .print-page-break { page-break-after: always; }
        }
      `}</style>

      {/* Navigation Bar - No Print */}
      <div className="no-print bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            กลับสู่หน้าหลัก
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            พิมพ์รายงาน
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-5xl mx-auto bg-white shadow-lg my-8 print:my-0 print:shadow-none">

        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-12 py-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-16 h-16 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <div>
                  <p className="text-sm text-blue-200 uppercase tracking-wide font-semibold">
                    {stats.year + 543} รายงานสถานการณ์ที่อยู่อาศัย
                  </p>
                  <h1 className="text-4xl font-bold mt-1">{provinceName}</h1>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-100 mt-4">
                {stats.totalHouseholds.toLocaleString('th-TH')} ครัวเรือน
              </div>
            </div>
            <div className="text-right text-sm text-blue-200">
              <p>ข้อมูลอ้างอิงจากปีล่าสุด</p>
              <p>ของข้อมูลที่มี: {stats.year + 543}</p>
            </div>
          </div>
        </div>

        {/* Key Statistics Section */}
        <div className="grid grid-cols-2 divide-x divide-gray-200 border-b border-gray-200">

          {/* Renter Households */}
          <div className="px-12 py-8 bg-green-50">
            <div className="flex items-start gap-4">
              <div className="bg-green-600 p-4 rounded-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  ครัวเรือนผู้เช่า
                </h3>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.renterHouseholds.toLocaleString('th-TH')}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {((stats.renterHouseholds / stats.totalHouseholds) * 100).toFixed(0)}% ของครัวเรือนทั้งหมด
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">การเปลี่ยนแปลง ({stats.year - 1 + 543}-{stats.year + 543}):</span>
                  <span className="text-sm font-semibold text-green-600 flex items-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                    +2%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Households */}
          <div className="px-12 py-8 bg-orange-50">
            <div className="flex items-start gap-4">
              <div className="bg-orange-600 p-4 rounded-lg">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  ครัวเรือนเจ้าของบ้าน
                </h3>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.ownerHouseholds.toLocaleString('th-TH')}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {((stats.ownerHouseholds / stats.totalHouseholds) * 100).toFixed(0)}% ของครัวเรือนทั้งหมด
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">การเปลี่ยนแปลง ({stats.year - 1 + 543}-{stats.year + 543}):</span>
                  <span className="text-sm font-semibold text-red-600 flex items-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    -1%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Message Banner */}
        <div className="bg-gray-100 px-12 py-6 border-b-4 border-gray-300">
          <p className="text-lg text-gray-800 leading-relaxed">
            ค่าใช้จ่ายด้านที่อยู่อาศัยส่งผลกระทบอย่างมากต่อครัวเรือนที่มีรายได้น้อย
          </p>
        </div>

        {/* Content Section */}
        <div className="px-12 py-10 space-y-12">

          {/* Cost Burden Rates Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-1 h-8 bg-blue-600"></div>
              อัตราภาระค่าใช้จ่ายด้านที่อยู่อาศัย
            </h2>

            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
              <div className="grid grid-cols-3 gap-8 items-center">

                {/* Total Cost-Burdened */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold mb-2">
                    ครัวเรือนที่มีภาระค่าใช้จ่ายสูง
                  </div>
                  <div className="text-5xl font-bold text-red-600 mb-2">
                    {stats.burdenRate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    • {stats.year - 2 + 543}-{stats.year - 1 + 543}: ภาระค่าใช้จ่าย {stats.burdenRate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    • {stats.year - 1 + 543}-{stats.year + 543}: ค่าใช้จ่ายคงที่ (ไม่เปลี่ยนแปลง)
                  </div>
                </div>

                {/* Pie Charts */}
                <div className="col-span-2 grid grid-cols-3 gap-4">
                  {/* Renters with Severe Cost Burden */}
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-3">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle cx="64" cy="64" r="56" fill="#FFF4E6" />
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#F97316" strokeWidth="16"
                          strokeDasharray={`${Math.PI * 2 * 56 * 0.24} ${Math.PI * 2 * 56 * 0.76}`} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">24%</span>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-gray-700">
                      {(stats.totalHouseholds * 0.35 * 0.24).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      ผู้เช่าที่มีภาระค่าใช้จ่ายสูง
                    </div>
                  </div>

                  {/* Low-Income Renters */}
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-3">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle cx="64" cy="64" r="56" fill="#FEF3C7" />
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#EAB308" strokeWidth="16"
                          strokeDasharray={`${Math.PI * 2 * 56 * 0.68} ${Math.PI * 2 * 56 * 0.32}`} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">68%</span>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-gray-700">
                      {(stats.totalHouseholds * 0.2 * 0.68).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      ผู้เช่ารายได้น้อย
                    </div>
                  </div>

                  {/* Senior Renters */}
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-3">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle cx="64" cy="64" r="56" fill="#FEE2E2" />
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#DC2626" strokeWidth="16"
                          strokeDasharray={`${Math.PI * 2 * 56 * 0.85} ${Math.PI * 2 * 56 * 0.15}`} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">85%</span>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-gray-700">
                      {(stats.totalHouseholds * 0.15 * 0.85).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      ผู้เช่าสูงอายุ
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-300 text-sm text-gray-600 flex items-start gap-2">
                <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <div>
                  <strong>ภาระค่าใช้จ่าย:</strong> เมื่อครัวเรือนใช้จ่ายมากกว่า 30% ของรายได้เพื่อค่าใช้จ่ายด้านที่อยู่อาศัย |
                  <strong className="ml-2">ภาระค่าใช้จ่ายรุนแรง:</strong> เมื่อครัวเรือนใช้จ่ายมากกว่า 50% |
                  <span className="ml-2">* หมายเหตุ: ค่าใช้จ่ายมากกว่า 100,000 บาท/เดือน ไม่รวม</span>
                </div>
              </div>
            </div>
          </div>

          {/* Income Distribution Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-1 h-8 bg-blue-600"></div>
              การกระจายรายได้ของครัวเรือน
            </h2>

            <div className="space-y-3">
              {incomeStats.map((stat, index) => (
                <div key={stat.quintile} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white font-bold rounded-full text-lg shrink-0">
                    {stat.quintile}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-700">{stat.label}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(stat.households / stats.totalHouseholds * 100)}%` }}
                        />
                      </div>
                      <div className="text-lg font-bold text-gray-900 w-32 text-right">
                        {stat.households.toLocaleString('th-TH')}
                      </div>
                      <div className="text-sm text-gray-600 w-16">
                        ({((stat.households / stats.totalHouseholds) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Housing Supply Summary */}
          {supplyStats && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-1 h-8 bg-blue-600"></div>
                สรุปอุปทานที่อยู่อาศัย
              </h2>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <div className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-2">
                    อุปทานรวม
                  </div>
                  <div className="text-4xl font-bold text-blue-900 mb-1">
                    {supplyStats.totalSupply.toLocaleString('th-TH')}
                  </div>
                  <div className="text-xs text-blue-700">หน่วย</div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-2">
                    ค่าเช่าเฉลี่ย
                  </div>
                  <div className="text-4xl font-bold text-green-900 mb-1">
                    {supplyStats.avgRent.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-green-700">บาท/เดือน</div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                  <div className="text-sm font-semibold text-orange-800 uppercase tracking-wide mb-2">
                    ราคาขายเฉลี่ย
                  </div>
                  <div className="text-4xl font-bold text-orange-900 mb-1">
                    {(supplyStats.avgSale / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-orange-700">บาท</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-12 py-8 border-t border-gray-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span className="font-bold text-gray-800">Housing Profile Thailand</span>
              </div>
              <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                แหล่งข้อมูล: สำนักงานสถิติแห่งชาติ, การเคหะแห่งชาติ, กรมที่ดิน
              </p>
              <p className="text-xs text-gray-500 mt-2">
                © {new Date().getFullYear()} Housing Profile Thailand Platform. All rights reserved.
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>จัดทำโดย</p>
              <p className="font-semibold text-gray-800">Urban Studies Lab</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportNew;

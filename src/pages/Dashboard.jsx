import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { provinces } from '../utils/dataUtils';
// CKAN API removed - transitioning to local CSV data
// import { useAllProvinceData, usePrefetchProvinceData } from '../hooks/useCkanQueries';
// import { useProvincePreloader } from '../hooks/useProvincePreloader';

// Import chart components
// import MapView from '../components/MapView'; // Removed map from Housing Profile
import PopulationChart from '../components/charts/PopulationChart';
import HouseholdChart from '../components/charts/HouseholdChart';
import IncomeChart from '../components/charts/IncomeChart';
import ExpenditureChart from '../components/charts/ExpenditureChart';
import HousingSupplyChart from '../components/charts/HousingSupplyChart';
import HousingDistributionChart from '../components/charts/HousingDistributionChart';
import HousingUnitsChart from '../components/charts/HousingUnitsChart';
import TotalHousingChart from '../components/charts/TotalHousingChart';
import PolicyTable from '../components/charts/PolicyTable';
import PolicyChart from '../components/charts/PolicyChart';
import PopulationAgeChart from '../components/charts/PopulationAgeChart';
import HousingAffordabilityChart from '../components/charts/HousingAffordabilityChart';
import HousingDemandChart from '../components/charts/HousingDemandChart';
import HouseholdByIncomeChart from '../components/charts/HouseholdByIncomeChart';
import PopulationByYearChart from '../components/charts/PopulationByYearChart';
import HousingSupplyByPriceChart from '../components/charts/HousingSupplyByPriceChart';
import HousingSupplyAveragePriceChart from '../components/charts/HousingSupplyAveragePriceChart';
import AverageExpenditureChart from '../components/charts/AverageExpenditureChart';
import ErrorBoundary from '../components/ErrorBoundary';

// Constants
const VALID_TOPICS = ['demographics', 'housing', 'affordability', 'demand', 'policy'];
const DEFAULT_PROVINCE_ID = 10; // Bangkok
const POINTER_CURSOR_STYLE = { cursor: 'pointer' };

const Dashboard = () => {
  const [activeProvince, setActiveProvince] = useState(DEFAULT_PROVINCE_ID);
  const [activeTopic, setActiveTopic] = useState('demographics');
  const [policyFilter, setPolicyFilter] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // CKAN API completely removed - all hooks replaced with empty data
  const population = { data: null, isLoading: false, isError: false, isFetching: false };
  const household = { data: null, isLoading: false, isError: false, isFetching: false };
  const income = { data: null, isLoading: false, isError: false, isFetching: false };
  const populationAge = { data: null, isLoading: false, isError: false, isFetching: false };
  const policy = { data: [], isLoading: false, isError: false, isFetching: false };
  const housingSupply = { data: null, isLoading: false, isError: false, isFetching: false };
  const housingAffordability = { data: null, isLoading: false, isError: false, isFetching: false };
  const housingDemand = { data: null, isLoading: false, isError: false, isFetching: false };
  const expenditure = [];
  const isLoading = false;
  const isError = false;

  // Prefetch disabled
  const prefetchProvince = () => {};
  
  // URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const provinceParam = urlParams.get('province');
    const topicParam = urlParams.get('topic');

    if (provinceParam) {
      const provinceId = parseInt(provinceParam, 10);
      if (!isNaN(provinceId) && provinces.find(p => p.id === provinceId)) {
        setActiveProvince(provinceId);
      }
    }

    if (topicParam && VALID_TOPICS.includes(topicParam)) {
      setActiveTopic(topicParam);
    }

    // Mark as initialized after reading URL parameters
    setIsInitialized(true);
  }, []);

  // Update URL when province or topic changes (only after initialization)
  useEffect(() => {
    if (!isInitialized) return; // Don't update URL until we've read initial parameters

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('province', activeProvince.toString());
    searchParams.set('topic', activeTopic);

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [activeProvince, activeTopic, isInitialized]);
  
  const provinceName = useMemo(() =>
    provinces.find(p => p.id === activeProvince)?.name || 'Unknown Province',
    [activeProvince]
  );

  // Prefetch data for other provinces on hover
  const handleProvinceHover = useCallback((provinceId) => {
    if (provinceId !== activeProvince) {
      prefetchProvince(provinceId);
    }
  }, [activeProvince, prefetchProvince]);

  // Handle province change from map or dropdown
  const handleProvinceChange = useCallback((provinceId) => {
    setActiveProvince(provinceId);
  }, []);

  // Handle report generation
  const handleGenerateReport = useCallback(() => {
    window.location.href = `/report/${activeProvince}`;
  }, [activeProvince]);

  // Handle error retry
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);
  
  // Get filtered policies based on current filter
  const filteredPolicies = useMemo(() => {
    if (!policy.data) return [];

    if (!policyFilter) return policy.data;

    if (policyFilter.startsWith('type:')) {
      const typeCode = policyFilter.split(':')[1];
      return policy.data.filter(p =>
        p['3S Model'] && p['3S Model'].includes(typeCode)
      );
    }

    return policy.data;
  }, [policy.data, policyFilter]);

  // Metrics disabled - will be replaced with local data in future
  const metrics = {
    population: 0,
    households: 0,
    income: 0,
    incomeGrowth: 0
  };
  
  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">รายงานสถานการณ์ที่อยู่อาศัย</h1>
        <p className="text-gray-600 mt-2">
          สำรวจข้อมูลระดับจังหวัด นโยบายที่อยู่อาศัย และกรอบการทำงาน
        </p>
        
        {/* Loading indicator for overall data */}
        {isLoading && (
          <div className="mt-2 text-sm text-blue-600">
            🔄 Loading data for {provinceName}...
          </div>
        )}
        
        {/* Cache status indicators */}
        {!isLoading && !isError && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {population.isFetching && <span className="text-blue-600">📊 Updating population...</span>}
            {household.isFetching && <span className="text-blue-600">🏠 Updating households...</span>}
            {income.isFetching && <span className="text-blue-600">💰 Updating income...</span>}
            {housingSupply.isFetching && <span className="text-blue-600">🏘️ Updating housing supply...</span>}
            {housingAffordability.isFetching && <span className="text-blue-600">💳 Updating affordability...</span>}
            {housingDemand.isFetching && <span className="text-blue-600">🏗️ Updating housing demand...</span>}
            {policy.isFetching && <span className="text-blue-600">📋 Updating policies...</span>}
          </div>
        )}
      </div>
      
      {/* Topic Navigation - Mobile Drop-down */}
      <div className="md:hidden mb-4">
        <select 
          className="w-full p-2 border rounded shadow-sm"
          value={activeTopic}
          onChange={(e) => setActiveTopic(e.target.value)}
        >
          <option value="demographics">ข้อมูลประชากร</option>
          <option value="housing">อุปทานที่อยู่อาศัย</option>
          <option value="affordability">ความสามารถในการจ่าย</option>
          <option value="demand">ความต้องการที่อยู่อาศัย</option>
          <option value="policy">นโยบาย</option>
        </select>
      </div>
      
      {/* Province Selector - Moved to top for better space utilization */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              เลือกจังหวัด:
            </label>
            <select
              value={activeProvince}
              onChange={(e) => handleProvinceChange(parseInt(e.target.value, 10))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm flex-1 max-w-xs bg-white shadow-sm hover:border-gray-400 transition-colors"
              aria-label="เลือกจังหวัด"
            >
              {provinces.map(province => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>

          {/* Province Stats Summary - Inline */}
          {metrics.population > 0 && (
            <div className="flex items-center gap-4 text-xs text-gray-600 border-l pl-4">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">ประชากร:</span>
                <span className="font-semibold text-gray-800">{metrics.population.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">ครัวเรือน:</span>
                <span className="font-semibold text-gray-800">{metrics.households.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">รายได้เฉลี่ย:</span>
                <span className="font-semibold text-gray-800">฿{metrics.income.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Charts - Full width */}
        <div className="w-full">
          {/* Report generation button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleGenerateReport}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              สร้างรายงานแบบเต็ม
            </button>
          </div>

          {/* Topic navigation - Desktop */}
          <div className="hidden md:flex mb-4 overflow-x-auto border-b border-gray-200 pb-1">
            <button 
              onClick={() => setActiveTopic('demographics')}
              className={`px-4 py-2 rounded-t-md text-xs font-bold mr-1 whitespace-nowrap
                ${activeTopic === 'demographics' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              ข้อมูลประชากร
            </button>
            <button 
              onClick={() => setActiveTopic('housing')}
              className={`px-4 py-2 rounded-t-md text-xs font-bold mr-1 whitespace-nowrap
                ${activeTopic === 'housing' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              อุปทานที่อยู่อาศัย
            </button>
            <button 
              onClick={() => setActiveTopic('affordability')}
              className={`px-4 py-2 rounded-t-md text-xs font-bold mr-1 whitespace-nowrap
                ${activeTopic === 'affordability' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              ความสามารถในการจ่าย
            </button>
            <button 
              onClick={() => setActiveTopic('demand')}
              className={`px-4 py-2 rounded-t-md text-xs font-bold mr-1 whitespace-nowrap
                ${activeTopic === 'demand' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              ความต้องการที่อยู่อาศัย
            </button>
            <button 
              onClick={() => setActiveTopic('policy')}
              className={`px-4 py-2 rounded-t-md text-xs font-bold mr-1 whitespace-nowrap
                ${activeTopic === 'policy' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              นโยบาย
            </button>
          </div>
          
          {/* Global error message - Hidden during transition to local data */}
          {false && isError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="font-medium">Failed to load some data</p>
              <p className="text-sm mt-1">Please check your connection and try again.</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-sm text-red-800 underline hover:no-underline"
              >
                Reload page
              </button>
            </div>
          )}
          
          {/* Demographics Content */}
          {activeTopic === 'demographics' && (
            <ErrorBoundary>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <PopulationByYearChart
                  provinceName={provinceName}
                  provinceId={activeProvince}
                />
                <HouseholdByIncomeChart
                  provinceName={provinceName}
                  provinceId={activeProvince}
                />
              </div>
            </ErrorBoundary>
          )}
                      
          {/* Housing Content */}
          {activeTopic === 'housing' && (
            <ErrorBoundary>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <HousingSupplyByPriceChart
                  provinceName={provinceName}
                  provinceId={activeProvince}
                />
                <HousingSupplyAveragePriceChart
                  provinceName={provinceName}
                  provinceId={activeProvince}
                />
              </div>
            </ErrorBoundary>
          )}

          {/* Housing Affordability Content */}
          {activeTopic === 'affordability' && (
            <div className="grid grid-cols-1 gap-4">
              <HousingAffordabilityChart
                provinceName={provinceName}
                provinceId={activeProvince}
              />
              <AverageExpenditureChart
                provinceName={provinceName}
                provinceId={activeProvince}
              />
              
              {/* Additional affordability metrics */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  ทำความเข้าใจความสามารถในการจ่ายค่าที่อยู่อาศัย
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-1">อัตราส่วนค่าใช้จ่ายที่อยู่อาศัยรวม</h4>
                    <p className="text-blue-700">
                      เปอร์เซ็นต์ของรายได้ครัวเรือนที่ใช้จ่ายสำหรับค่าใช้จ่ายที่เกี่ยวกับที่อยู่อาศัยทั้งหมด
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1">อัตราส่วนค่าเช่าต่อรายได้</h4>
                    <p className="text-green-700">
                      เปอร์เซ็นต์ของรายได้ครัวเรือนที่ใช้จ่ายสำหรับค่าเช่าที่อยู่อาศัยโดยเฉพาะ
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-1">อัตราส่วนค่างวดต่อรายได้</h4>
                    <p className="text-yellow-700">
                      เปอร์เซ็นต์ของรายได้ครัวเรือนที่ใช้จ่ายสำหรับการชำระค่างวดที่อยู่อาศัย
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <p><strong>หมายเหตุ:</strong> ที่อยู่อาศัยถือว่ามีราคาที่เหมาะสมเมื่อมีค่าใช้จ่ายไม่เกิน 30% ของรายได้ครัวเรือน อัตราส่วนที่สูงกว่านี้แสดงถึงปัญหาความสามารถในการจ่ายค่าที่อยู่อาศัย</p>
                </div>
              </div>
            </div>
          )}

          {/* Housing Demand Content */}
          {activeTopic === 'demand' && (
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">อยู่ในระหว่างการจัดทำข้อมูล</h3>
                  <p className="text-sm text-gray-600">ข้อมูลความต้องการที่อยู่อาศัยกำลังอยู่ในระหว่างการรวบรวมและประมวลผล</p>
                </div>
              </div>

              {/* Additional demand insights */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  ทำความเข้าใจความต้องการที่อยู่อาศัย
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-1">การเปลี่ยนประเภทที่อยู่อาศัย</h4>
                    <p className="text-blue-700">
                      แสดงความต้องการเปลี่ยนแปลงจากประเภทที่อยู่อาศัยปัจจุบันไปสู่ประเภทที่ต้องการในอนาคต ช่วยให้เข้าใจแนวโน้มการพัฒนาที่อยู่อาศัย
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1">ลักษณะการจ่ายค่าที่อยู่อาศัยที่ต้องการ</h4>
                    <p className="text-green-700">
                      แสดงรูปแบบการจ่ายค่าที่อยู่อาศัยที่ผู้ต้องการจะใช้ (เช่า หรือ ผ่อน) ในการย้ายไปยังที่อยู่อาศัยใหม่
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-1">ความสามารถในการจ่าย</h4>
                    <p className="text-yellow-700">
                      แสดงราคาที่ผู้ตอบแบบสอบถามสามารถจ่ายได้ แยกตามกลุ่มรายได้ เพื่อวางแผนการพัฒนาที่อยู่อาศัยที่เหมาะสม
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <p><strong>หมายเหตุ:</strong> ข้อมูลจากการสำรวจความต้องการที่อยู่อาศัยในจังหวัดสงขลา ช่วยให้เข้าใจพฤติกรรมและความต้องการของประชาชนในการเลือกที่อยู่อาศัย รวมถึงขีดความสามารถทางการเงิน</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Policy Content */}
          {activeTopic === 'policy' && (
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">อยู่ในระหว่างการจัดทำข้อมูล</h3>
                  <p className="text-sm text-gray-600">ข้อมูลนโยบายที่อยู่อาศัยกำลังอยู่ในระหว่างการรวบรวมและประมวลผล</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Policy Summary - Moved below charts when policy tab is active */}
        {activeTopic === 'policy' && policy.data && policy.data.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              สรุปนโยบาย
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">จำนวนนโยบายทั้งหมด</span>
                <span className="font-semibold text-lg text-blue-600">{policy.data.length}</span>
              </div>

              {/* Policy type breakdown */}
              <div className="pt-3 border-t">
                <p className="text-sm font-medium text-gray-700 mb-3">แยกตามประเภท:</p>
                <div className="flex flex-wrap gap-2">
                  {['S1', 'S2', 'S3'].map(typeCode => {
                    const count = policy.data.filter(p =>
                      p['3S Model'] && p['3S Model'].includes(typeCode)
                    ).length;
                    const totalCount = policy.data.length;

                    return count > 0 ? (
                      <button
                        key={typeCode}
                        type="button"
                        className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          policyFilter === `type:${typeCode}`
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                        onClick={() => {
                          if (activeTopic !== 'policy') {
                            setActiveTopic('policy');
                          }
                          if (policyFilter === `type:${typeCode}`) {
                            setPolicyFilter(null);
                          } else {
                            setPolicyFilter(`type:${typeCode}`);
                          }
                        }}
                        aria-label={`${policyFilter === `type:${typeCode}` ? 'Remove' : 'Apply'} ${typeCode} policy filter`}
                      >
                        {typeCode}
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-white bg-opacity-30 text-xs">
                          {count}
                        </span>
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
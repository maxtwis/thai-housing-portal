import React, { useState, useEffect } from 'react';
import { provinces } from '../utils/dataUtils';
import { useAllProvinceData, usePrefetchProvinceData } from '../hooks/useCkanQueries';
import { useProvincePreloader } from '../hooks/useProvincePreloader';

// Import chart components
import MapView from '../components/MapView';
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

const Dashboard = () => {
  const [activeProvince, setActiveProvince] = useState(10); // Default to Bangkok
  const [activeTopic, setActiveTopic] = useState('demographics');
  const [policyFilter, setPolicyFilter] = useState(null);
  
  // Use React Query for all data
  const {
    population,
    household,
    income,
    populationAge,
    policy,
    housingSupply,
    housingAffordability,
    housingDemand,
    expenditure,
    isLoading,
    isError,
  } = useAllProvinceData(activeProvince);
  
  // Prefetch hook
  const { prefetchProvince } = usePrefetchProvinceData();
  
  // Use the preloader hook for background prefetching
  useProvincePreloader();
  
  // URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const provinceParam = urlParams.get('province');
    const topicParam = urlParams.get('topic');
    
    if (provinceParam) {
      const provinceId = parseInt(provinceParam);
      if (provinces.find(p => p.id === provinceId)) {
        setActiveProvince(provinceId);
      }
    }
    
    if (topicParam && ['demographics', 'housing', 'affordability', 'demand', 'policy'].includes(topicParam)) {
      setActiveTopic(topicParam);
    }
  }, []);

  // Update URL when province or topic changes
  useEffect(() => {
    const url = new URL(window.location);
    url.searchParams.set('province', activeProvince.toString());
    url.searchParams.set('topic', activeTopic);
    window.history.replaceState({}, '', url);
  }, [activeProvince, activeTopic]);
  
  const provinceName = provinces.find(p => p.id === activeProvince)?.name || 'Unknown Province';
  
  // Prefetch data for other provinces on hover
  const handleProvinceHover = (provinceId) => {
    if (provinceId !== activeProvince) {
      prefetchProvince(provinceId);
    }
  };
  
  // Handle province change from map or dropdown
  const handleProvinceChange = (provinceId) => {
    setActiveProvince(provinceId);
  };
  
  // Get filtered policies based on current filter
  const getFilteredPolicies = () => {
    if (!policy.data) return [];
    
    if (!policyFilter) return policy.data;
    
    if (policyFilter.startsWith('type:')) {
      const typeCode = policyFilter.split(':')[1];
      return policy.data.filter(p => 
        p['3S Model'] && p['3S Model'].includes(typeCode)
      );
    }
    
    return policy.data;
  };
  
  // Get key metrics for summary
  const getLatestMetrics = () => {
    const latestPop = population.data && population.data.length > 0 
      ? population.data[population.data.length - 1].population 
      : 0;
    
    const latestHouseholds = household.data && household.data.length > 0 
      ? household.data[household.data.length - 1].household 
      : 0;
    
    const latestIncome = income.data && income.data.length > 0 
      ? income.data[income.data.length - 1].income 
      : 0;
    
    const firstIncome = income.data && income.data.length > 0 
      ? income.data[0].income 
      : 0;
    
    const incomeGrowth = firstIncome > 0 && latestIncome > 0 
      ? ((latestIncome / firstIncome) - 1) * 100 : 0;
    
    return {
      population: latestPop,
      households: latestHouseholds,
      income: latestIncome,
      incomeGrowth: incomeGrowth
    };
  };
  
  const metrics = getLatestMetrics();
  
  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Housing Profile</h1>
        <p className="text-gray-600 mt-2">
          Explore province-level data, housing policies and frameworks.
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
          <option value="demographics">Demographics</option>
          <option value="housing">Housing Supply</option>
          <option value="affordability">Housing Affordability</option>
          <option value="demand">Housing Demand</option>
          <option value="policy">Policy</option>
        </select>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side - Charts */}
        <div className="w-full md:w-7/12">
          {/* Report generation button */}
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => window.location.href = `/report/${activeProvince}`}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Full Report
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
              DEMOGRAPHICS
            </button>
            <button 
              onClick={() => setActiveTopic('housing')}
              className={`px-4 py-2 rounded-t-md text-xs font-bold mr-1 whitespace-nowrap
                ${activeTopic === 'housing' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              HOUSING SUPPLY
            </button>
            <button 
              onClick={() => setActiveTopic('affordability')}
              className={`px-4 py-2 rounded-t-md text-xs font-bold mr-1 whitespace-nowrap
                ${activeTopic === 'affordability' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              HOUSING AFFORDABILITY
            </button>
            <button 
              onClick={() => setActiveTopic('demand')}
              className={`px-4 py-2 rounded-t-md text-xs font-bold mr-1 whitespace-nowrap
                ${activeTopic === 'demand' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              HOUSING DEMAND
            </button>
            <button 
              onClick={() => setActiveTopic('policy')}
              className={`px-4 py-2 rounded-t-md text-xs font-bold mr-1 whitespace-nowrap
                ${activeTopic === 'policy' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              POLICY
            </button>
          </div>
          
          {/* Global error message */}
          {isError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="font-medium">Failed to load some data</p>
              <p className="text-sm mt-1">Please check your connection and try again.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-800 underline hover:no-underline"
              >
                Reload page
              </button>
            </div>
          )}
          
          {/* Demographics Content */}
          {activeTopic === 'demographics' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <PopulationChart 
                  provinceName={provinceName} 
                  provinceId={activeProvince}
                />
                <PopulationAgeChart 
                  provinceName={provinceName}
                  provinceId={activeProvince}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <IncomeChart 
                  provinceName={provinceName} 
                  provinceId={activeProvince}
                />
                <ExpenditureChart 
                  provinceName={provinceName}
                  provinceId={activeProvince}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <HouseholdChart 
                  provinceName={provinceName} 
                  provinceId={activeProvince}
                />
              </div>
            </div>
          )}
                      
          {/* Housing Content */}
          {activeTopic === 'housing' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <HousingSupplyChart 
                  provinceName={provinceName}
                  provinceId={activeProvince}
                />
                <HousingDistributionChart 
                  provinceName={provinceName}
                  provinceId={activeProvince}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <HousingUnitsChart 
                  provinceName={provinceName}
                  provinceId={activeProvince}
                />
                <TotalHousingChart 
                  provinceName={provinceName}
                  provinceId={activeProvince}
                />
              </div>
            </div>
          )}

          {/* Housing Affordability Content */}
          {activeTopic === 'affordability' && (
            <div className="grid grid-cols-1 gap-4">
              <HousingAffordabilityChart 
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
              <HousingDemandChart 
                provinceName={provinceName} 
                provinceId={activeProvince} 
              />
              
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
                    <h4 className="font-semibold text-green-800 mb-1">การจัดหาเงินทุน</h4>
                    <p className="text-green-700">
                      แสดงรูปแบบการจัดหาเงินทุนที่ผู้ต้องการจะใช้ (เช่า หรือ ผ่อน) ในการย้ายไปยังที่อยู่อาศัยใหม่
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
                  <p><strong>หมายเหตุ:</strong> ข้อมูลจากการสำรวจความต้องการที่อยู่อาศัยในพื้นที่เทศบาลนครหาดใหญ่ ช่วยให้เข้าใจพฤติกรรมและความต้องการของประชาชนในการเลือกที่อยู่อาศัย รวมถึงขีดความสามารถทางการเงิน</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Policy Content */}
          {activeTopic === 'policy' && (
            <div>
              {/* Policy filter notice */}
              {policyFilter && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md mb-4 flex justify-between items-center">
                  <span>Filtered by: {policyFilter}</span>
                  <button 
                    onClick={() => setPolicyFilter(null)}
                    className="text-blue-800 hover:text-blue-900 underline"
                  >
                    Clear filter
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                <PolicyTable 
                  policies={getFilteredPolicies()} 
                  provinceName={provinceName}
                />
                
                <PolicyChart 
                  policies={getFilteredPolicies()} 
                  provinceName={provinceName}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right side - Map and summary */}
        <div className="w-full md:w-5/12">
          {/* Province Filter Section - Moved above map */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                เลือกจังหวัด:
              </label>
              <select
                value={activeProvince}
                onChange={(e) => handleProvinceChange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm flex-1"
              >
                {provinces.map(province => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <MapView
            activeProvince={activeProvince}
            onProvinceChange={handleProvinceChange}
            onProvinceHover={handleProvinceHover}
          />

          {/* Province Summary Card */}
            {metrics.population > 0 && (
              <div className="bg-white rounded-lg shadow p-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  สงขลา Overview
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ประชากร</span>
                    <span className="font-medium">{metrics.population.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">ครัวเรือน</span>
                    <span className="font-medium">{metrics.households.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">รายได้เฉลี่ย</span>
                    <span className="font-medium">฿{metrics.income.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">การเติบโตของรายได้</span>
                    <span className={`font-medium ${metrics.incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.incomeGrowth >= 0 ? '+' : ''}{metrics.incomeGrowth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* Policy Summary */}
          {policy.data && policy.data.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Policy Summary
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Policies</span>
                  <span className="font-medium">{policy.data.length}</span>
                </div>
                
                {/* Policy type breakdown */}
                <div className="pt-2">
                  <p className="text-xs font-medium text-gray-700 mb-2">By Type:</p>
                  <div className="flex flex-wrap gap-1">
                    {['S1', 'S2', 'S3'].map(typeCode => {
                      const count = policy.data.filter(p => 
                        p['3S Model'] && p['3S Model'].includes(typeCode)
                      ).length;
                      const totalCount = policy.data.length;
                      
                      return count > 0 ? (
                        <span 
                          key={typeCode} 
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            policyFilter === `type:${typeCode}` 
                              ? 'bg-blue-200 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          } ${count === 0 ? 'opacity-50' : ''}`}
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
                          style={{ cursor: 'pointer' }}
                        >
                          {typeCode} 
                          <span className="ml-1 text-xs text-gray-500">
                            ({count}{policyFilter && count !== totalCount ? `/${totalCount}` : ''})
                          </span>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* React Query DevTools Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-white p-3 rounded-lg shadow text-xs mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Query Cache Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Population:</span>
                  <span className={`${population.isStale ? 'text-orange-600' : 'text-green-600'}`}>
                    {population.isLoading ? 'Loading...' : population.isStale ? 'Stale' : 'Fresh'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Housing:</span>
                  <span className={`${housingSupply.isStale ? 'text-orange-600' : 'text-green-600'}`}>
                    {housingSupply.isLoading ? 'Loading...' : housingSupply.isStale ? 'Stale' : 'Fresh'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Affordability:</span>
                  <span className={`${housingAffordability.isStale ? 'text-orange-600' : 'text-green-600'}`}>
                    {housingAffordability.isLoading ? 'Loading...' : housingAffordability.isStale ? 'Stale' : 'Fresh'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Demand:</span>
                  <span className={`${housingDemand.isStale ? 'text-orange-600' : 'text-green-600'}`}>
                    {housingDemand.isLoading ? 'Loading...' : housingDemand.isStale ? 'Stale' : 'Fresh'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Policy:</span>
                  <span className={`${policy.isStale ? 'text-orange-600' : 'text-green-600'}`}>
                    {policy.isLoading ? 'Loading...' : policy.isStale ? 'Stale' : 'Fresh'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
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
    expenditure,
    isLoading,
    isError
  } = useAllProvinceData(activeProvince);
  
  // Get prefetch function
  const { prefetchProvince } = usePrefetchProvinceData();
  
  // Add preloader for instant province switching
  const { getCacheStats } = useProvincePreloader(activeProvince);
  
  // Get current province name
  const provinceName = provinces.find(p => p.id === activeProvince)?.name || '';
  
  const handleProvinceChange = (geoId) => {
    setActiveProvince(parseInt(geoId));
  };
  
  // Prefetch data for other provinces to make switching instant
  useEffect(() => {
    const otherProvinces = provinces.filter(p => p.id !== activeProvince);
    
    // Prefetch data for other provinces with a delay to not interfere with current loading
    const prefetchOthers = async () => {
      for (const province of otherProvinces) {
        // Stagger the prefetch requests to be nice to the server
        setTimeout(() => {
          prefetchProvince(province.id);
        }, 1000 + (province.id * 500));
      }
    };
    
    // Only prefetch after the current province data is loaded
    if (!isLoading && !isError) {
      prefetchOthers();
    }
  }, [activeProvince, isLoading, isError, prefetchProvince]);
  
  // Get filtered policies based on the selected filter
  const getFilteredPolicies = () => {
    if (!policyFilter || !policy.data?.length) return policy.data || [];
    
    if (policyFilter.startsWith('status:')) {
      const status = policyFilter.split(':')[1];
      return policy.data.filter(p => p.Status === status);
    }
    
    if (policyFilter.startsWith('type:')) {
      const type = policyFilter.split(':')[1];
      return policy.data.filter(p => 
        p['3S Model'] && p['3S Model'].includes(type)
      );
    }
    
    return policy.data || [];
  };
  
  const filteredPolicies = getFilteredPolicies();
  
  // Convert expenditure queries result to the format expected by components
  const getExpenditureData = () => {
    const result = {};
    expenditure.forEach((query, index) => {
      const quintileId = index + 1;
      if (query.data) {
        result[quintileId] = query.data;
      }
    });
    return result;
  };
  
  // Get key metrics
  const getLatestMetrics = () => {
    const populationData = population.data || [];
    const householdData = household.data || [];
    const incomeData = income.data || [];
    
    if (!populationData.length || !householdData.length || !incomeData.length) {
      return { population: 0, households: 0, income: 0, incomeGrowth: 0 };
    }
    
    const latestPop = populationData[populationData.length - 1]?.population || 0;
    const latestHouseholds = householdData[householdData.length - 1]?.household || 0;
    const latestIncome = incomeData[incomeData.length - 1]?.income || 0;
    
    // Calculate income growth
    const firstIncome = incomeData[0]?.income || 0;
    const incomeGrowth = firstIncome ? ((latestIncome / firstIncome) - 1) * 100 : 0;
    
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
            {housingSupply.isFetching && <span className="text-blue-600">🏘️ Updating housing...</span>}
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
                  data={population.data} 
                  provinceName={provinceName} 
                />
                <PopulationAgeChart 
                  data={populationAge.data}
                  provinceName={provinceName}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <IncomeChart 
                  data={income.data} 
                  provinceName={provinceName} 
                />
                <ExpenditureChart 
                  data={getExpenditureData()} 
                  provinceName={provinceName}
                  expenditureCategories={[
                    { id: 1, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย' },
                    { id: 2, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย (เช่า)' },
                    { id: 3, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย (ผ่อน)' },
                    { id: 5, name: 'ค่าใช้จ่ายด้านไฟฟ้า' }
                  ]}
                  quintiles={[
                    { id: 1, name: 'Quintile 1 (Lowest 20%)' },
                    { id: 2, name: 'Quintile 2' },
                    { id: 3, name: 'Quintile 3' },
                    { id: 4, name: 'Quintile 4' },
                    { id: 5, name: 'Quintile 5 (Highest 20%)' }
                  ]}
                  rawExpenditureData={getExpenditureData()}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <HouseholdChart 
                  data={household.data} 
                  provinceName={provinceName} 
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
          
          {/* Policy Content */}
          {activeTopic === 'policy' && (
            <div>
              {/* Policy filter notice */}
              {policyFilter && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md mb-4 flex justify-between items-center">
                  <span>
                    <span className="font-medium">Filtered by:</span> {policyFilter.replace(':', ': ')}
                  </span>
                  <button 
                    onClick={() => setPolicyFilter(null)}
                    className="text-xs bg-white border border-blue-300 hover:bg-blue-100 px-2 py-1 rounded"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
              
              <div className="mb-4">
                <PolicyChart 
                  policies={policy.data} 
                  onFilterChange={setPolicyFilter}
                  activeFilter={policyFilter}
                />
              </div>
              
              <div className="mb-4">
                <PolicyTable 
                  policies={filteredPolicies} 
                  provinceName={provinceName} 
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Right side - Map and Info */}
        <div className="w-full md:w-5/12">
          {/* Map with province dropdown */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="mb-3">
              <select 
                className="w-full p-2 border rounded shadow-sm bg-white text-gray-800"
                value={activeProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
              >
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
            <MapView 
              activeProvince={activeProvince} 
              onProvinceChange={handleProvinceChange} 
            />
            <div className="mt-2 text-center">
              <p className="text-sm font-medium text-gray-800">จังหวัด{provinceName}</p>
            </div>
          </div>
          
          {/* Key Metrics Bar */}
          {!isLoading && !isError && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg shadow">
                <p className="text-xs text-gray-500">Population (Latest)</p>
                <p className="text-lg font-bold text-blue-800">
                  {new Intl.NumberFormat('th-TH').format(metrics.population)} คน
                </p>
                {population.isFetching && <span className="text-xs text-blue-600">🔄</span>}
              </div>
              <div className="bg-green-50 p-3 rounded-lg shadow">
                <p className="text-xs text-gray-500">Households (Latest)</p>
                <p className="text-lg font-bold text-green-800">
                  {new Intl.NumberFormat('th-TH').format(metrics.households)} ครัวเรือน
                </p>
                {household.isFetching && <span className="text-xs text-blue-600">🔄</span>}
              </div>
              <div className="bg-purple-50 p-3 rounded-lg shadow">
                <p className="text-xs text-gray-500">Median Income</p>
                <p className="text-lg font-bold text-purple-800">
                  {new Intl.NumberFormat('th-TH').format(metrics.income)} บาท
                </p>
                {income.isFetching && <span className="text-xs text-blue-600">🔄</span>}
              </div>
              <div className="bg-amber-50 p-3 rounded-lg shadow">
                <p className="text-xs text-gray-500">Income Growth</p>
                <p className="text-lg font-bold text-amber-800">
                  {metrics.incomeGrowth.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
          
          {/* Policy Summary */}
          {!isLoading && !isError && policy.data && policy.data.length > 0 && (
            <div className="bg-white p-0 rounded-lg shadow mb-4">
              <div className="px-3 py-2 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-800">Housing Policy Summary</h3>
                  <div className="flex items-center space-x-2">
                    {policyFilter && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Filtered
                      </span>
                    )}
                    {policy.isFetching && <span className="text-xs text-blue-600">🔄</span>}
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Active Policies:</span>
                  <span className="text-sm font-medium text-green-600">
                    {filteredPolicies.filter(p => p.Status === 'Active').length}
                    {policyFilter && (
                      <span className="text-xs text-gray-500 ml-1">
                        / {policy.data.filter(p => p.Status === 'Active').length}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Pending Policies:</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {filteredPolicies.filter(p => p.Status === 'Pending').length}
                    {policyFilter && (
                      <span className="text-xs text-gray-500 ml-1">
                        / {policy.data.filter(p => p.Status === 'Pending').length}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Total Housing Policies:</span>
                  <span className="text-sm font-medium">
                    {filteredPolicies.length}
                    {policyFilter && (
                      <span className="text-xs text-gray-500 ml-1">
                        / {policy.data.length}
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600 mb-1">Policy Types:</p>
                  <div className="flex flex-wrap gap-1">
                    {['S1: Supply', 'S2: Subsidy', 'S3: Stability'].map((type) => {
                      const typeCode = type.split(':')[0].trim();
                      const count = filteredPolicies.filter(p => p['3S Model'] && p['3S Model'].includes(type)).length;
                      const totalCount = policy.data.filter(p => p['3S Model'] && p['3S Model'].includes(type)).length;
                      
                      return count > 0 || (policyFilter && totalCount > 0) ? (
                        <span 
                          key={type} 
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
            <div className="bg-white p-3 rounded-lg shadow text-xs">
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
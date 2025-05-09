import React, { useState, useEffect } from 'react';
import { 
  getCkanData, 
  ckanSqlQuery, 
  getDatasetInfo 
} from '../utils/ckanClient';

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

// Constants for data categories
export const expenditureCategories = [
  { id: 1, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย' },
  { id: 2, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย (เช่า)' },
  { id: 3, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย (ผ่อน)' },
  { id: 4, name: 'ภาระค่าใช้จ่ายด้านอุปโภคบริโภค' },
  { id: 5, name: 'ค่าใช้จ่ายด้านไฟฟ้า' },
  { id: 6, name: 'ค่าใช้จ่ายด้านน้ำประปา' },
  { id: 7, name: 'ค่าใช้จ่ายด้านค่าส่วนกลาง' },
  { id: 8, name: 'ค่าใช้จ่ายด้านการเดินทาง' },
  { id: 9, name: 'ค่าใช้จ่ายด้านพลังงาน (เชื้อเพลิง)' },
  { id: 10, name: 'ค่าใช้จ่ายด้านพลังงาน (แก๊ส)' },
  { id: 11, name: 'ค่าใช้จ่ายด้านการรักษาพยาบาล' },
  { id: 12, name: 'ค่าใช้จ่ายด้านอาหาร' }
];

export const housingCategories = [
  { id: 1, name: 'บ้านเดี่ยว' },
  { id: 2, name: 'บ้านแฝด' },
  { id: 3, name: 'ทาวน์เฮ้าส์' },
  { id: 4, name: 'อาคารชุด' },
  { id: 5, name: 'ตึกแถวและห้องแถว' },
  { id: 6, name: 'พาณิชยกรรม' },
  { id: 7, name: 'ตึก' },
  { id: 8, name: 'โฮมออฟฟิศ' }
];

export const quintiles = [
  { id: 1, name: 'Quintile 1 (Lowest 20%)' },
  { id: 2, name: 'Quintile 2' },
  { id: 3, name: 'Quintile 3' },
  { id: 4, name: 'Quintile 4' },
  { id: 5, name: 'Quintile 5 (Highest 20%)' }
];

// Resource IDs for CKAN
const RESOURCE_IDS = {
  population_data: 'e8f46829-8255-4b9a-8dc9-d540d035a842',
  household_data: '32386aff-314a-4f04-9957-0477882961e6',
  income_data: '983049c5-5bdd-4e91-a541-0b223c0f890a',
  expenditure_data: '8a83d0a4-1bf5-46bb-90a2-5b2cdf30f4cd',
  population_age_data: '76f03bb8-6e6e-41ab-b171-aa1391b1cfa4',
  housing_supply_data: '15132377-edb0-40b0-9aad-8fd9f6769b92',
  policy_data: '1d48b7c8-c95f-4576-8d52-5e68dc02ee68'
};

// Provinces data
export const provinces = [
  { id: 10, name: 'กรุงเทพมหานคร', lat: 13.7563, lon: 100.5018 },
  { id: 40, name: 'ขอนแก่น', lat: 16.4419, lon: 102.8359 },
  { id: 50, name: 'เชียงใหม่', lat: 18.7883, lon: 98.9817 },
  { id: 90, name: 'สงขลา', lat: 7.1891, lon: 100.5951 }
];

const Dashboard = () => {
  const [activeProvince, setActiveProvince] = useState(10); // Default to Bangkok
  const [activeTopic, setActiveTopic] = useState('demographics');
  const [populationData, setPopulationData] = useState([]);
  const [householdData, setHouseholdData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [housingSupplyData, setHousingSupplyData] = useState([]);
  const [expenditureData, setExpenditureData] = useState({});
  const [policyData, setPolicyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [policyFilter, setPolicyFilter] = useState(null);
  const [populationAgeData, setPopulationAgeData] = useState([]);
  
  // Get current province name
  const provinceName = provinces.find(p => p.id === activeProvince)?.name || '';
  
  const handleProvinceChange = (geoId) => {
    setActiveProvince(parseInt(geoId));
  };
  
  // Fetch population data with SQL query
  const fetchPopulationData = async (provinceId) => {
    try {
      const sql = `SELECT * FROM "${RESOURCE_IDS.population_data}" WHERE geo_id = ${provinceId} ORDER BY year`;
      const result = await ckanSqlQuery(sql);
      return result.records || [];
    } catch (error) {
      console.error('Error fetching population data:', error);
      return [];
    }
  };
  
  // Fetch household data with SQL query
  const fetchHouseholdData = async (provinceId) => {
    try {
      const sql = `SELECT * FROM "${RESOURCE_IDS.household_data}" WHERE geo_id = ${provinceId} ORDER BY year`;
      const result = await ckanSqlQuery(sql);
      return result.records || [];
    } catch (error) {
      console.error('Error fetching household data:', error);
      return [];
    }
  };
  
  // Fetch income data with SQL query
  const fetchIncomeData = async (provinceId) => {
    try {
      const sql = `SELECT * FROM "${RESOURCE_IDS.income_data}" WHERE geo_id = ${provinceId} ORDER BY year`;
      const result = await ckanSqlQuery(sql);
      return result.records || [];
    } catch (error) {
      console.error('Error fetching income data:', error);
      return [];
    }
  };
  
  // Fetch expenditure data with filters
  const fetchExpenditureData = async (provinceId, quintileId) => {
    try {
      const filters = {
        geo_id: provinceId
      };
      
      if (quintileId) {
        filters.quintile = quintileId;
      }
      
      const result = await getCkanData(RESOURCE_IDS.expenditure_data, {
        filters: JSON.stringify(filters)
      });
      
      return result.records || [];
    } catch (error) {
      console.error('Error fetching expenditure data:', error);
      return [];
    }
  };
  
  // Fetch housing supply data with SQL query
  const fetchHousingSupplyData = async (provinceId) => {
    try {
      const sql = `SELECT * FROM "${RESOURCE_IDS.housing_supply_data}" WHERE geo_id = ${provinceId}`;
      const result = await ckanSqlQuery(sql);
      return result.records || [];
    } catch (error) {
      console.error('Error fetching housing supply data:', error);
      return [];
    }
  };
  
  // Fetch population age data with SQL query
  const fetchPopulationAgeData = async (provinceId) => {
    try {
      const sql = `SELECT * FROM "${RESOURCE_IDS.population_age_data}" WHERE geo_id = ${provinceId} ORDER BY year, age_group`;
      const result = await ckanSqlQuery(sql);
      return result.records || [];
    } catch (error) {
      console.error('Error fetching population age data:', error);
      return [];
    }
  };
  
  // Fetch policy data with SQL query
  const fetchPolicyData = async (provinceId) => {
    try {
      // Include both province-specific policies and nationwide policies (geo_id = 99)
      const sql = `SELECT * FROM "${RESOURCE_IDS.policy_data}" WHERE geo_id = ${provinceId} OR geo_id = 99`;
      const result = await ckanSqlQuery(sql);
      
      // Format data to match the expected structure
      return (result.records || []).map(item => ({
        geo_id: item.geo_id,
        'Ministry (if applicable)': item.ministry,
        'Department(s)': item.department,
        'Joint Org. (If applicable)': item.joint_org,
        'Plan': item.plan,
        'Strategy / Initiative': item.strategy,
        'Initiative Period (B.E)': item.initiative_period,
        'Project': item.project,
        'BKK Specific': item.bkk_specific,
        'Year': item.year,
        '3S Model': item.policy_type,
        'Status': item.status,
        'Annual Budget': item.annual_budget,
        'Synopsis': item.synopsis,
        'KPI': item.kpi
      }));
    } catch (error) {
      console.error('Error fetching policy data:', error);
      return [];
    }
  };
  
  // Process housing supply data for charts
  const processHousingSupplyData = (rawData) => {
    // Group by year
    const groupedByYear = {};
    
    rawData.forEach(item => {
      const year = item.year;
      if (!groupedByYear[year]) {
        groupedByYear[year] = { year };
      }
      
      // Find housing category name
      const housingCategory = housingCategories.find(
        cat => cat.id === parseInt(item.housing_id)
      );
      
      if (housingCategory) {
        groupedByYear[year][housingCategory.name] = parseInt(item.housing_unit);
      }
    });
    
    // Convert to array format for charts
    return Object.values(groupedByYear).sort((a, b) => a.year - b.year);
  };
  
  // Fetch data when active province changes
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [
          populationResult,
          householdResult,
          incomeResult,
          housingSupplyResult,
          populationAgeResult,
          policyResult
        ] = await Promise.all([
          fetchPopulationData(activeProvince),
          fetchHouseholdData(activeProvince),
          fetchIncomeData(activeProvince),
          fetchHousingSupplyData(activeProvince),
          fetchPopulationAgeData(activeProvince),
          fetchPolicyData(activeProvince)
        ]);
        
        // Fetch expenditure data for each quintile
        const expenditureResults = {};
        for (let i = 1; i <= 5; i++) {
          expenditureResults[i] = await fetchExpenditureData(activeProvince, i);
        }
        
        // Update state with all fetched data
        setPopulationData(populationResult);
        setHouseholdData(householdResult);
        setIncomeData(incomeResult);
        setHousingSupplyData(processHousingSupplyData(housingSupplyResult));
        setExpenditureData(expenditureResults);
        setPolicyData(policyResult);
        setPopulationAgeData(populationAgeResult);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [activeProvince]);
  
  // Get filtered policies based on the selected filter
  const getFilteredPolicies = () => {
    if (!policyFilter || !policyData.length) return policyData;
    
    if (policyFilter.startsWith('status:')) {
      const status = policyFilter.split(':')[1];
      return policyData.filter(policy => policy.Status === status);
    }
    
    if (policyFilter.startsWith('type:')) {
      const type = policyFilter.split(':')[1];
      return policyData.filter(policy => 
        policy['3S Model'] && policy['3S Model'].includes(type)
      );
    }
    
    return policyData;
  };
  
  const filteredPolicies = getFilteredPolicies();
  
  // Display key metrics from latest data
  const getLatestMetrics = () => {
    if (!populationData.length || !householdData.length || !incomeData.length) {
      return { population: 0, households: 0, income: 0, incomeGrowth: 0 };
    }
    
    const latestPopulation = populationData[populationData.length - 1]?.population || 0;
    const latestHouseholds = householdData[householdData.length - 1]?.household || 0;
    const latestIncome = incomeData[incomeData.length - 1]?.income || 0;
    
    // Calculate income growth
    const firstIncome = incomeData[0]?.income || 0;
    const incomeGrowth = firstIncome ? ((latestIncome / firstIncome) - 1) * 100 : 0;
    
    return {
      population: latestPopulation,
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
          
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-3 text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-red-600">
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  ลองใหม่
                </button>
              </div>
            </div>
          )}
          
          {/* Demographics Content */}
          {!loading && !error && activeTopic === 'demographics' && (
            <div>
              {/* First row of charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <PopulationChart 
                  data={populationData} 
                  provinceName={provinceName} 
                />
                <PopulationAgeChart 
                  data={populationAgeData}
                  provinceName={provinceName}
                />
              </div>
              
              {/* Second row of charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <IncomeChart 
                  data={incomeData} 
                  provinceName={provinceName} 
                />
                <ExpenditureChart 
                  data={expenditureData} 
                  provinceName={provinceName}
                  expenditureCategories={expenditureCategories}
                  quintiles={quintiles}
                  rawExpenditureData={expenditureData}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <HouseholdChart 
                  data={householdData} 
                  provinceName={provinceName} 
                />
              </div>
            </div>
          )}
          
          {/* Housing Content */}
          {!loading && !error && activeTopic === 'housing' && (
            <div>
              {/* Housing charts row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <HousingSupplyChart 
                  provinceName={provinceName}
                  provinceId={activeProvince}
                />
                <HousingDistributionChart 
                  data={housingSupplyData}
                  housingCategories={housingCategories}
                />
              </div>
              
              {/* Additional housing charts row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <HousingUnitsChart 
                  data={housingSupplyData}
                  housingCategories={housingCategories}
                />
                <TotalHousingChart 
                  data={housingSupplyData}
                  housingCategories={housingCategories}
                />
              </div>
            </div>
          )}
          
          {/* Policy Content */}
          {!loading && !error && activeTopic === 'policy' && (
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
              
              {/* Policy charts and tables */}
              <div className="mb-4">
                <PolicyChart 
                  policies={policyData} 
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
          
          {/* Key Metrics Bar - Moved below map */}
          {!loading && !error && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg shadow">
                <p className="text-xs text-gray-500">Population (2023)</p>
                <p className="text-lg font-bold text-blue-800">
                  {new Intl.NumberFormat('th-TH').format(metrics.population)} คน
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg shadow">
                <p className="text-xs text-gray-500">Households (2023)</p>
                <p className="text-lg font-bold text-green-800">
                  {new Intl.NumberFormat('th-TH').format(metrics.households)} ครัวเรือน
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg shadow">
                <p className="text-xs text-gray-500">Median Income</p>
                <p className="text-lg font-bold text-purple-800">
                  {new Intl.NumberFormat('th-TH').format(metrics.income)} บาท
                </p>
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
          {!loading && !error && policyData.length > 0 && (
            <div className="bg-white p-0 rounded-lg shadow mb-4">
              <div className="px-3 py-2 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-800">Housing Policy Summary</h3>
                  {policyFilter && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Filtered
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Active Policies:</span>
                  <span className="text-sm font-medium text-green-600">
                    {filteredPolicies.filter(p => p.Status === 'Active').length}
                    {policyFilter && (
                      <span className="text-xs text-gray-500 ml-1">
                        / {policyData.filter(p => p.Status === 'Active').length}
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
                        / {policyData.filter(p => p.Status === 'Pending').length}
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
                        / {policyData.length}
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
                      const totalCount = policyData.filter(p => p['3S Model'] && p['3S Model'].includes(type)).length;
                      
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
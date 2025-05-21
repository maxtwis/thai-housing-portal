// utils/dataUtils.js
import { getCkanData, ckanSqlQuery, getProvinceData } from './ckanClient';

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
export const RESOURCE_IDS = {
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

// Get population data
export const getPopulationData = async (geoId = null) => {
  try {
    return await getProvinceData(RESOURCE_IDS.population_data, geoId, { 
      limit: 500,
      sort: 'year asc'
    });
  } catch (error) {
    console.error('Error fetching population data:', error);
    return [];
  }
};

// Get household data
export const getHouseholdData = async (geoId = null) => {
  try {
    return await getProvinceData(RESOURCE_IDS.household_data, geoId, { 
      limit: 500,
      sort: 'year asc'
    });
  } catch (error) {
    console.error('Error fetching household data:', error);
    return [];
  }
};

// Get income data
export const getIncomeData = async (geoId = null) => {
  try {
    return await getProvinceData(RESOURCE_IDS.income_data, geoId, { 
      limit: 500,
      sort: 'year asc'
    });
  } catch (error) {
    console.error('Error fetching income data:', error);
    return [];
  }
};

// Get expenditure data
export const getExpenditureData = async (geoId = null, quintile = null) => {
  try {
    let filters = {};
    
    if (geoId) filters.geo_id = geoId;
    if (quintile) filters.quintile = quintile;
    
    const result = await getCkanData(RESOURCE_IDS.expenditure_data, {
      filters: JSON.stringify(filters),
      limit: 500
    });
    
    return result.records || [];
  } catch (error) {
    console.error('Error fetching expenditure data:', error);
    return [];
  }
};

// Get population age data
export const getPopulationAgeData = async (geoId = null) => {
  try {
    return await getProvinceData(RESOURCE_IDS.population_age_data, geoId, { 
      limit: 500,
      sort: 'year asc, age_group asc'
    });
  } catch (error) {
    console.error('Error fetching population age data:', error);
    return [];
  }
};

// Get housing supply data
export const getHousingSupplyData = async (geoId = null, year = null) => {
  try {
    let filters = {};
    
    if (geoId) filters.geo_id = geoId;
    if (year) filters.year = year;
    
    const result = await getCkanData(RESOURCE_IDS.housing_supply_data, {
      filters: JSON.stringify(filters),
      limit: 1000
    });
    
    return result.records || [];
  } catch (error) {
    console.error('Error fetching housing supply data:', error);
    return [];
  }
};

// Get housing supply data grouped by year
export const getHousingSupplyByYear = async (geoId) => {
  try {
    const data = await getHousingSupplyData(geoId);
    
    // Process data for charts
    const groupedByYear = {};
    
    data.forEach(item => {
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
  } catch (error) {
    console.error('Error processing housing supply data:', error);
    return [];
  }
};

// Get chart colors
export const getChartColor = (index) => {
  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
  ];
  return colors[index % colors.length];
};
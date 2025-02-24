import _ from 'lodash';
import { supabase } from '../utils/supabaseClient';

// Cache for fetched data
const dataCache = {};

export const provinces = [
  { id: 10, name: 'กรุงเทพมหานคร', lat: 13.7563, lon: 100.5018 },
  { id: 40, name: 'ขอนแก่น', lat: 16.4419, lon: 102.8359 },
  { id: 50, name: 'เชียงใหม่', lat: 18.7883, lon: 98.9817 },
  { id: 90, name: 'สงขลา', lat: 7.1891, lon: 100.5951 }
];

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

// Get population data
export const getPopulationData = async (geoId = null) => {
  const cacheKey = `population_${geoId || 'all'}`;
  
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  
  try {
    let query = supabase.from('population_data').select('*');
    
    if (geoId) {
      query = query.eq('geo_id', geoId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    dataCache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error('Error fetching population data:', error);
    throw error;
  }
};

// Get household data
export const getHouseholdData = async (geoId = null) => {
  const cacheKey = `household_${geoId || 'all'}`;
  
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  
  try {
    let query = supabase.from('household_data').select('*');
    
    if (geoId) {
      query = query.eq('geo_id', geoId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    dataCache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error('Error fetching household data:', error);
    throw error;
  }
};

// Get income data
export const getIncomeData = async (geoId = null) => {
  const cacheKey = `income_${geoId || 'all'}`;
  
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  
  try {
    let query = supabase.from('income_data').select('*');
    
    if (geoId) {
      query = query.eq('geo_id', geoId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    dataCache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error('Error fetching income data:', error);
    throw error;
  }
};

// Get expenditure data
export const getExpenditureData = async (geoId = null, quintile = null) => {
  const cacheKey = `expenditure_${geoId || 'all'}_${quintile || 'all'}`;
  
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  
  try {
    let query = supabase.from('expenditure_data').select('*');
    
    if (geoId) {
      query = query.eq('geo_id', geoId);
    }
    
    if (quintile) {
      query = query.eq('quintile', quintile);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    dataCache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error('Error fetching expenditure data:', error);
    throw error;
  }
};

// Get expenditure data grouped by quintile
export const getExpenditureByQuintile = async (geoId) => {
  const data = await getExpenditureData(geoId);
  return _.groupBy(data, 'quintile');
};

// Get population by age data
export const getPopulationAgeData = async (geoId = null) => {
  const cacheKey = `population_age_${geoId || 'all'}`;
  
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  
  try {
    let query = supabase.from('population_agegroup_data').select('*');
    
    if (geoId) {
      query = query.eq('geo_id', geoId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    dataCache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error('Error fetching population age data:', error);
    throw error;
  }
};

// Get housing supply data
export const getHousingSupplyData = async (geoId = null, year = null) => {
  const cacheKey = `housing_supply_${geoId || 'all'}_${year || 'all'}`;
  
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  
  try {
    let query = supabase.from('housing_supply_data').select('*');
    
    if (geoId) {
      query = query.eq('geo_id', geoId);
    }
    
    if (year) {
      query = query.eq('year', year);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    dataCache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error('Error fetching housing supply data:', error);
    throw error;
  }
};

// Get housing supply data grouped by year and housing type
export const getHousingSupplyByYear = async (geoId) => {
  const data = await getHousingSupplyData(geoId);
  const groupedByYear = _.groupBy(data, 'year');
  
  // Convert to format needed for charts
  return Object.entries(groupedByYear).map(([year, items]) => {
    const result = { year: parseInt(year) };
    
    items.forEach(item => {
      const housingType = housingCategories.find(h => h.id === item.housing_id);
      if (housingType) {
        result[housingType.name] = item.housing_unit;
      }
    });
    
    return result;
  });
};

// Get color for charts based on index
export const getChartColor = (index) => {
  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
  ];
  return colors[index % colors.length];
};
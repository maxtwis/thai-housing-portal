// utils/ckanClient.js

/**
 * Simple CKAN API Client that directly accesses the CKAN API
 */

// Base URL for the CKAN API that works in Postman
const CKAN_BASE_URL = 'http://147.50.228.205/api/3/action';

/**
 * Get data from a CKAN dataset using datastore_search
 * @param {string} resource_id - The resource ID
 * @param {object} options - Additional options (limit, filters, etc.)
 * @returns {Promise} - Promise that resolves to the data
 */
const getCkanData = async (resource_id, options = {}) => {
  try {
    // Build the URL with query parameters
    let url = `${CKAN_BASE_URL}/datastore_search?resource_id=${resource_id}`;
    
    // Add any additional options as query parameters
    for (const [key, value] of Object.entries(options)) {
      if (key !== 'resource_id') { // Skip resource_id as it's already in the URL
        // Handle objects (like filters) by converting to JSON string
        const paramValue = typeof value === 'object' ? JSON.stringify(value) : value;
        url += `&${key}=${encodeURIComponent(paramValue)}`;
      }
    }
    
    console.log(`CKAN API Request: ${url}`);
    
    // Make the request
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown CKAN API error');
    }
    
    // Return the result part of the response
    return data.result;
  } catch (error) {
    console.error('Error fetching CKAN data:', error);
    throw error;
  }
};

/**
 * Execute an SQL query on CKAN using datastore_search_sql
 * @param {string} sql - The SQL query
 * @returns {Promise} - Promise that resolves to the query results
 */
const ckanSqlQuery = async (sql) => {
  try {
    // URL encode the SQL query
    const encodedSql = encodeURIComponent(sql);
    const url = `${CKAN_BASE_URL}/datastore_search_sql?sql=${encodedSql}`;
    
    console.log(`CKAN SQL Query: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown CKAN API error');
    }
    
    return data.result;
  } catch (error) {
    console.error('Error executing SQL query in CKAN:', error);
    throw error;
  }
};

/**
 * Get resource data filtered by geo_id (province)
 * @param {string} resource_id - Resource ID
 * @param {number} geo_id - Province ID
 * @param {object} options - Additional options
 * @returns {Promise<Array>} - Promise that resolves to filtered records
 */
const getProvinceData = async (resource_id, geo_id, options = {}) => {
  try {
    // Create filters for the province
    const filters = JSON.stringify({ geo_id });
    
    // Fetch data with filters
    const result = await getCkanData(resource_id, { 
      filters,
      ...options
    });
    
    return result.records || [];
  } catch (error) {
    console.error(`Error fetching province data for ${resource_id}:`, error);
    throw error;
  }
};

/**
 * Process housing supply data for charts
 * @param {Array} rawData - Raw housing supply data from CKAN
 * @param {Array} housingCategories - Housing categories definition
 * @returns {Array} - Processed data for charts
 */
const processHousingSupplyData = (rawData, housingCategories) => {
  // Group by year
  const groupedByYear = {};
  
  if (!rawData || !Array.isArray(rawData) || !housingCategories) {
    return [];
  }
  
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

// Export the functions
export {
  getCkanData,
  ckanSqlQuery,
  getProvinceData,
  processHousingSupplyData
};
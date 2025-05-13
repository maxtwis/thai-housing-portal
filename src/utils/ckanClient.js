// utils/ckanClient.js

/**
 * CKAN API Client with CORS proxy support
 * Uses a server-side proxy to avoid CORS issues when accessing CKAN API
 */

// Base URL for the CKAN API
const CKAN_BASE_URL = 'http://147.50.228.205/api/3/action';

/**
 * Get data from a CKAN dataset using datastore_search
 * @param {string} resource_id - The resource ID
 * @param {object} options - Additional options (limit, filters, etc.)
 * @returns {Promise} - Promise that resolves to the data
 */
const getCkanData = async (resource_id, options = {}) => {
  try {
    // Build the CKAN URL with query parameters
    let ckanUrl = `${CKAN_BASE_URL}/datastore_search?resource_id=${resource_id}`;
    
    // Add any additional options as query parameters
    for (const [key, value] of Object.entries(options)) {
      if (key !== 'resource_id') {
        const paramValue = typeof value === 'object' ? JSON.stringify(value) : value;
        ckanUrl += `&${key}=${encodeURIComponent(paramValue)}`;
      }
    }
    
    console.log(`CKAN API Request: ${ckanUrl}`);
    
    // Use the CORS proxy to make the request
    const proxyUrl = `/api/cors-proxy?url=${encodeURIComponent(ckanUrl)}`;
    
    console.log(`Proxy URL: ${proxyUrl}`);
    
    // Make the request through the proxy
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      // Try to get error details from the response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.details || '';
      } catch (e) {
        errorDetails = `HTTP ${response.status} ${response.statusText}`;
      }
      throw new Error(`Proxy error: ${errorDetails}`);
    }
    
    const data = await response.json();
    
    // Check if the CKAN API returned an error
    if (data.error) {
      throw new Error(`CKAN API error: ${data.error}`);
    }
    
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
    const ckanUrl = `${CKAN_BASE_URL}/datastore_search_sql?sql=${encodedSql}`;
    
    console.log(`CKAN SQL Query: ${ckanUrl}`);
    
    // Use the CORS proxy to make the request
    const proxyUrl = `/api/cors-proxy?url=${encodeURIComponent(ckanUrl)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      // Try to get error details from the response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.details || '';
      } catch (e) {
        errorDetails = `HTTP ${response.status} ${response.statusText}`;
      }
      throw new Error(`Proxy error: ${errorDetails}`);
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
 * Get all records from a resource
 * @param {string} resource_id - Resource ID
 * @param {number} batchSize - Number of records to fetch per request (default: 1000)
 * @returns {Promise<Array>} - Promise that resolves to all records
 */
const getAllRecords = async (resource_id, batchSize = 1000) => {
  try {
    // Get total record count
    const initialResult = await getCkanData(resource_id, { limit: 1 });
    const totalRecords = initialResult.total;
    
    if (!totalRecords) {
      return [];
    }
    
    // If there are fewer records than batch size, return them directly
    if (totalRecords <= batchSize) {
      const result = await getCkanData(resource_id, { limit: totalRecords });
      return result.records || [];
    }
    
    // Otherwise, fetch in batches
    const batches = Math.ceil(totalRecords / batchSize);
    let allRecords = [];
    
    for (let i = 0; i < batches; i++) {
      const result = await getCkanData(resource_id, {
        offset: i * batchSize,
        limit: batchSize
      });
      
      if (result.records && result.records.length) {
        allRecords = [...allRecords, ...result.records];
      }
      
      // Safety check - if we got fewer records than expected, stop
      if (!result.records || result.records.length < batchSize) {
        break;
      }
    }
    
    return allRecords;
  } catch (error) {
    console.error(`Error fetching all records for ${resource_id}:`, error);
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
    console.log('processHousingSupplyData: Invalid data provided', { 
      rawData: rawData ? rawData.length : 'null', 
      housingCategories: housingCategories ? housingCategories.length : 'null' 
    });
    return [];
  }
  
  console.log(`Processing ${rawData.length} housing supply records`);
  
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
  const result = Object.values(groupedByYear).sort((a, b) => a.year - b.year);
  console.log(`Processed into ${result.length} years of data`);
  
  return result;
};

/**
 * Get distinct values for a field in a resource
 * @param {string} resource_id - Resource ID
 * @param {string} field - Field name to get distinct values for
 * @returns {Promise<Array>} - Promise that resolves to array of distinct values
 */
const getDistinctValues = async (resource_id, field) => {
  try {
    // Use SQL to get distinct values
    const sql = `SELECT DISTINCT ${field} FROM "${resource_id}" ORDER BY ${field}`;
    const result = await ckanSqlQuery(sql);
    
    if (result && result.records) {
      return result.records.map(record => record[field]);
    }
    
    return [];
  } catch (error) {
    console.error(`Error getting distinct values for ${field}:`, error);
    throw error;
  }
};

/**
 * Test connection to CKAN API
 * @returns {Promise<boolean>} - Promise that resolves to true if connection is successful
 */
const testConnection = async () => {
  try {
    // Test with a simple query
    const result = await getCkanData('15132377-edb0-40b0-9aad-8fd9f6769b92', { limit: 1 });
    return !!result;
  } catch (error) {
    console.error('CKAN connection test failed:', error);
    return false;
  }
};

/**
 * Get metadata about a resource
 * @param {string} resource_id - Resource ID
 * @returns {Promise<Object>} - Promise that resolves to resource metadata
 */
const getResourceMetadata = async (resource_id) => {
  try {
    // Use a simple search to get metadata
    const result = await getCkanData(resource_id, { limit: 0 });
    
    return {
      fields: result.fields || [],
      total: result.total || 0,
      resource_id: result.resource_id
    };
  } catch (error) {
    console.error(`Error fetching metadata for ${resource_id}:`, error);
    throw error;
  }
};

// Export all functions
export {
  getCkanData,
  ckanSqlQuery,
  getProvinceData,
  getAllRecords,
  processHousingSupplyData,
  getDistinctValues,
  testConnection,
  getResourceMetadata
};
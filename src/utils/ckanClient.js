// utils/ckanClient.js

/**
 * CKAN API Client
 * Uses a proxy endpoint to communicate with CKAN API
 */

// Base URL for the proxy API route
const API_BASE_URL = '/api/ckan-proxy';

/**
 * Make a request to the CKAN API via proxy
 * @param {string} action - The CKAN API action
 * @param {object} params - Parameters to send
 * @returns {Promise} - Promise resolving to response data
 */
const ckanApiRequest = async (action, params = {}) => {
  try {
    console.log(`CKAN API Request: ${action}`, params);
    
    const response = await fetch(`${API_BASE_URL}?action=${action}`, {
      method: 'POST',  // Always use POST for CKAN API
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || data.error || 'Unknown CKAN API error');
    }
    
    return data.result;
  } catch (error) {
    console.error(`Error in CKAN API (${action}):`, error);
    throw error;
  }
};

/**
 * Get data from a CKAN dataset using datastore_search
 * @param {string} resource_id - The resource ID
 * @param {object} options - Additional options (limit, filters, etc.)
 * @returns {Promise} - Promise that resolves to the data
 */
const getCkanData = async (resource_id, options = {}) => {
  const params = {
    resource_id,
    ...options,
  };
  
  return ckanApiRequest('datastore_search', params);
};

/**
 * Execute an SQL query on CKAN using datastore_search_sql
 * @param {string} sql - The SQL query
 * @returns {Promise} - Promise that resolves to the query results
 */
const ckanSqlQuery = async (sql) => {
  return ckanApiRequest('datastore_search_sql', { sql });
};

/**
 * Retrieve a list of datasets using package_list
 * @returns {Promise} - Promise that resolves to a list of datasets
 */
const getDatasetList = async () => {
  return ckanApiRequest('package_list');
};

/**
 * Get detailed information about a dataset using package_show
 * @param {string} dataset_id - Dataset ID or name
 * @returns {Promise} - Promise that resolves to dataset details
 */
const getDatasetInfo = async (dataset_id) => {
  return ckanApiRequest('package_show', { id: dataset_id });
};

/**
 * Get details about a resource using resource_show
 * @param {string} resource_id - Resource ID
 * @returns {Promise} - Promise that resolves to resource details
 */
const getResourceInfo = async (resource_id) => {
  return ckanApiRequest('resource_show', { id: resource_id });
};

/**
 * Get information about the CKAN site using site_read
 * @returns {Promise} - Promise that resolves to site information
 */
const getSiteInfo = async () => {
  return ckanApiRequest('site_read');
};

/**
 * Search for datasets using package_search
 * @param {object} query - Search parameters
 * @returns {Promise} - Promise that resolves to search results
 */
const searchDatasets = async (query = {}) => {
  return ckanApiRequest('package_search', query);
};

/**
 * Test connection to CKAN API
 * @returns {Promise<boolean>} - Promise that resolves to true if connection is successful
 */
const testConnection = async () => {
  try {
    const result = await getSiteInfo();
    return !!result;
  } catch (error) {
    console.error('CKAN connection test failed:', error);
    return false;
  }
};

/**
 * Get all records from a resource
 * @param {string} resource_id - Resource ID
 * @param {number} batchSize - Number of records to fetch per request
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

// Export all functions
export {
  ckanApiRequest,
  getCkanData,
  ckanSqlQuery,
  getDatasetList,
  getDatasetInfo,
  getResourceInfo,
  getSiteInfo,
  searchDatasets,
  testConnection,
  getAllRecords,
  processHousingSupplyData
};
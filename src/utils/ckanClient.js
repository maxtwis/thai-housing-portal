// utils/ckanClient.js

/**
 * CKAN API Client
 * Communicates with CKAN API via a proxy endpoint to avoid CORS issues
 */

// Base URL for the proxy API route
const API_BASE_URL = '/api/ckan-proxy';

/**
 * Make a request to the CKAN API via proxy
 * @param {string} action - The CKAN API action
 * @param {object} params - Parameters to send
 * @param {boolean} useGet - Whether to use GET instead of POST
 * @returns {Promise} - Promise resolving to response data
 */
const ckanApiRequest = async (action, params = {}, useGet = false) => {
  try {
    // Actions that work well with GET
    const getActions = ['datastore_search', 'package_list', 'package_show', 'resource_show', 'site_read'];
    
    // Determine whether to use GET or POST
    const shouldUseGet = useGet || (getActions.includes(action) && Object.keys(params).length < 5);
    
    let url = `${API_BASE_URL}?action=${action}`;
    let fetchOptions = {};
    
    if (shouldUseGet) {
      // For GET requests, add params to the URL
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value));
        } else {
          searchParams.append(key, String(value));
        }
      }
      
      if (searchParams.toString()) {
        url += `&${searchParams.toString()}`;
      }
      
      fetchOptions = { method: 'GET' };
    } else {
      // For POST requests, add params to the body
      fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      };
    }
    
    console.log(`CKAN API Request: ${shouldUseGet ? 'GET' : 'POST'} ${action}`, 
      shouldUseGet ? `params in URL: ${url.substring(0, 100)}...` : `params: ${JSON.stringify(params).substring(0, 100)}...`);
    
    const response = await fetch(url, fetchOptions);
    
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
  
  // Use GET for datastore_search
  return ckanApiRequest('datastore_search', params, true);
};

/**
 * Execute an SQL query on CKAN using datastore_search_sql
 * @param {string} sql - The SQL query
 * @returns {Promise} - Promise that resolves to the query results
 */
const ckanSqlQuery = async (sql) => {
  // SQL queries are better with POST due to potential length and encoding issues
  return ckanApiRequest('datastore_search_sql', { sql }, false);
};

/**
 * Retrieve a list of datasets using package_list
 * @returns {Promise} - Promise that resolves to a list of datasets
 */
const getDatasetList = async () => {
  return ckanApiRequest('package_list', {}, true);
};

/**
 * Get detailed information about a dataset using package_show
 * @param {string} dataset_id - Dataset ID or name
 * @returns {Promise} - Promise that resolves to dataset details
 */
const getDatasetInfo = async (dataset_id) => {
  return ckanApiRequest('package_show', { id: dataset_id }, true);
};

/**
 * Get details about a resource using resource_show
 * @param {string} resource_id - Resource ID
 * @returns {Promise} - Promise that resolves to resource details
 */
const getResourceInfo = async (resource_id) => {
  return ckanApiRequest('resource_show', { id: resource_id }, true);
};

/**
 * Get information about the CKAN site using site_read
 * @returns {Promise} - Promise that resolves to site information
 */
const getSiteInfo = async () => {
  return ckanApiRequest('site_read', {}, true);
};

/**
 * Search for datasets using package_search
 * @param {object} query - Search parameters
 * @returns {Promise} - Promise that resolves to search results
 */
const searchDatasets = async (query = {}) => {
  return ckanApiRequest('package_search', query, Object.keys(query).length < 3);
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

/**
 * Make a direct request to CKAN (bypassing proxy - for debugging only)
 * @param {string} action - The CKAN API action
 * @param {object} params - Parameters to send
 * @returns {Promise} - Promise resolving to response data
 */
const directCkanRequest = async (action, params = {}) => {
  try {
    // This is for debugging only - should normally use the proxy
    const url = `http://147.50.228.205/api/3/action/${action}`;
    
    // For GET requests with params
    let fullUrl = url;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value));
        } else {
          searchParams.append(key, String(value));
        }
      }
      fullUrl += `?${searchParams.toString()}`;
    }
    
    console.log(`Direct CKAN Request (Debug): GET ${fullUrl}`);
    
    const response = await fetch(fullUrl);
    const data = await response.json();
    
    console.log(`Direct CKAN Response (Debug): Status ${response.status}`);
    return data;
  } catch (error) {
    console.error(`Direct CKAN request error:`, error);
    throw error;
  }
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
  getProvinceData,
  processHousingSupplyData,
  directCkanRequest  // For debugging only
};
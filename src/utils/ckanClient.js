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
      shouldUseGet ? `params in URL: ${url.substring(0, 150)}...` : `params: ${JSON.stringify(params).substring(0, 150)}...`);
    
    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
    fetchOptions.signal = controller.signal;
    
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      // Check if response is OK
      if (!response.ok) {
        // Try to get the response content to see what went wrong
        let errorMessage;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || `Status: ${response.status}`;
          } else {
            const errorText = await response.text();
            errorMessage = `Non-JSON response (${response.status}): ${errorText.substring(0, 200)}...`;
          }
        } catch (responseError) {
          errorMessage = `Failed to parse error response: ${responseError.message}`;
        }
        
        throw new Error(`CKAN API error: ${errorMessage}`);
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        let responseText = '';
        try {
          responseText = await response.text();
        } catch (textError) {
          responseText = 'Could not read response text';
        }
        
        throw new Error(`Expected JSON but got ${contentType}: ${responseText.substring(0, 200)}...`);
      }
      
      // Parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`JSON parse error: ${jsonError.message}`);
      }
      
      // Check for CKAN success flag
      if (!data.success) {
        const errorMsg = typeof data.error === 'object' 
          ? JSON.stringify(data.error)
          : (data.error || 'Unknown CKAN API error');
          
        throw new Error(errorMsg);
      }
      
      // Return just the result part
      return data.result;
      
    } catch (fetchError) {
      // Check if this was a timeout
      if (fetchError.name === 'AbortError') {
        throw new Error(`CKAN API request timed out after 10 seconds (${action})`);
      }
      throw fetchError;
    }
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
  
  // Try direct access first (if in development)
  if (process.env.NODE_ENV === 'development') {
    try {
      console.log('Trying direct CKAN access first (dev only)...');
      const directResult = await directCkanRequest('datastore_search', params);
      if (directResult && directResult.success) {
        console.log('Direct CKAN access succeeded');
        return directResult.result;
      }
    } catch (directError) {
      console.log('Direct CKAN access failed, falling back to proxy:', directError.message);
    }
  }
  
  // Use GET for datastore_search with proxy
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
    // First try a direct connection to CKAN (bypassing proxy)
    try {
      const directResult = await directCkanRequest('site_read');
      if (directResult && directResult.success) {
        console.log('Direct CKAN connection successful');
        return true;
      }
    } catch (directError) {
      console.log('Direct CKAN connection failed:', directError.message);
    }
    
    // Fall back to proxy connection
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
 * Make a direct request to CKAN (bypassing proxy)
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
    
    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
    
    const response = await fetch(fullUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    console.log(`Direct CKAN Response (Debug): Status ${response.status}`);
    
    // Try to parse as JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    } else {
      const text = await response.text();
      throw new Error(`Non-JSON response: ${contentType}, content: ${text.substring(0, 200)}...`);
    }
  } catch (error) {
    console.error(`Direct CKAN request error:`, error);
    throw error;
  }
};

/**
 * Special function to fetch province data using SQL for better performance
 * @param {string} resource_id - Resource ID
 * @param {number} geo_id - Province ID
 * @returns {Promise<Array>} - Promise that resolves to filtered records
 */
const getProvinceDataWithSql = async (resource_id, geo_id) => {
  try {
    // Use SQL query for filtering by province
    const sql = `SELECT * FROM "${resource_id}" WHERE geo_id = ${geo_id}`;
    const result = await ckanSqlQuery(sql);
    return result.records || [];
  } catch (sqlError) {
    console.error(`SQL query failed, falling back to filters: ${sqlError.message}`);
    
    // Fall back to regular filtering
    return getProvinceData(resource_id, geo_id);
  }
};

/**
 * Debug function to check proxy and direct connections
 * @returns {Promise<object>} - Diagnostic information
 */
const diagnoseConnection = async () => {
  const results = {
    direct: { success: false, error: null },
    proxy: { success: false, error: null },
    recommendation: ''
  };
  
  // Test direct connection
  try {
    const directResult = await directCkanRequest('datastore_search', { 
      resource_id: '15132377-edb0-40b0-9aad-8fd9f6769b92',
      limit: 1
    });
    results.direct.success = directResult && directResult.success;
    results.direct.data = directResult;
  } catch (directError) {
    results.direct.error = directError.message;
  }
  
  // Test proxy connection
  try {
    const proxyResult = await ckanApiRequest('datastore_search', { 
      resource_id: '15132377-edb0-40b0-9aad-8fd9f6769b92',
      limit: 1
    }, true);
    results.proxy.success = !!proxyResult;
    results.proxy.data = proxyResult;
  } catch (proxyError) {
    results.proxy.error = proxyError.message;
  }
  
  // Generate recommendation
  if (results.direct.success && !results.proxy.success) {
    results.recommendation = 'Direct connection works, but proxy fails. Check your API route implementation.';
  } else if (!results.direct.success && !results.proxy.success) {
    results.recommendation = 'Both direct and proxy connections fail. Check CKAN server availability and network access.';
  } else if (!results.direct.success && results.proxy.success) {
    results.recommendation = 'Proxy works but direct fails. CORS is likely blocking direct access as expected.';
  } else {
    results.recommendation = 'Both connections work. Use proxy in production for CORS compliance.';
  }
  
  return results;
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
  getProvinceDataWithSql,
  processHousingSupplyData,
  directCkanRequest,
  diagnoseConnection
};
// utils/ckanClient.js

const API_BASE_URL = '/api/ckan-proxy';

/**
 * Make a POST request to the CKAN API
 * @param {string} action - The CKAN API action
 * @param {object} params - The parameters to send
 * @returns {Promise} - Promise that resolves to the API response
 */
const ckanApiRequest = async (action, params = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}?action=${action}`, {
      method: 'POST',
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
      throw new Error(data.error || 'Unknown CKAN API error');
    }
    
    return data.result;
  } catch (error) {
    console.error(`Error in CKAN API request (${action}):`, error);
    throw error;
  }
};

/**
 * Get data from a CKAN dataset
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
 * Execute an SQL query on CKAN
 * @param {string} sql - The SQL query
 * @returns {Promise} - Promise that resolves to the query results
 */
const ckanSqlQuery = async (sql) => {
  return ckanApiRequest('datastore_search_sql', { sql });
};

/**
 * Retrieve a list of datasets
 * @returns {Promise} - Promise that resolves to a list of datasets
 */
const getDatasetList = async () => {
  return ckanApiRequest('package_list');
};

/**
 * Get detailed information about a dataset
 * @param {string} dataset_id - Dataset ID or name
 * @returns {Promise} - Promise that resolves to dataset details
 */
const getDatasetInfo = async (dataset_id) => {
  return ckanApiRequest('package_show', { id: dataset_id });
};

/**
 * Get details about a resource
 * @param {string} resource_id - Resource ID
 * @returns {Promise} - Promise that resolves to resource details
 */
const getResourceInfo = async (resource_id) => {
  return ckanApiRequest('resource_show', { id: resource_id });
};

// Export all functions
export {
  ckanApiRequest,
  getCkanData,
  ckanSqlQuery,
  getDatasetList,
  getDatasetInfo,
  getResourceInfo
};
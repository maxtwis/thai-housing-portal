// ckanClient.js
// Replace Supabase client with CKAN client

const CKAN_BASE_URL = 'https://147.50.228.205';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDY3ODQ1NTksImp0aSI6IlVFUFNxN0RzcXlYVXVPWlZxMjhlN3BfVEpYMFdmamxBNXF2WEZXNDVTMjdmNnJNRWR5UUF0SEZWVGxiWXdOaExYUDdGd0I3djhyTktIR2otIn0.D24QF1AccN3zup54CSi6T8_KwYrmsDNxH-Pd1IiccsE'; // Add your CKAN API token if required

/**
 * Fetch data from CKAN API
 * @param {string} resource_id - Resource ID of the dataset
 * @param {object} params - Query parameters
 * @returns {Promise} - Promise that resolves to the data
 */
const fetchCkanData = async (resource_id, params = {}) => {
  try {
    // Construct the API URL for the datastore_search endpoint
    const url = new URL(`${CKAN_BASE_URL}/api/3/action/datastore_search`);
    
    // Add resource_id and other params to the query string
    url.searchParams.append('resource_id', resource_id);
    
    // Add other parameters if provided
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN && { 'Authorization': API_TOKEN }),
      },
    });
    
    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response
    const data = await response.json();
    
    // CKAN responses have a specific structure
    if (data.success) {
      return data.result.records;
    } else {
      throw new Error(data.error?.message || 'Unknown CKAN API error');
    }
  } catch (error) {
    console.error('Error fetching data from CKAN:', error);
    throw error;
  }
};

/**
 * Get a specific dataset from CKAN
 * @param {string} resource_id - Resource ID of the dataset
 * @param {object} filters - Object containing field/value pairs for filtering
 * @param {number} limit - Number of records to return
 * @param {string} sort - Field to sort by (prefix with - for descending)
 * @returns {Promise} - Promise that resolves to the data
 */
const getCkanData = async (resource_id, filters = {}, limit = 100, sort = null) => {
  // Construct query parameters
  const params = {
    limit,
  };
  
  // Add filters if provided
  if (Object.keys(filters).length > 0) {
    params.filters = JSON.stringify(filters);
  }
  
  // Add sort if provided
  if (sort) {
    params.sort = sort;
  }
  
  return fetchCkanData(resource_id, params);
};

/**
 * Query data with SQL
 * @param {string} sql - SQL query
 * @returns {Promise} - Promise that resolves to the data
 */
const ckanSqlQuery = async (sql) => {
  try {
    const url = new URL(`${CKAN_BASE_URL}/api/3/action/datastore_search_sql`);
    url.searchParams.append('sql', sql);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN && { 'Authorization': API_TOKEN }),
      },
    });
    
    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.result.records;
    } else {
      throw new Error(data.error?.message || 'Unknown CKAN API error');
    }
  } catch (error) {
    console.error('Error executing SQL query in CKAN:', error);
    throw error;
  }
};

// Export a client object that mimics the Supabase structure
const ckan = {
  from: (resource_id) => ({
    select: (fields = '*') => ({
      eq: (field, value) => {
        const filters = { [field]: value };
        return getCkanData(resource_id, filters);
      },
      or: (filterString) => {
        // Parse filterString to create more complex queries
        // This is simplified and would need to be expanded
        // to handle the full range of Supabase query options
        const sql = `SELECT * FROM "${resource_id}" WHERE ${filterString}`;
        return ckanSqlQuery(sql);
      },
      filter: (field, operator, value) => {
        // Implementation would depend on how we want to handle different operators
        const filters = { [field]: value }; // Simplified
        return getCkanData(resource_id, filters);
      },
      // Add more methods as needed
      async execute() {
        return getCkanData(resource_id);
      }
    }),
  })
};

export { ckan, getCkanData, ckanSqlQuery };
// ckanApiTester.js
// A utility to test connection to CKAN API

const CKAN_BASE_URL = 'http://147.50.228.205';
const RESOURCE_ID = '4b016c4d-a33e-45a2-b5c9-17d48931b5e4'; // Housing Supply Resource ID

/**
 * Test basic CKAN API connection
 */
const testCkanApiConnection = async () => {
  try {
    console.log('Testing CKAN API connection...');
    
    // First, try to get package info (dataset metadata)
    const datasetInfoUrl = `${CKAN_BASE_URL}/api/3/action/package_show`;
    const response = await fetch(datasetInfoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'housing_supply_quintile', // This might need to be adjusted
      }),
    });
    
    if (!response.ok) {
      console.error(`Failed to get dataset info: ${response.status} ${response.statusText}`);
      console.log('Trying alternative endpoint...');
    } else {
      const data = await response.json();
      console.log('Dataset information:');
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    
    // If package_show fails, try the list of datasets
    const listDatasetsUrl = `${CKAN_BASE_URL}/api/3/action/package_list`;
    const listResponse = await fetch(listDatasetsUrl);
    
    if (!listResponse.ok) {
      console.error(`Failed to list datasets: ${listResponse.status} ${listResponse.statusText}`);
      console.log('Trying datastore_search endpoint directly...');
    } else {
      const listData = await listResponse.json();
      console.log('Available datasets:');
      console.log(JSON.stringify(listData, null, 2));
      return;
    }
    
    // If both fail, try direct resource access
    const resourceUrl = `${CKAN_BASE_URL}/api/3/action/datastore_search?resource_id=${RESOURCE_ID}&limit=5`;
    const resourceResponse = await fetch(resourceUrl);
    
    if (!resourceResponse.ok) {
      console.error(`Failed to access resource: ${resourceResponse.status} ${resourceResponse.statusText}`);
      console.log('All attempts to connect to CKAN API failed.');
      return;
    }
    
    const resourceData = await resourceResponse.json();
    console.log('Resource sample data:');
    console.log(JSON.stringify(resourceData, null, 2));
    
  } catch (error) {
    console.error('Error testing CKAN API connection:', error);
  }
};

/**
 * Test SQL query capability
 */
const testSqlQuery = async () => {
  try {
    console.log('Testing CKAN SQL query capability...');
    
    const sql = `SELECT * FROM "${RESOURCE_ID}" LIMIT 5`;
    const url = new URL(`${CKAN_BASE_URL}/api/3/action/datastore_search_sql`);
    url.searchParams.append('sql', sql);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to execute SQL query: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log('SQL query result:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing CKAN SQL query:', error);
  }
};

// Execute tests
(async () => {
  await testCkanApiConnection();
  await testSqlQuery();
})();

export { testCkanApiConnection, testSqlQuery };
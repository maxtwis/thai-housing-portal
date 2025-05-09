// pages/api/ckan-proxy.js

/**
 * CKAN API Proxy Handler
 * Forwards requests to CKAN API and handles CORS issues
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get the API action from the query parameter
    const { action } = req.query;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        error: "Missing 'action' parameter"
      });
    }
    
    // Actions that work with GET requests
    const getActions = ['datastore_search', 'package_list', 'package_show', 'resource_show', 'site_read'];
    
    // Construct the CKAN URL
    let ckanUrl = `http://147.50.228.205/api/3/action/${action}`;
    
    // Determine whether to use GET or POST based on the action and client request
    let method = 'POST';
    let fetchOptions = {};
    
    if (getActions.includes(action) && req.method === 'GET') {
      // Use GET for these actions when client used GET
      method = 'GET';
      
      // Add query parameters from req.query (except 'action')
      const { action: _, ...queryParams } = req.query;
      
      if (Object.keys(queryParams).length > 0) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(queryParams)) {
          searchParams.append(key, value);
        }
        ckanUrl += `?${searchParams.toString()}`;
      }
      
      fetchOptions = { method };
    } else {
      // Use POST with JSON body for other actions or when client explicitly used POST
      let params = {};
      
      if (req.method === 'POST' && req.body) {
        params = req.body;
      } else if (req.method === 'GET') {
        const { action, ...queryParams } = req.query;
        params = queryParams;
      }
      
      fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      };
    }
    
    console.log(`CKAN Proxy Request: ${method} ${ckanUrl}`);
    
    // Make the request to CKAN
    const response = await fetch(ckanUrl, fetchOptions);
    
    console.log(`CKAN Response Status: ${response.status}`);
    
    // Get response data
    const data = await response.json();
    
    // Return the data with the same format
    res.status(200).json(data);
  } catch (error) {
    console.error('CKAN proxy error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch data from CKAN',
      details: error.message 
    });
  }
}
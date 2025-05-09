// pages/api/ckan-proxy.js
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
    
    // Construct the CKAN URL
    const ckanUrl = `http://147.50.228.205/api/3/action/${action}`;
    
    // Get parameters from either body or query
    let params = {};
    
    // For POST requests, use the body
    if (req.method === 'POST') {
      params = req.body || {};
    } 
    // For GET requests, use query params (except 'action')
    else if (req.method === 'GET') {
      // Copy query params to request body (except 'action')
      const { action, ...queryParams } = req.query;
      params = queryParams;
      
      // If there's a 'sql' parameter, make sure it's properly decoded
      if (params.sql && typeof params.sql === 'string') {
        params.sql = decodeURIComponent(params.sql);
      }
    }
    
    console.log(`CKAN Proxy: ${action}`, { method: req.method, params });
    
    // Always make POST requests to CKAN API, regardless of the original method
    const response = await fetch(ckanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    // Get response data
    const data = await response.json();
    
    // Return the data
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
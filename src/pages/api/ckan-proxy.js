// pages/api/ckan-proxy.js
import { json } from 'body-parser';

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

  // Parse body if it's a POST request and not already parsed
  if (req.method === 'POST' && !req.body) {
    await new Promise((resolve) => {
      json()(req, res, resolve);
    });
  }

  try {
    // Get the API action from the path parameter
    const { action } = req.query;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        error: "Missing 'action' parameter"
      });
    }
    
    // Construct the CKAN URL
    const ckanUrl = `http://147.50.228.205/api/3/action/${action}`;
    
    // Get the request body from the client or query params
    let requestBody = {};
    
    if (req.method === 'POST' && req.body) {
      requestBody = req.body;
    } else if (Object.keys(req.query).length > 1) {
      // Copy query params to request body (except 'action')
      const { action, ...params } = req.query;
      requestBody = params;
    }
    
    console.log(`CKAN Proxy: ${action}`, requestBody);
    
    // Make the POST request to the CKAN server
    const response = await fetch(ckanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    
    // Return the data with the same status code
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
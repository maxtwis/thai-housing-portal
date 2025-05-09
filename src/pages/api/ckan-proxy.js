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
    
    // CKAN base URL - use environment variable if available
    const CKAN_BASE_URL = process.env.CKAN_BASE_URL || 'http://147.50.228.205';
    
    // Construct the CKAN API URL
    let ckanUrl = `${CKAN_BASE_URL}/api/3/action/${action}`;
    
    // Handle different HTTP methods
    if (req.method === 'GET') {
      // Copy all query parameters except 'action'
      const { action: _, ...queryParams } = req.query;
      
      // Add query parameters to URL if present
      if (Object.keys(queryParams).length > 0) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(queryParams)) {
          searchParams.append(key, value);
        }
        ckanUrl += `?${searchParams.toString()}`;
      }
      
      console.log(`CKAN Proxy: GET ${ckanUrl}`);
      
      // Set up timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout
      
      try {
        // Make GET request to CKAN
        const response = await fetch(ckanUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        console.log(`CKAN Response: ${response.status} ${response.statusText}`);
        
        // Check if response is OK
        if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (textError) {
            errorText = 'Could not read error response';
          }
          
          return res.status(response.status).json({
            success: false,
            error: `CKAN Error: ${response.status} ${response.statusText}`,
            details: errorText.substring(0, 200)
          });
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          let responseText = '';
          try {
            responseText = await response.text();
          } catch (textError) {
            responseText = 'Could not read response';
          }
          
          console.error(`Non-JSON response: ${contentType}`, responseText.substring(0, 200));
          
          return res.status(500).json({
            success: false,
            error: `CKAN returned non-JSON response: ${contentType}`,
            details: responseText.substring(0, 200)
          });
        }
        
        // Get the response as JSON
        const data = await response.json();
        
        // Return data to client
        return res.status(200).json(data);
      } catch (fetchError) {
        // Check for timeout
        if (fetchError.name === 'AbortError') {
          return res.status(504).json({
            success: false,
            error: 'CKAN request timed out after 8 seconds'
          });
        }
        
        throw fetchError;
      }
    } else if (req.method === 'POST') {
      // Handle POST requests
      const params = req.body || {};
      
      console.log(`CKAN Proxy: POST ${ckanUrl}`, JSON.stringify(params).substring(0, 100));
      
      // Set up timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        // Make POST request to CKAN
        const response = await fetch(ckanUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        console.log(`CKAN Response: ${response.status} ${response.statusText}`);
        
        // Check if response is OK
        if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (textError) {
            errorText = 'Could not read error response';
          }
          
          return res.status(response.status).json({
            success: false,
            error: `CKAN Error: ${response.status} ${response.statusText}`,
            details: errorText.substring(0, 200)
          });
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          let responseText = '';
          try {
            responseText = await response.text();
          } catch (textError) {
            responseText = 'Could not read response';
          }
          
          console.error(`Non-JSON response: ${contentType}`, responseText.substring(0, 200));
          
          return res.status(500).json({
            success: false,
            error: `CKAN returned non-JSON response: ${contentType}`,
            details: responseText.substring(0, 200)
          });
        }
        
        // Get the response as JSON
        const data = await response.json();
        
        // Return data to client
        return res.status(200).json(data);
      } catch (fetchError) {
        // Check for timeout
        if (fetchError.name === 'AbortError') {
          return res.status(504).json({
            success: false,
            error: 'CKAN request timed out after 8 seconds'
          });
        }
        
        throw fetchError;
      }
    } else {
      // Method not allowed
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
    }
  } catch (error) {
    console.error('CKAN proxy error:', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch data from CKAN',
      details: error.message
    });
  }
}
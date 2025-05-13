// pages/api/cors-proxy.js
export default async function handler(req, res) {
  // Set CORS headers to allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get the target URL from query parameter
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('Proxying request to:', url);

    // Make the request to the target URL with proper headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; CORS-Proxy/1.0)',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      // Get the response text to see what error message was returned
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      return res.status(response.status).json({ 
        error: `Request failed: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Unexpected content type:', contentType);
      const text = await response.text();
      console.error('Response text:', text.substring(0, 500) + '...');
      
      return res.status(500).json({
        error: 'Unexpected response format',
        contentType,
        preview: text.substring(0, 200)
      });
    }

    // Get the response data
    const data = await response.json();
    
    // Return the data
    res.status(200).json(data);
  } catch (error) {
    console.error('CORS proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed',
      details: error.message,
      stack: error.stack
    });
  }
}
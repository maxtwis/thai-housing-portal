import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// CORS proxy endpoint
app.get('/api/cors-proxy', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('Dev proxy request to:', url);

    // Import fetch dynamically since we're using ES modules
    const fetch = (await import('node-fetch')).default;

    // Make the request to the CKAN API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Dev-CORS-Proxy/1.0)',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
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
    console.error('Dev CORS proxy error:', error);
    res.status(500).json({
      error: 'Proxy request failed',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Development CORS proxy server running on http://localhost:${PORT}`);
});
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/cors-proxy': {
        target: 'http://localhost:3001/api/cors-proxy',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})

// Then create a simple Express server for the proxy (server.js):
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/api/cors-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('Proxying request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; CORS-Proxy/1.0)',
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

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('CORS proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed',
      details: error.message
    });
  }
});

app.listen(3001, () => {
  console.log('CORS proxy server running on port 3001');
});
import React, { useState, useEffect } from 'react';
import { getCkanData, testConnection } from '../utils/ckanClient';

const CKANTest = () => {
  const [testResults, setTestResults] = useState('');
  const [loading, setLoading] = useState(false);
  
  const runTest = async () => {
    setLoading(true);
    setTestResults('Starting tests...\n');
    
    try {
      // Test 1: Basic connection
      setTestResults(prev => prev + '1. Testing basic connection...\n');
      const isConnected = await testConnection();
      setTestResults(prev => prev + `   Result: ${isConnected ? 'SUCCESS' : 'FAILED'}\n\n`);
      
      // Test 2: Direct CKAN API call (without proxy)
      setTestResults(prev => prev + '2. Testing direct CKAN API call...\n');
      try {
        const directResponse = await fetch('http://147.50.228.205/api/3/action/datastore_search?resource_id=15132377-edb0-40b0-9aad-8fd9f6769b92&limit=1');
        setTestResults(prev => prev + `   Direct API Status: ${directResponse.status}\n`);
        setTestResults(prev => prev + `   Direct API Headers: ${JSON.stringify(Object.fromEntries(directResponse.headers))}\n`);
      } catch (error) {
        setTestResults(prev => prev + `   Direct API Error: ${error.message}\n`);
      }
      
      // Test 3: Test proxy endpoint
      setTestResults(prev => prev + '\n3. Testing proxy endpoint...\n');
      try {
        const testUrl = 'http://147.50.228.205/api/3/action/datastore_search?resource_id=15132377-edb0-40b0-9aad-8fd9f6769b92&limit=1';
        const proxyUrl = `/api/cors-proxy?url=${encodeURIComponent(testUrl)}`;
        
        console.log(`Proxy URL: ${proxyUrl}`);
        
        const proxyResponse = await fetch(proxyUrl);
        setTestResults(prev => prev + `   Proxy Status: ${proxyResponse.status}\n`);
        const proxyData = await proxyResponse.text();
        setTestResults(prev => prev + `   Proxy Response (first 200 chars): ${proxyData.substring(0, 200)}...\n`);
      } catch (error) {
        setTestResults(prev => prev + `   Proxy Error: ${error.message}\n`);
      }
      
      // Test 4: Test housing supply data
      setTestResults(prev => prev + '\n4. Testing housing supply data for Bangkok...\n');
      try {
        const data = await getCkanData('15132377-edb0-40b0-9aad-8fd9f6769b92', {
          filters: JSON.stringify({ geo_id: 10 }),
          limit: 5
        });
        setTestResults(prev => prev + `   Success! Got ${data.records?.length || 0} records\n`);
        setTestResults(prev => prev + `   Sample record: ${JSON.stringify(data.records?.[0] || {})}\n`);
      } catch (error) {
        setTestResults(prev => prev + `   Error: ${error.message}\n`);
      }
      
    } catch (error) {
      setTestResults(prev => prev + `\nGeneral error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">CKAN API Test</h1>
      
      <button 
        onClick={runTest}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Run CKAN Tests'}
      </button>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Test Results:</h3>
        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap">
          {testResults || 'No tests run yet.'}
        </pre>
      </div>
      
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800">Troubleshooting Steps:</h4>
        <ol className="list-decimal list-inside mt-2 text-sm text-gray-700">
          <li>Check if the CKAN API server is accessible</li>
          <li>Verify the resource ID exists in CKAN</li>
          <li>Ensure the CORS proxy is properly configured</li>
          <li>Check if authentication is required for the CKAN API</li>
          <li>Verify the CKAN API is returning JSON responses</li>
        </ol>
      </div>
    </div>
  );
};

export default CKANTest;
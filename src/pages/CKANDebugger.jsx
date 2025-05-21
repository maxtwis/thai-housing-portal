import React, { useState } from 'react';
import { getCkanData } from '../utils/ckanClient';

const CKANDebugger = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testCKAN = async () => {
    setLoading(true);
    setResult('Starting test...\n');

    try {
      // Test 1: Raw fetch to proxy
      setResult(prev => prev + '\n=== Test 1: Testing proxy directly ===\n');
      const testUrl = 'http://147.50.228.205/api/3/action/datastore_search?resource_id=15132377-edb0-40b0-9aad-8fd9f6769b92&limit=1';
      const proxyUrl = `/api/cors-proxy?url=${encodeURIComponent(testUrl)}`;
      
      setResult(prev => prev + `Proxy URL: ${proxyUrl}\n`);
      
      const proxyResponse = await fetch(proxyUrl);
      setResult(prev => prev + `Proxy status: ${proxyResponse.status}\n`);
      setResult(prev => prev + `Proxy headers: ${JSON.stringify(Object.fromEntries(proxyResponse.headers))}\n`);
      
      if (proxyResponse.ok) {
        const proxyText = await proxyResponse.text();
        setResult(prev => prev + `Proxy response length: ${proxyText.length}\n`);
        setResult(prev => prev + `First 100 chars: ${proxyText.substring(0, 100)}\n`);
        
        try {
          const proxyJson = JSON.parse(proxyText);
          setResult(prev => prev + `Proxy JSON success: ${proxyJson.success}\n`);
          setResult(prev => prev + `Records count: ${proxyJson.result?.records?.length || 0}\n`);
        } catch (e) {
          setResult(prev => prev + `JSON parse error: ${e.message}\n`);
          setResult(prev => prev + `Response type seems to be: ${proxyText.startsWith('<!DOCTYPE') ? 'HTML' : 'Unknown'}\n`);
        }
      } else {
        const errorText = await proxyResponse.text();
        setResult(prev => prev + `Proxy error: ${errorText}\n`);
      }

      // Test 2: Using getCkanData function
      setResult(prev => prev + '\n=== Test 2: Testing getCkanData function ===\n');
      try {
        const ckanResult = await getCkanData('15132377-edb0-40b0-9aad-8fd9f6769b92', { limit: 1 });
        setResult(prev => prev + `getCkanData success!\n`);
        setResult(prev => prev + `Records: ${ckanResult.records?.length || 0}\n`);
        setResult(prev => prev + `Total: ${ckanResult.total || 0}\n`);
      } catch (ckanError) {
        setResult(prev => prev + `getCkanData error: ${ckanError.message}\n`);
        setResult(prev => prev + `Error stack: ${ckanError.stack}\n`);
      }

      // Test 3: Test with filters (like HousingSupplyChart does)
      setResult(prev => prev + '\n=== Test 3: Testing with filters (geo_id=10) ===\n');
      try {
        const filteredResult = await getCkanData('15132377-edb0-40b0-9aad-8fd9f6769b92', {
          filters: JSON.stringify({ geo_id: 10 }),
          limit: 5
        });
        setResult(prev => prev + `Filtered data success!\n`);
        setResult(prev => prev + `Records: ${filteredResult.records?.length || 0}\n`);
        setResult(prev => prev + `Sample record: ${JSON.stringify(filteredResult.records?.[0] || {})}\n`);
      } catch (filterError) {
        setResult(prev => prev + `Filtered data error: ${filterError.message}\n`);
      }

    } catch (error) {
      setResult(prev => prev + `\nUnexpected error: ${error.message}\n`);
      setResult(prev => prev + `Error stack: ${error.stack}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">CKAN Connection Debugger</h2>
      
      <button 
        onClick={testCKAN}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Test CKAN Connection'}
      </button>
      
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap max-h-96">
          {result || 'No tests run yet.'}
        </pre>
      </div>
      
      <div className="mt-4 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800">Expected behavior:</h4>
        <ul className="list-disc list-inside text-sm mt-2 text-blue-700">
          <li>All tests should return valid JSON responses</li>
          <li>Test 2 should not throw errors</li>
          <li>Test 3 should return records with geo_id=10</li>
          <li>If any test returns HTML, there's a server-side issue</li>
        </ul>
      </div>
    </div>
  );
};

export default CKANDebugger;
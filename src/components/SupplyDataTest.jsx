// components/SupplyDataTest.jsx - Debug component
import React from 'react';
import { useSupplyResourceTest, useSupplyData, useSupplyDataDirect } from '../hooks/useSupplyData';

const SupplyDataTest = () => {
  const { data: testData, isLoading: testLoading, error: testError } = useSupplyResourceTest();
  const { data: supplyData, isLoading: supplyLoading, error: supplyError } = useSupplyData();
  const { data: directData, isLoading: directLoading, error: directError, refetch: refetchDirect } = useSupplyDataDirect();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Supply Data Debug Panel</h1>
      
      {/* Resource Test */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">1. Resource Metadata Test</h2>
        {testLoading && <p className="text-blue-600">Loading resource test...</p>}
        {testError && (
          <div className="bg-red-50 p-3 rounded">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-600 text-sm">{testError.message}</p>
          </div>
        )}
        {testData && (
          <div className="bg-green-50 p-3 rounded">
            <p className="text-green-800 font-medium">✅ Resource Test Successful</p>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Supply Data Test */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">2. Supply Data Fetch Test</h2>
        {supplyLoading && <p className="text-blue-600">Loading supply data...</p>}
        {supplyError && (
          <div className="bg-red-50 p-3 rounded">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-600 text-sm">{supplyError.message}</p>
          </div>
        )}
        {supplyData && (
          <div className="bg-green-50 p-3 rounded">
            <p className="text-green-800 font-medium">✅ Supply Data Loaded</p>
            <p className="text-sm mt-1">Grids with data: {Object.keys(supplyData).length}</p>
            {Object.keys(supplyData).length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Sample Grid Data:</p>
                <pre className="text-xs mt-1 overflow-auto max-h-40">
                  {JSON.stringify(Object.values(supplyData)[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Direct URL Test */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">3. Direct URL Test</h2>
        <button 
          onClick={() => refetchDirect()}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-3"
          disabled={directLoading}
        >
          {directLoading ? 'Testing...' : 'Test Direct URL'}
        </button>
        
        {directError && (
          <div className="bg-red-50 p-3 rounded">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-600 text-sm">{directError.message}</p>
          </div>
        )}
        {directData && (
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-blue-800 font-medium">Direct Response:</p>
            <pre className="text-xs mt-2 overflow-auto max-h-40">
              {JSON.stringify(directData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Manual Test URLs */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">4. Manual Test URLs</h2>
        <div className="space-y-2 text-sm">
          <div>
            <p className="font-medium">Resource ID:</p>
            <code className="bg-gray-100 p-1 rounded">9cfc5468-36f6-40d3-b76e-febf79e9ca9f</code>
          </div>
          <div>
            <p className="font-medium">Direct CKAN URL:</p>
            <code className="bg-gray-100 p-1 rounded break-all">
              http://147.50.228.205/api/3/action/datastore_search?resource_id=9cfc5468-36f6-40d3-b76e-febf79e9ca9f&limit=5
            </code>
          </div>
          <div>
            <p className="font-medium">Metadata URL:</p>
            <code className="bg-gray-100 p-1 rounded break-all">
              http://147.50.228.205/api/3/action/datastore_search?resource_id=9cfc5468-36f6-40d3-b76e-febf79e9ca9f&limit=0
            </code>
          </div>
        </div>
      </div>

      {/* Troubleshooting Steps */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h2 className="text-lg font-semibold mb-3 text-yellow-800">Troubleshooting Steps</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
          <li>Check if the resource ID <code>9cfc5468-36f6-40d3-b76e-febf79e9ca9f</code> exists in your CKAN instance</li>
          <li>Verify the resource is publicly accessible (no authentication required)</li>
          <li>Test the direct CKAN URL in a browser or API client</li>
          <li>Check if the resource has been moved, renamed, or deleted</li>
          <li>Verify the CKAN server is running and accessible</li>
          <li>Check if there are any API rate limits or restrictions</li>
        </ol>
      </div>
    </div>
  );
};

export default SupplyDataTest;
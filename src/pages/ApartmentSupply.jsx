import React, { useState, useEffect } from 'react';

const ApartmentSupply = () => {
  const [apartmentData, setApartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setDebugInfo('Starting data load...');
        
        // Check if getCkanData exists
        setDebugInfo('Checking getCkanData import...');
        
        let getCkanData;
        try {
          const ckanModule = await import('../utils/ckanClient');
          getCkanData = ckanModule.getCkanData;
          setDebugInfo('getCkanData imported successfully');
        } catch (importError) {
          throw new Error(`Failed to import getCkanData: ${importError.message}`);
        }

        if (!getCkanData) {
          throw new Error('getCkanData function not found in ckanClient');
        }

        setDebugInfo('Calling CKAN API...');
        
        // Make API call with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API call timed out after 30 seconds')), 30000)
        );
        
        const apiPromise = getCkanData('b6dbb8e0-1194-4eeb-945d-e883b3275b35', {
          limit: 100 // Start with smaller limit
        });
        
        const result = await Promise.race([apiPromise, timeoutPromise]);
        
        setDebugInfo(`API call completed. Response type: ${typeof result}`);
        
        if (!mounted) return;
        
        if (!result) {
          throw new Error('No response from CKAN API');
        }
        
        if (!result.records) {
          throw new Error(`Invalid API response structure: ${JSON.stringify(result).slice(0, 200)}...`);
        }
        
        setDebugInfo(`Processing ${result.records.length} records...`);
        
        // Process data safely
        const processedData = result.records.map((record, index) => {
          try {
            return {
              apartment_id: record.apartment_id || index,
              apartment_name: record.apartment_name || `Apartment ${record.apartment_id || index}`,
              room_type: record.room_type || 'Unknown',
              size_min: parseFloat(record.size_min) || 0,
              size_max: parseFloat(record.size_max) || 0,
              price_min: parseFloat(record.price_min) || 0,
              price_max: parseFloat(record.price_max) || 0,
              address: record.address || 'Address not available',
              latitude: parseFloat(record.latitude) || null,
              longitude: parseFloat(record.longitude) || null,
              // Safe facility parsing
              facility_wifi: parseInt(record.facility_wifi) || 0,
              facility_parking: parseInt(record.facility_parking) || 0,
              facility_pool: parseInt(record.facility_pool) || 0,
              facility_gym: parseInt(record.facility_gym) || 0,
              facility_security: parseInt(record.facility_security) || 0,
              facility_aircondition: parseInt(record.facility_aircondition) || 0
            };
          } catch (recordError) {
            console.warn(`Error processing record ${index}:`, recordError);
            return null;
          }
        }).filter(Boolean); // Remove null records
        
        if (!mounted) return;
        
        setDebugInfo(`Successfully processed ${processedData.length} valid records`);
        setApartmentData(processedData);
        setLoading(false);
        
      } catch (err) {
        console.error('Error in loadData:', err);
        if (!mounted) return;
        
        setError(err.message || 'Unknown error occurred');
        setDebugInfo(`Error: ${err.message}`);
        setLoading(false);
      }
    };

    // Add delay to prevent rapid re-renders
    const timer = setTimeout(loadData, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Error boundary fallback
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Apartment Supply - Error</h1>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-red-700">Error Details:</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-red-700">Debug Info:</h3>
                <p className="text-red-600 text-sm mt-1">{debugInfo}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-red-700">Possible Solutions:</h3>
                <ul className="text-red-600 text-sm mt-1 list-disc list-inside space-y-1">
                  <li>Check if CKAN server is running and accessible</li>
                  <li>Verify the resource ID: b6dbb8e0-1194-4eeb-945d-e883b3275b35</li>
                  <li>Check network connectivity</li>
                  <li>Verify getCkanData function in utils/ckanClient.js</li>
                  <li>Check browser console for additional errors</li>
                </ul>
              </div>
              
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Apartment Supply Analysis</h1>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 text-lg mb-2">Loading apartment data...</p>
              <p className="text-gray-500 text-sm">{debugInfo}</p>
              
              {/* Timeout warning */}
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>If this takes more than 30 seconds, there might be an issue with:</p>
                <ul className="mt-2 text-xs">
                  <li>• CKAN API server connectivity</li>
                  <li>• Network connection</li>
                  <li>• Resource availability</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Apartment Supply Analysis</h1>
        
        {/* Success message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-green-800 font-medium">
                Successfully loaded {apartmentData.length} apartments from CKAN API
              </p>
              <p className="text-green-700 text-sm">Resource ID: b6dbb8e0-1194-4eeb-945d-e883b3275b35</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Apartments</h3>
            <p className="text-3xl font-bold text-blue-600">{apartmentData.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700">Room Types</h3>
            <p className="text-3xl font-bold text-green-600">
              {[...new Set(apartmentData.map(apt => apt.room_type))].length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700">With Coordinates</h3>
            <p className="text-3xl font-bold text-purple-600">
              {apartmentData.filter(apt => apt.latitude && apt.longitude).length}
            </p>
          </div>
        </div>

        {/* Sample Data Display */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sample Apartments</h2>
          
          {apartmentData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No apartment data available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apartmentData.slice(0, 6).map((apartment) => (
                <div 
                  key={apartment.apartment_id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {apartment.apartment_name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Type:</strong> {apartment.room_type}</p>
                    <p><strong>Size:</strong> {apartment.size_min} - {apartment.size_max} sqm</p>
                    <p><strong>Price:</strong> ฿{apartment.price_min?.toLocaleString()} - ฿{apartment.price_max?.toLocaleString()}</p>
                    {apartment.latitude && apartment.longitude && (
                      <p><strong>Location:</strong> {apartment.latitude.toFixed(4)}, {apartment.longitude.toFixed(4)}</p>
                    )}
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {apartment.facility_wifi > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">WiFi</span>
                    )}
                    {apartment.facility_parking > 0 && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Parking</span>
                    )}
                    {apartment.facility_pool > 0 && (
                      <span className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded">Pool</span>
                    )}
                    {apartment.facility_gym > 0 && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Gym</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {apartmentData.length > 6 && (
            <div className="mt-6 text-center text-gray-500">
              Showing first 6 of {apartmentData.length} apartments
            </div>
          )}
        </div>

        {/* Debug Information */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Debug Information</h3>
          <p className="text-sm text-gray-600">Last Status: {debugInfo}</p>
          <p className="text-sm text-gray-600">Data loaded at: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ApartmentSupply;
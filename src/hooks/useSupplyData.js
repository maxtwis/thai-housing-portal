// hooks/useSupplyData.js - Debugged version
import { useQuery } from '@tanstack/react-query';
import { getCkanData, getResourceMetadata } from '../utils/ckanClient';

// Supply data resource ID
const SUPPLY_RESOURCE_ID = '9cfc5468-36f6-40d3-b76e-febf79e9ca9f';

/**
 * Hook to test and debug the supply resource first
 */
export const useSupplyResourceTest = () => {
  return useQuery({
    queryKey: ['supply-resource-test'],
    queryFn: async () => {
      console.log('Testing supply resource metadata...');
      
      try {
        // First test - get metadata with limit 0
        const metadata = await getResourceMetadata(SUPPLY_RESOURCE_ID);
        console.log('Supply resource metadata:', metadata);
        
        // Second test - try to get just 1 record
        const testResult = await getCkanData(SUPPLY_RESOURCE_ID, { 
          limit: 1 
        });
        console.log('Supply resource test result:', testResult);
        
        return {
          metadata,
          testResult,
          status: 'success'
        };
      } catch (error) {
        console.error('Supply resource test failed:', error);
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    cacheTime: 60 * 60 * 1000,
  });
};

/**
 * Hook to fetch supply data with better error handling and debugging
 */
export const useSupplyData = (provinceCode = null) => {
  return useQuery({
    queryKey: ['supply-data', provinceCode],
    queryFn: async () => {
      console.log(`Fetching supply data for province code: ${provinceCode}`);
      console.log(`Using resource ID: ${SUPPLY_RESOURCE_ID}`);
      
      try {
        // Start with a small request to test the resource
        console.log('Step 1: Testing with small limit...');
        const testResult = await getCkanData(SUPPLY_RESOURCE_ID, {
          limit: 5
        });
        
        console.log('Test result:', testResult);
        
        if (!testResult || !testResult.records) {
          throw new Error('Test request failed - no records returned');
        }
        
        console.log('Step 2: Sample record structure:', testResult.records[0]);
        
        // If test passes, try larger request
        console.log('Step 3: Fetching full data...');
        const result = await getCkanData(SUPPLY_RESOURCE_ID, {
          limit: 10000, // Reduced limit for testing
          sort: 'OBJECTID asc'
        });
        
        if (!result || !result.records) {
          throw new Error('No supply data received from CKAN API');
        }
        
        console.log(`Received ${result.records.length} supply records`);
        console.log('First record fields:', Object.keys(result.records[0] || {}));
        
        // Process and group data by OBJECTID (grid id)
        const groupedData = {};
        
        result.records.forEach((record, index) => {
          // Log first few records for debugging
          if (index < 3) {
            console.log(`Record ${index}:`, record);
          }
          
          const objectId = record.OBJECTID;
          if (!objectId) {
            console.warn('Record missing OBJECTID:', record);
            return;
          }
          
          if (!groupedData[objectId]) {
            groupedData[objectId] = {
              gridId: objectId,
              housingTypes: {},
              totalSupply: 0,
              averageSalePrice: 0,
              averageRentPrice: 0,
              salePrices: [],
              rentPrices: []
            };
          }
          
          const houseType = record.House_type || 'ไม่ระบุ';
          const supplyCount = parseInt(record.supply_count) || 0;
          const salePrice = parseFloat(record.supply_sale_price) || null;
          const rentPrice = parseFloat(record.supply_rent_price) || null;
          
          // Store housing type data
          groupedData[objectId].housingTypes[houseType] = {
            supplyCount,
            salePrice,
            rentPrice
          };
          
          // Update totals
          groupedData[objectId].totalSupply += supplyCount;
          
          // Collect prices for average calculation
          if (salePrice && salePrice > 0) {
            groupedData[objectId].salePrices.push(salePrice);
          }
          if (rentPrice && rentPrice > 0) {
            groupedData[objectId].rentPrices.push(rentPrice);
          }
        });
        
        // Calculate averages
        Object.values(groupedData).forEach(gridData => {
          if (gridData.salePrices.length > 0) {
            gridData.averageSalePrice = gridData.salePrices.reduce((sum, price) => sum + price, 0) / gridData.salePrices.length;
          }
          if (gridData.rentPrices.length > 0) {
            gridData.averageRentPrice = gridData.rentPrices.reduce((sum, price) => sum + price, 0) / gridData.rentPrices.length;
          }
        });
        
        console.log(`Processed supply data for ${Object.keys(groupedData).length} grids`);
        console.log('Sample processed data:', Object.values(groupedData)[0]);
        
        return groupedData;
        
      } catch (error) {
        console.error('Detailed error in useSupplyData:', error);
        console.error('Error stack:', error.stack);
        
        // Return empty data instead of throwing to prevent app crash
        console.warn('Returning empty supply data due to error');
        return {};
      }
    },
    enabled: true,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    retry: 1, // Only retry once
    retryDelay: 3000,
  });
};

/**
 * Alternative hook using direct URL test (for debugging)
 */
export const useSupplyDataDirect = () => {
  return useQuery({
    queryKey: ['supply-data-direct'],
    queryFn: async () => {
      console.log('Testing direct CKAN URL...');
      
      const directUrl = `http://147.50.228.205/api/3/action/datastore_search?resource_id=${SUPPLY_RESOURCE_ID}&limit=5`;
      console.log('Direct URL:', directUrl);
      
      // Test if the resource exists with curl-like approach
      try {
        const proxyUrl = `/api/cors-proxy?url=${encodeURIComponent(directUrl)}`;
        console.log('Proxy URL:', proxyUrl);
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        console.log('Direct response status:', response.status);
        console.log('Direct response data:', data);
        
        return data;
      } catch (error) {
        console.error('Direct test failed:', error);
        throw error;
      }
    },
    enabled: false, // Don't run automatically
    staleTime: Infinity,
  });
};

/**
 * Hook to get supply data for a specific grid
 */
export const useGridSupplyData = (objectId, allSupplyData) => {
  if (!allSupplyData || !objectId) {
    return null;
  }
  
  return allSupplyData[objectId] || null;
};
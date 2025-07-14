// hooks/useSupplyData.js - Simple fix version
import { useQuery } from '@tanstack/react-query';
import { getCkanData } from '../utils/ckanClient';

// Try using the working housing supply resource ID first for testing
const WORKING_RESOURCE_ID = '15132377-edb0-40b0-9aad-8fd9f6769b92'; // This one works
const SUPPLY_RESOURCE_ID = '9cfc5468-36f6-40d3-b76e-febf79e9ca9f'; // Original that's failing

/**
 * Hook to fetch supply data with province filtering
 */
export const useSupplyData = (provinceCode = null) => {
  return useQuery({
    queryKey: ['supply-data', provinceCode],
    queryFn: async () => {
      console.log('Trying to fetch supply data for province:', provinceCode);
      
      // First, test if the original resource ID works with a small request
      try {
        console.log('Testing original resource ID:', SUPPLY_RESOURCE_ID);
        const testResult = await getCkanData(SUPPLY_RESOURCE_ID, { limit: 1 });
        console.log('Original resource test successful:', testResult);
        
        // If it works, proceed with the full request
        const result = await getCkanData(SUPPLY_RESOURCE_ID, {
          limit: 1000,
          sort: 'OBJECTID asc'
        });
        
        // Filter by province if needed - สงขลา is province 90
        let filteredRecords = result.records || [];
        
        // Only show supply data for สงขลา province (ID 90)
        if (provinceCode && provinceCode !== 90) {
          console.log(`Province ${provinceCode} is not สงขลา (90), returning empty supply data`);
          return {};
        }
        
        return processSupplyData(filteredRecords);
        
      } catch (originalError) {
        console.warn('Original resource failed:', originalError.message);
        
        // Fallback: Try to see what data structure the working resource has
        try {
          console.log('Testing working resource for data structure:', WORKING_RESOURCE_ID);
          const workingResult = await getCkanData(WORKING_RESOURCE_ID, { limit: 5 });
          console.log('Working resource sample data:', workingResult);
          
          // Check if this resource has supply-like data
          if (workingResult.records && workingResult.records.length > 0) {
            console.log('Available fields in working resource:', Object.keys(workingResult.records[0]));
            
            // If the working resource doesn't have supply data, return empty for now
            console.warn('Using empty supply data - please verify correct resource ID');
            return {};
          }
          
        } catch (fallbackError) {
          console.error('Fallback resource also failed:', fallbackError.message);
        }
        
        // Return empty data to prevent app crash
        console.warn('Returning empty supply data due to API issues');
        return {};
      }
    },
    enabled: true,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    retry: false, // Don't retry failed requests
    onError: (error) => {
      console.error('Supply data query failed:', error);
    }
  });
};

/**
 * Process supply data into the expected format
 */
function processSupplyData(records) {
  if (!records || records.length === 0) {
    console.log('No supply records to process');
    return {};
  }
  
  console.log('Processing', records.length, 'supply records');
  console.log('Sample record:', records[0]);
  
  const groupedData = {};
  
  records.forEach((record, index) => {
    // Log first few records for debugging
    if (index < 3) {
      console.log(`Record ${index}:`, record);
    }
    
    // Try different possible field names for OBJECTID
    const objectId = record.OBJECTID || record.objectid || record.ObjectId || record.grid_id || record.id;
    
    if (!objectId) {
      if (index < 5) { // Only log first few warnings
        console.warn('Record missing OBJECTID-like field:', record);
      }
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
    
    // Try different possible field names
    const houseType = record.House_type || record.house_type || record.housing_type || 'ไม่ระบุ';
    const supplyCount = parseInt(record.supply_count || record.count || record.units || 0);
    const salePrice = parseFloat(record.supply_sale_price || record.sale_price || record.price || 0) || null;
    const rentPrice = parseFloat(record.supply_rent_price || record.rent_price || record.rental || 0) || null;
    
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
  if (Object.keys(groupedData).length > 0) {
    console.log('Sample processed data:', Object.values(groupedData)[0]);
  }
  
  return groupedData;
}

/**
 * Hook to get supply data for a specific grid
 */
export const useGridSupplyData = (objectId, allSupplyData) => {
  if (!allSupplyData || !objectId) {
    return null;
  }
  
  return allSupplyData[objectId] || null;
};

/**
 * Test function to check available resources
 */
export const testSupplyResources = async () => {
  const resourcesToTest = [
    '9cfc5468-36f6-40d3-b76e-febf79e9ca9f', // Original supply resource
    '15132377-edb0-40b0-9aad-8fd9f6769b92', // Working housing resource
    'e8f46829-8255-4b9a-8dc9-d540d035a842', // Population data
    '32386aff-314a-4f04-9957-0477882961e6', // Household data
  ];
  
  for (const resourceId of resourcesToTest) {
    try {
      console.log(`Testing resource: ${resourceId}`);
      const result = await getCkanData(resourceId, { limit: 1 });
      console.log(`✅ Resource ${resourceId} works:`, result.records?.[0]);
    } catch (error) {
      console.log(`❌ Resource ${resourceId} failed:`, error.message);
    }
  }
};
// hooks/useSupplyData.js
import { useQuery } from '@tanstack/react-query';
import { getCkanData } from '../utils/ckanClient';

// Supply data resource ID
const SUPPLY_RESOURCE_ID = '9cfc5468-36f6-40d3-b76e-febf79e9ca9f';

/**
 * Hook to fetch supply data for a specific province
 * Returns aggregated supply data by OBJECTID (grid id)
 */
export const useSupplyData = (provinceCode = null) => {
  return useQuery({
    queryKey: ['supply-data', provinceCode],
    queryFn: async () => {
      console.log(`Fetching supply data for province code: ${provinceCode}`);
      
      // Build API filters if provinceCode is provided
      const apiFilters = {};
      if (provinceCode) {
        // Add province filter if your data has a province field
        // apiFilters.province_code = provinceCode;
      }
      
      const result = await getCkanData(SUPPLY_RESOURCE_ID, {
        filters: Object.keys(apiFilters).length > 0 ? JSON.stringify(apiFilters) : undefined,
        limit: 50000, // High limit to get all data
        sort: 'OBJECTID asc'
      });
      
      if (!result || !result.records) {
        throw new Error('No supply data received from CKAN API');
      }
      
      console.log(`Received ${result.records.length} supply records`);
      
      // Process and group data by OBJECTID (grid id)
      const groupedData = {};
      
      result.records.forEach(record => {
        const objectId = record.OBJECTID;
        if (!objectId) return;
        
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
      
      return groupedData;
    },
    enabled: true, // Always fetch since we want all supply data
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    cacheTime: 15 * 60 * 1000,
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
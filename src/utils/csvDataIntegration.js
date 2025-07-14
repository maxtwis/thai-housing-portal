// utils/csvDataIntegration.js
import { getCkanData, ckanSqlQuery } from './ckanClient';
import { useQuery } from '@tanstack/react-query';

// Songkhla Housing Supply Resource ID (from your existing code)
const SONGKHLA_HOUSING_SUPPLY_RESOURCE_ID = '9cfc5468-36f6-40d3-b76e-febf79e9ca9f';

/**
 * Housing Supply Data Manager - follows your existing patterns
 */
export class HousingSupplyDataManager {
  constructor(resourceId = SONGKHLA_HOUSING_SUPPLY_RESOURCE_ID) {
    this.resourceId = resourceId;
    this.cachedData = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes - same as your existing queries
  }

  /**
   * Get housing supply data for Songkhla province (id: 90)
   * Uses your existing getCkanData function with multiple fallback strategies
   */
  async getHousingSupplyData(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached data if available and not expired
    if (!forceRefresh && 
        this.cachedData && 
        this.lastFetch && 
        (now - this.lastFetch) < this.cacheTimeout) {
      return this.cachedData;
    }

    try {
      console.log('Fetching housing supply data from CKAN...');
      
      let result = null;
      
      // Strategy 1: Try with no filters first (get all data)
      try {
        console.log('Trying strategy 1: No filters');
        result = await getCkanData(this.resourceId, {
          limit: 10000,
          sort: 'OBJECTID asc'
        });
        console.log('Strategy 1 successful:', result?.records?.length || 0, 'records');
      } catch (error) {
        console.log('Strategy 1 failed:', error.message);
      }
      
      // Strategy 2: Try with geo_id filter (most common in your system)
      if (!result || !result.records) {
        try {
          console.log('Trying strategy 2: geo_id filter');
          result = await getCkanData(this.resourceId, {
            filters: JSON.stringify({ geo_id: 90 }),
            limit: 10000,
            sort: 'OBJECTID asc'
          });
          console.log('Strategy 2 successful:', result?.records?.length || 0, 'records');
        } catch (error) {
          console.log('Strategy 2 failed:', error.message);
        }
      }
      
      // Strategy 3: Try with province_id filter
      if (!result || !result.records) {
        try {
          console.log('Trying strategy 3: province_id filter');
          result = await getCkanData(this.resourceId, {
            filters: JSON.stringify({ province_id: 90 }),
            limit: 10000,
            sort: 'OBJECTID asc'
          });
          console.log('Strategy 3 successful:', result?.records?.length || 0, 'records');
        } catch (error) {
          console.log('Strategy 3 failed:', error.message);
        }
      }
      
      // Strategy 4: Try with province_code filter
      if (!result || !result.records) {
        try {
          console.log('Trying strategy 4: province_code filter');
          result = await getCkanData(this.resourceId, {
            filters: JSON.stringify({ province_code: 90 }),
            limit: 10000,
            sort: 'OBJECTID asc'
          });
          console.log('Strategy 4 successful:', result?.records?.length || 0, 'records');
        } catch (error) {
          console.log('Strategy 4 failed:', error.message);
        }
      }
      
      if (!result || !result.records) {
        throw new Error('All filter strategies failed. Resource might not exist or have different field structure.');
      }
      
      // Log sample record to understand structure
      if (result.records.length > 0) {
        console.log('Sample record structure:', Object.keys(result.records[0]));
        console.log('First record:', result.records[0]);
      }
      
      // Process and clean the data
      const processedData = this.processHousingData(result.records);
      
      // Cache the results
      this.cachedData = processedData;
      this.lastFetch = now;
      
      console.log('Housing supply data processed:', processedData.length, 'records');
      return processedData;
    } catch (error) {
      console.error('Error fetching housing supply data:', error);
      // Return empty array on error, but preserve cache if available
      return this.cachedData || [];
    }
  }

  /**
   * Process raw housing data - similar to your existing data processing patterns
   */
  processHousingData(rawData) {
    if (!rawData || !Array.isArray(rawData)) {
      console.warn('Invalid rawData provided to processHousingData');
      return [];
    }

    return rawData.map(record => {
      // Try different possible field names for OBJECTID
      const objectId = parseInt(record.OBJECTID) || 
                      parseInt(record.objectid) || 
                      parseInt(record.grid_id) || 
                      parseInt(record.Grid_ID) || 
                      parseInt(record.id) || 
                      null;

      // Try different possible field names for house type
      const houseType = record.House_type || 
                       record.house_type || 
                       record.HouseType || 
                       record.type || 
                       '';

      // Try different possible field names for supply count
      const supplyCount = parseInt(record.supply_count) || 
                         parseInt(record.Supply_count) || 
                         parseInt(record.count) || 
                         parseInt(record.units) || 
                         0;

      // Try different possible field names for prices
      const supplySalePrice = parseFloat(record.supply_sale_price) || 
                             parseFloat(record.sale_price) || 
                             parseFloat(record.price_sale) || 
                             null;

      const supplyRentPrice = parseFloat(record.supply_rent_price) || 
                             parseFloat(record.rent_price) || 
                             parseFloat(record.price_rent) || 
                             null;

      return {
        objectId,
        houseType,
        supplyCount,
        supplySalePrice,
        supplyRentPrice,
        // Keep original record for debugging
        _raw: record
      };
    }).filter(record => record.objectId !== null && record.supplyCount > 0);
  }

  /**
   * Get aggregated data by grid (OBJECTID) - similar to your grouping patterns
   */
  async getDataByGrid() {
    const data = await this.getHousingSupplyData();
    const gridData = {};

    data.forEach(record => {
      const gridId = record.objectId;
      
      if (!gridData[gridId]) {
        gridData[gridId] = {
          objectId: gridId,
          totalSupply: 0,
          totalSaleValue: 0,
          totalRentValue: 0,
          averageSalePrice: 0,
          averageRentPrice: 0,
          houseTypes: [],
          saleCount: 0,
          rentCount: 0
        };
      }

      const grid = gridData[gridId];
      
      // Add house type data
      grid.houseTypes.push({
        type: record.houseType,
        supply: record.supplyCount,
        salePrice: record.supplySalePrice,
        rentPrice: record.supplyRentPrice
      });

      // Update aggregated values
      grid.totalSupply += record.supplyCount;
      
      if (record.supplySalePrice && record.supplySalePrice > 0) {
        grid.totalSaleValue += record.supplySalePrice * record.supplyCount;
        grid.saleCount += record.supplyCount;
      }
      
      if (record.supplyRentPrice && record.supplyRentPrice > 0) {
        grid.totalRentValue += record.supplyRentPrice * record.supplyCount;
        grid.rentCount += record.supplyCount;
      }
    });

    // Calculate averages
    Object.values(gridData).forEach(grid => {
      if (grid.saleCount > 0) {
        grid.averageSalePrice = grid.totalSaleValue / grid.saleCount;
      }
      if (grid.rentCount > 0) {
        grid.averageRentPrice = grid.totalRentValue / grid.rentCount;
      }
    });

    return gridData;
  }

  /**
   * Get data for a specific grid
   */
  async getGridData(objectId) {
    const gridData = await this.getDataByGrid();
    return gridData[objectId] || null;
  }

  /**
   * Get overall statistics - similar to your existing stats calculations
   */
  async getOverallStats() {
    const data = await this.getHousingSupplyData();
    
    const stats = {
      totalGrids: new Set(data.map(r => r.objectId)).size,
      totalSupply: data.reduce((sum, r) => sum + r.supplyCount, 0),
      totalSaleListings: data.filter(r => r.supplySalePrice > 0).length,
      totalRentListings: data.filter(r => r.supplyRentPrice > 0).length,
      averageSalePrice: 0,
      averageRentPrice: 0,
      houseTypeDistribution: {},
      priceRanges: {
        sale: { min: Infinity, max: 0, median: 0 },
        rent: { min: Infinity, max: 0, median: 0 }
      }
    };

    // Calculate house type distribution
    data.forEach(record => {
      const type = record.houseType;
      if (!stats.houseTypeDistribution[type]) {
        stats.houseTypeDistribution[type] = 0;
      }
      stats.houseTypeDistribution[type] += record.supplyCount;
    });

    // Calculate price statistics
    const salePrices = data.filter(r => r.supplySalePrice > 0).map(r => r.supplySalePrice);
    const rentPrices = data.filter(r => r.supplyRentPrice > 0).map(r => r.supplyRentPrice);

    if (salePrices.length > 0) {
      stats.averageSalePrice = salePrices.reduce((sum, price) => sum + price, 0) / salePrices.length;
      stats.priceRanges.sale.min = Math.min(...salePrices);
      stats.priceRanges.sale.max = Math.max(...salePrices);
      salePrices.sort((a, b) => a - b);
      stats.priceRanges.sale.median = salePrices[Math.floor(salePrices.length / 2)];
    }

    if (rentPrices.length > 0) {
      stats.averageRentPrice = rentPrices.reduce((sum, price) => sum + price, 0) / rentPrices.length;
      stats.priceRanges.rent.min = Math.min(...rentPrices);
      stats.priceRanges.rent.max = Math.max(...rentPrices);
      rentPrices.sort((a, b) => a - b);
      stats.priceRanges.rent.median = rentPrices[Math.floor(rentPrices.length / 2)];
    }

    return stats;
  }
}

/**
 * React Query Hook for Housing Supply Data - follows your existing hook patterns
 */
export const useHousingSupplyByGridData = (provinceId) => {
  const manager = new HousingSupplyDataManager();
  
  return useQuery({
    queryKey: ['housing-supply-by-grid', provinceId],
    queryFn: async () => {
      // Only fetch for Songkhla (province ID 90)
      if (provinceId !== 90) {
        return {};
      }
      return await manager.getDataByGrid();
    },
    enabled: provinceId === 90, // Only enable for Songkhla
    staleTime: 5 * 60 * 1000, // Same as your existing queries
    cacheTime: 10 * 60 * 1000, // Same as your existing queries
    retry: 3, // Retry failed requests
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * React Query Hook for Housing Supply Statistics
 */
export const useHousingSupplyStats = (provinceId) => {
  const manager = new HousingSupplyDataManager();
  
  return useQuery({
    queryKey: ['housing-supply-stats', provinceId],
    queryFn: async () => {
      if (provinceId !== 90) {
        return null;
      }
      return await manager.getOverallStats();
    },
    enabled: provinceId === 90,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * GeoJSON Integration Helper - similar to your existing data processing
 */
export class GeoJSONCSVIntegrator {
  constructor() {
    this.housingDataManager = new HousingSupplyDataManager();
  }

  /**
   * Enrich GeoJSON features with CSV data
   */
  async enrichGeoJSONWithCSVData(geojsonData) {
    try {
      console.log('Enriching GeoJSON with CSV data...');
      const csvGridData = await this.housingDataManager.getDataByGrid();
      
      // Create a deep copy of the GeoJSON
      const enrichedGeoJSON = JSON.parse(JSON.stringify(geojsonData));
      
      let enrichedCount = 0;
      
      // Enrich each feature with CSV data
      enrichedGeoJSON.features.forEach(feature => {
        const objectId = this.getObjectIdFromFeature(feature);
        const csvData = csvGridData[objectId];
        
        if (csvData) {
          enrichedCount++;
          // Add CSV data to properties
          feature.properties = {
            ...feature.properties,
            // Housing supply data
            csv_totalSupply: csvData.totalSupply,
            csv_averageSalePrice: csvData.averageSalePrice,
            csv_averageRentPrice: csvData.averageRentPrice,
            csv_totalSaleValue: csvData.totalSaleValue,
            csv_totalRentValue: csvData.totalRentValue,
            csv_houseTypeCount: csvData.houseTypes.length,
            csv_dominantHouseType: csvData.houseTypes.length > 0 ? 
              csvData.houseTypes.reduce((max, current) => 
                current.supply > max.supply ? current : max
              ).type : null,
            // Detailed house types (as JSON string)
            csv_houseTypes: JSON.stringify(csvData.houseTypes)
          };
        } else {
          // Add null values for grids without CSV data
          feature.properties = {
            ...feature.properties,
            csv_totalSupply: 0,
            csv_averageSalePrice: null,
            csv_averageRentPrice: null,
            csv_totalSaleValue: 0,
            csv_totalRentValue: 0,
            csv_houseTypeCount: 0,
            csv_dominantHouseType: null,
            csv_houseTypes: '[]'
          };
        }
      });
      
      console.log(`Enriched ${enrichedCount} features out of ${enrichedGeoJSON.features.length} total features`);
      return enrichedGeoJSON;
    } catch (error) {
      console.error('Error enriching GeoJSON with CSV data:', error);
      return geojsonData; // Return original on error
    }
  }

  /**
   * Extract OBJECTID from GeoJSON feature - matches your existing field patterns
   */
  getObjectIdFromFeature(feature) {
    const props = feature.properties;
    // Try different possible field names for OBJECTID (from your existing code)
    return props.OBJECTID || 
           props.OBJECTID_1 || 
           props.FID || 
           props.Grid_Code || 
           props.Grid_CODE ||
           props.id ||
           null;
  }

  /**
   * Get color based on CSV data for map visualization
   */
  getCSVDataColor(feature, colorBy = 'supply') {
    const props = feature.properties;
    
    switch (colorBy) {
      case 'supply':
        return this.getSupplyColor(props.csv_totalSupply || 0);
      case 'saleprice':
        return this.getSalePriceColor(props.csv_averageSalePrice);
      case 'rentprice':
        return this.getRentPriceColor(props.csv_averageRentPrice);
      case 'housetype':
        return this.getHouseTypeColor(props.csv_dominantHouseType);
      default:
        return '#cccccc';
    }
  }

  // Color scheme functions - similar to your existing color patterns
  getSupplyColor(supply) {
    if (supply === 0) return '#f0f0f0';
    if (supply <= 5) return '#fee5d9';
    if (supply <= 15) return '#fcae91';
    if (supply <= 30) return '#fb6a4a';
    if (supply <= 50) return '#de2d26';
    return '#a50f15';
  }

  getSalePriceColor(price) {
    if (!price) return '#f0f0f0';
    if (price <= 1500000) return '#f7fcb9';
    if (price <= 3000000) return '#d9f0a3';
    if (price <= 5000000) return '#addd8e';
    if (price <= 8000000) return '#78c679';
    if (price <= 12000000) return '#41ab5d';
    return '#238443';
  }

  getRentPriceColor(price) {
    if (!price) return '#f0f0f0';
    if (price <= 2000) return '#f7fcfd';
    if (price <= 3000) return '#e0ecf4';
    if (price <= 4000) return '#bfd3e6';
    if (price <= 5000) return '#9ebcda';
    if (price <= 6000) return '#8c96c6';
    return '#8c6bb1';
  }

  getHouseTypeColor(houseType) {
    const colors = {
      'บ้านเดี่ยว': '#1f77b4',
      'ทาวน์เฮ้าส์/ทาวโฮม': '#ff7f0e',
      'ห้องแถว/ตึกแถว': '#2ca02c',
      'ตึกแถวพาณิชย์': '#d62728',
      'อาคารชุด/คอนโด': '#9467bd',
      'อพาร์เมนต์/หอพัก': '#8c564b',
      'การเคหะ': '#e377c2',
      'ที่อยู่อาศัยลักษณะอื่นๆ': '#7f7f7f',
      'ไม่ระบุ': '#bcbd22'
    };
    return colors[houseType] || '#cccccc';
  }
}

// Export instances for easy use - following your existing patterns
export const housingSupplyManager = new HousingSupplyDataManager();
export const geoJsonIntegrator = new GeoJSONCSVIntegrator();DataManager = new HousingSupplyDataManager();
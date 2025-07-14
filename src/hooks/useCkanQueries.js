import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { 
  getPopulationData,
  getHouseholdData,
  getIncomeData,
  getExpenditureData,
  getPopulationAgeData,
  getHousingSupplyByYear
} from '../utils/dataUtils';
import { getCkanData } from '../utils/ckanClient';
import { getPolicyData } from '../utils/policyUtils';

// Updated API resource IDs
const POPULATION_RESOURCE_ID = '4ef48676-1a0d-44b7-a450-517c61190344';
const POPULATION_AGE_RESOURCE_ID = 'b22dd69b-790f-475b-9c6a-c346fbb40daa';
const INCOME_RESOURCE_ID = '6a63d6c9-792c-450a-8f82-60e025bee415';
const EXPENDITURE_RESOURCE_ID = '98eb6fce-d04e-44e6-b3af-408ad2957653';
const HOUSEHOLD_RESOURCE_ID = '94b9e62e-7182-47b0-91b9-7c7400d990cc';
const HOUSING_AFFORDABILITY_RESOURCE_ID = '73ff152b-02fc-4468-a93b-1b29b53186eb';
const HOUSING_DEMAND_RESOURCE_ID = '1417ade4-fe17-4558-868a-e1b1821c6a9e';
// NEW: District-level housing affordability resource ID
const DISTRICT_HOUSING_AFFORDABILITY_RESOURCE_ID = 'c0b992d2-58f0-49ac-a63b-a4d163b8a264';

// Helper function to map house type names to IDs for district data
const mapHouseTypeToId = (houseTypeName) => {
  const houseTypeMapping = {
    'บ้านเดี่ยว': '1',
    'ห้องแถว/ตึกแถว': '2', 
    'ทาวน์เฮ้าส์/ทาวโฮม': '3',
    'หอพัก/แฟลต/อพาร์ทเมนต์': '4',
    'ตึกแถวพาณิชย์': '5'
  };
  
  return houseTypeMapping[houseTypeName] || '1';
};

// Individual query hooks
export const useHousingSupplyData = (provinceId) => {
  return useQuery({
    queryKey: ['housing-supply', provinceId],
    queryFn: async () => {
      const result = await getCkanData('15132377-edb0-40b0-9aad-8fd9f6769b92', {
        filters: JSON.stringify({ geo_id: provinceId }),
        limit: 1000,
        sort: 'year asc'
      });
      return result;
    },
    enabled: !!provinceId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

export const useHousingDemandData = (provinceId) => {
  return useQuery({
    queryKey: ['housing-demand', provinceId],
    queryFn: async () => {
      const result = await getCkanData(HOUSING_DEMAND_RESOURCE_ID, {
        filters: JSON.stringify({ geo_id: provinceId }),
        limit: 1000,
        sort: 'Quintile asc, current_house_type asc, future_house_type asc'
      });
      
      return result;
    },
    enabled: !!provinceId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

// Updated hook for housing affordability data with district support (simplified)
export const useHousingAffordabilityData = (provinceId, level = 'province', districtName = null) => {
  return useQuery({
    queryKey: ['housing-affordability', provinceId, level, districtName],
    queryFn: async () => {
      if (level === 'district' && districtName) {
        console.log(`Fetching district data for: ${districtName} in province ${provinceId}`);
        
        // Get all province data first, then filter in JavaScript to avoid CKAN conflicts
        const result = await getCkanData(DISTRICT_HOUSING_AFFORDABILITY_RESOURCE_ID, {
          filters: JSON.stringify({ geo_id: provinceId }),
          limit: 1000
        });
        
        console.log('Raw district API response:', result);
        
        if (!result.records || result.records.length === 0) {
          console.log('No records found for province:', provinceId);
          return { records: [] };
        }
        
        // Filter by district name using JavaScript
        const districtRecords = result.records.filter(record => 
          record.dname === districtName
        );
        
        console.log(`Filtered records for ${districtName}:`, districtRecords);
        
        if (districtRecords.length === 0) {
          console.warn(`No data found for district: ${districtName}`);
          return { records: [] };
        }
        
        // Transform the data to match expected format
        const transformedRecords = districtRecords.map(record => ({
          ...record,
          house_type: mapHouseTypeToId(record.House_type),
          demand_type: record.demand_type,
          Quintile: record.Quintile,
          Total_Hburden: record.Total_Hburden,
          Exp_house: record.Exp_house
        }));
        
        console.log('Transformed district records:', transformedRecords);
        
        return {
          records: transformedRecords
        };
      } else {
        // Use existing province-level data
        const result = await getCkanData(HOUSING_AFFORDABILITY_RESOURCE_ID, {
          filters: JSON.stringify({ geo_id: provinceId }),
          limit: 1000,
          sort: 'Quintile asc, house_type asc'
        });
        
        // Filter out house_type 6 for province-level data as requested
        const filteredRecords = result.records.filter(record => 
          record.house_type && parseInt(record.house_type) <= 5
        );
        
        return {
          ...result,
          records: filteredRecords
        };
      }
    },
    enabled: !!provinceId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// New hook to get available districts for a province (simplified approach)
export const useDistrictsData = (provinceId) => {
  return useQuery({
    queryKey: ['districts', provinceId],
    queryFn: async () => {
      // Get all records for the province first, then extract districts in JavaScript
      const result = await getCkanData(DISTRICT_HOUSING_AFFORDABILITY_RESOURCE_ID, {
        filters: JSON.stringify({ geo_id: provinceId }),
        limit: 1000
      });
      
      console.log('District API response:', result);
      
      if (!result.records || result.records.length === 0) {
        console.log('No district records found for province:', provinceId);
        return [];
      }
      
      // Log sample record to debug field structure
      console.log('Sample district record:', result.records[0]);
      console.log('Available fields:', Object.keys(result.records[0]));
      
      // Log all unique demand types found in the data
      const uniqueDemandTypes = [...new Set(result.records.map(record => record.demand_type))];
      console.log('Unique demand types found in district data:', uniqueDemandTypes);
      
      // Extract unique districts using JavaScript filtering
      const districts = [...new Set(result.records.map(record => record.dname))]
        .filter(Boolean)
        .map(districtName => ({
          id: districtName,
          name: districtName
        }));
      
      console.log('Extracted districts:', districts);
      return districts;
    },
    enabled: !!provinceId,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });
};

// Updated to use direct CKAN API call with new resource ID
export const usePopulationData = (provinceId) => {
  return useQuery({
    queryKey: ['population', provinceId],
    queryFn: async () => {
      const result = await getCkanData(POPULATION_RESOURCE_ID, {
        filters: JSON.stringify({ geo_id: provinceId }),
        limit: 1000,
        sort: 'year asc'
      });
      const transformedData = result.records.map(record => ({
        year: record.year,
        population: record.population
      }));
      
      return transformedData;
    },
    enabled: !!provinceId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

export const useHouseholdData = (provinceId) => {
  return useQuery({
    queryKey: ['household', provinceId],
    queryFn: async () => {
      const result = await getCkanData(HOUSEHOLD_RESOURCE_ID, {
        filters: JSON.stringify({ geo_id: provinceId }),
        limit: 1000,
        sort: 'year asc'
      });
      const transformedData = result.records.map(record => ({
        year: record.year,
        household: record.household
      }));
      
      return transformedData;
    },
    enabled: !!provinceId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

export const useIncomeData = (provinceId) => {
  return useQuery({
    queryKey: ['income', provinceId],
    queryFn: async () => {
      const result = await getCkanData(INCOME_RESOURCE_ID, {
        filters: JSON.stringify({ geo_id: provinceId }),
        limit: 1000,
        sort: 'year asc'
      });
      const transformedData = result.records.map(record => ({
        year: record.year,
        income: record.income
      }));
      
      return transformedData;
    },
    enabled: !!provinceId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

export const useExpenditureData = (provinceId, quintileId) => {
  return useQuery({
    queryKey: ['expenditure', provinceId, quintileId],
    queryFn: async () => {
      let filters = {};
      
      if (provinceId) filters.geo_id = provinceId;
      if (quintileId) filters.quintile = quintileId;
      
      const result = await getCkanData(EXPENDITURE_RESOURCE_ID, {
        filters: JSON.stringify(filters),
        limit: 500
      });
      
      return result.records || [];
    },
    enabled: !!provinceId && !!quintileId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Compound hook for all expenditure quintiles
export const useAllExpenditureData = (provinceId) => {
  return useQueries({
    queries: [1, 2, 3, 4, 5].map(quintileId => ({
      queryKey: ['expenditure', provinceId, quintileId],
      queryFn: async () => {
        let filters = {};
        
        if (provinceId) filters.geo_id = provinceId;
        if (quintileId) filters.quintile = quintileId;
        
        const result = await getCkanData(EXPENDITURE_RESOURCE_ID, {
          filters: JSON.stringify(filters),
          limit: 500
        });
        
        return result.records || [];
      },
      enabled: !!provinceId,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    })),
  });
};

export const usePopulationAgeData = (provinceId) => {
  return useQuery({
    queryKey: ['population-age', provinceId],
    queryFn: async () => {
      const result = await getCkanData(POPULATION_AGE_RESOURCE_ID, {
        filters: JSON.stringify({ geo_id: provinceId }),
        limit: 1000,
        sort: 'year asc'
      });
      
      // Return the transformed data directly (not the full result object)
      return result.records.map(record => ({
        year: record.year,
        age_group: record.age_group,
        age_population: record.age_population
      }));
    },
    enabled: !!provinceId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

export const usePolicyData = (provinceId) => {
  return useQuery({
    queryKey: ['policy', provinceId],
    queryFn: () => getPolicyData(provinceId),
    enabled: !!provinceId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Composite hook for all province data
export const useAllProvinceData = (provinceId) => {
  const population = usePopulationData(provinceId);
  const household = useHouseholdData(provinceId);
  const income = useIncomeData(provinceId);
  const populationAge = usePopulationAgeData(provinceId);
  const policy = usePolicyData(provinceId);
  const housingSupply = useHousingSupplyData(provinceId);
  const housingAffordability = useHousingAffordabilityData(provinceId);
  const housingDemand = useHousingDemandData(provinceId);
  const expenditure = useAllExpenditureData(provinceId);

  const isLoading = population.isLoading || household.isLoading || income.isLoading || 
                   populationAge.isLoading || policy.isLoading || housingSupply.isLoading || 
                   housingAffordability.isLoading || housingDemand.isLoading || 
                   expenditure.some(q => q.isLoading);

  const isError = population.isError || household.isError || income.isError || 
                 populationAge.isError || policy.isError || housingSupply.isError || 
                 housingAffordability.isError || housingDemand.isError || 
                 expenditure.some(q => q.isError);

  return {
    population,
    household,
    income,
    populationAge,
    policy,
    housingSupply,
    housingAffordability,
    housingDemand,
    expenditure,
    isLoading,
    isError
  };
};

// Updated prefetch hook with district support
export const usePrefetchProvinceData = () => {
  const queryClient = useQueryClient();
  
  const prefetchProvince = async (provinceId) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['population', provinceId],
        queryFn: async () => {
          const result = await getCkanData(POPULATION_RESOURCE_ID, {
            filters: JSON.stringify({ geo_id: provinceId }),
            limit: 1000,
            sort: 'year asc'
          });
          const transformedData = result.records.map(record => ({
            year: record.year,
            population: record.population
          }));
          
          return transformedData;
        },
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['household', provinceId],
        queryFn: async () => {
          const result = await getCkanData(HOUSEHOLD_RESOURCE_ID, {
            filters: JSON.stringify({ geo_id: provinceId }),
            limit: 1000,
            sort: 'year asc'
          });
          const transformedData = result.records.map(record => ({
            year: record.year,
            household: record.household
          }));
          
          return transformedData;
        },
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['income', provinceId],
        queryFn: async () => {
          const result = await getCkanData(INCOME_RESOURCE_ID, {
            filters: JSON.stringify({ geo_id: provinceId }),
            limit: 1000,
            sort: 'year asc'
          });
          const transformedData = result.records.map(record => ({
            year: record.year,
            income: record.income
          }));
          
          return transformedData;
        },
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['population-age', provinceId],
        queryFn: async () => {
          const result = await getCkanData(POPULATION_AGE_RESOURCE_ID, {
            filters: JSON.stringify({ geo_id: provinceId }),
            limit: 1000,
            sort: 'year asc'
          });
          
          // Return the transformed data directly
          return result.records.map(record => ({
            year: record.year,
            age_group: record.age_group,
            age_population: record.age_population
          }));
        },
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['housing-supply', provinceId],
        queryFn: async () => {
          const result = await getCkanData('15132377-edb0-40b0-9aad-8fd9f6769b92', {
            filters: JSON.stringify({ geo_id: provinceId }),
            limit: 1000,
            sort: 'year asc'
          });
          return result;
        },
        staleTime: 5 * 60 * 1000,
      }),
      // Prefetch province-level housing affordability
      queryClient.prefetchQuery({
        queryKey: ['province-housing-affordability', provinceId],
        queryFn: async () => {
          const result = await getCkanData(HOUSING_AFFORDABILITY_RESOURCE_ID, {
            filters: JSON.stringify({ geo_id: provinceId }),
            limit: 1000,
            sort: 'Quintile asc, house_type asc'
          });
          
          // Filter out house_type 6 as requested
          const filteredRecords = result.records.filter(record => 
            record.house_type && parseInt(record.house_type) >= 1 && parseInt(record.house_type) <= 5
          );
          
          return {
            ...result,
            records: filteredRecords
          };
        },
        staleTime: 5 * 60 * 1000,
      }),
      // Prefetch districts data (simplified)
      queryClient.prefetchQuery({
        queryKey: ['districts', provinceId],
        queryFn: async () => {
          const result = await getCkanData(DISTRICT_HOUSING_AFFORDABILITY_RESOURCE_ID, {
            filters: JSON.stringify({ geo_id: provinceId }),
            limit: 1000
          });
          
          if (!result.records || result.records.length === 0) {
            return [];
          }
          
          // Extract unique districts using JavaScript filtering
          const districts = [...new Set(result.records.map(record => record.dname))]
            .filter(Boolean)
            .map(districtName => ({
              id: districtName,
              name: districtName
            }));
          
          return districts;
        },
        staleTime: 10 * 60 * 1000,
      }),
      // Prefetch district-level housing affordability for สงขลา (geo_id = 90) - separate logic
      ...(provinceId === 90 ? [
        queryClient.prefetchQuery({
          queryKey: ['district-housing-affordability', provinceId, 'เทศบาลนครหาดใหญ่'],
          queryFn: async () => {
            // Get all province data first
            const result = await getCkanData(DISTRICT_HOUSING_AFFORDABILITY_RESOURCE_ID, {
              filters: JSON.stringify({ geo_id: provinceId }),
              limit: 1000
            });
            
            // Filter in JavaScript
            const districtRecords = result.records.filter(record => 
              record.dname === 'เทศบาลนครหาดใหญ่'
            );
            
            // No transformation needed - keep district data as-is
            return {
              records: districtRecords
            };
          },
          staleTime: 5 * 60 * 1000,
        })
      ] : []),
      queryClient.prefetchQuery({
        queryKey: ['housing-demand', provinceId],
        queryFn: async () => {
          const result = await getCkanData(HOUSING_DEMAND_RESOURCE_ID, {
            filters: JSON.stringify({ geo_id: provinceId }),
            limit: 1000,
            sort: 'Quintile asc, current_house_type asc, future_house_type asc'
          });
          
          return result;
        },
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['policy', provinceId],
        queryFn: () => getPolicyData(provinceId),
        staleTime: 5 * 60 * 1000,
      }),
    ]);
  };
  
  return { prefetchProvince };
};
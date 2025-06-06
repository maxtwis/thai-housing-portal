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
      
      // Transform the data to match the expected format in the chart component
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
    queryFn: () => getHouseholdData(provinceId),
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
      
      // Transform the data to match the expected format in the chart component
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

export const usePopulationAgeData = (provinceId) => {
  return useQuery({
    queryKey: ['population-age', provinceId],
    queryFn: async () => {
      const result = await getCkanData(POPULATION_AGE_RESOURCE_ID, {
        filters: JSON.stringify({ geo_id: provinceId }),
        limit: 1000,
        sort: 'year asc, age_group asc'
      });
      
      // Transform the data to match the expected format in the chart component
      const transformedData = result.records.map(record => ({
        year: record.year,
        age_group: record.age_group,
        age_population: record.age_population
      }));
      
      return transformedData;
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

// Compound hook for all expenditure quintiles
export const useAllExpenditureData = (provinceId) => {
  return useQueries({
    queries: [1, 2, 3, 4, 5].map(quintileId => ({
      queryKey: ['expenditure', provinceId, quintileId],
      queryFn: () => getExpenditureData(provinceId, quintileId),
      enabled: !!provinceId,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    })),
  });
};

// Compound hook for all data at once
export const useAllProvinceData = (provinceId) => {
  const population = usePopulationData(provinceId);
  const household = useHouseholdData(provinceId);
  const income = useIncomeData(provinceId);
  const populationAge = usePopulationAgeData(provinceId);
  const policy = usePolicyData(provinceId);
  const housingSupply = useHousingSupplyData(provinceId);
  const expenditureQueries = useAllExpenditureData(provinceId);
  
  return {
    population,
    household,
    income,
    populationAge,
    policy,
    housingSupply,
    expenditure: expenditureQueries,
    isLoading: population.isLoading || household.isLoading || income.isLoading || 
               populationAge.isLoading || policy.isLoading || housingSupply.isLoading ||
               expenditureQueries.some(q => q.isLoading),
    isError: population.isError || household.isError || income.isError || 
             populationAge.isError || policy.isError || housingSupply.isError ||
             expenditureQueries.some(q => q.isError),
  };
};

// Prefetch hook for preloading data
export const usePrefetchProvinceData = () => {
  const queryClient = useQueryClient();
  
  const prefetchProvince = async (provinceId) => {
    // Prefetch all data types for a province
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['population', provinceId],
        queryFn: async () => {
          const result = await getCkanData(POPULATION_RESOURCE_ID, {
            filters: JSON.stringify({ geo_id: provinceId }),
            limit: 1000,
            sort: 'year asc'
          });
          
          // Transform the data to match the expected format in the chart component
          return result.records.map(record => ({
            year: record.year,
            population: record.population
          }));
        },
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['household', provinceId],
        queryFn: () => getHouseholdData(provinceId),
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['population-age', provinceId],
        queryFn: async () => {
          const result = await getCkanData(POPULATION_AGE_RESOURCE_ID, {
            filters: JSON.stringify({ geo_id: provinceId }),
            limit: 1000,
            sort: 'year asc, age_group asc'
          });
          
          // Transform the data to match the expected format in the chart component
          return result.records.map(record => ({
            year: record.year,
            age_group: record.age_group,
            age_population: record.age_population
          }));
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
          
          // Transform the data to match the expected format in the chart component
          return result.records.map(record => ({
            year: record.year,
            income: record.income
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
      queryClient.prefetchQuery({
        queryKey: ['policy', provinceId],
        queryFn: () => getPolicyData(provinceId),
        staleTime: 5 * 60 * 1000,
      }),
    ]);
  };
  
  return { prefetchProvince };
};
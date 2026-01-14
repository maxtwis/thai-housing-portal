import { useQuery } from '@tanstack/react-query';
import { loadCSV, loadLookupMap } from '../utils/csvLoader';

/**
 * Custom hook to load local affordability data with province and income lookups
 * @param {number} provinceId - Province ID (cwt_id)
 * @returns {Object} React Query result with processed data
 */
export const useLocalAffordabilityData = (provinceId) => {
  return useQuery({
    queryKey: ['local-affordability', provinceId],
    queryFn: async () => {
      console.log('Loading local affordability data for province:', provinceId);

      // Load all data in parallel
      const [houseBurdenData, incomeRankMap, provinceMap] = await Promise.all([
        loadCSV('/data/house_burden_all.csv'),
        loadLookupMap('/data/income_rank_id.csv', 'income_rank_id', 'income_rank'),
        loadLookupMap('/data/cwt_id.csv', 'cwt_id', 'cwt_name')
      ]);

      console.log('Loaded house burden data:', houseBurdenData.length, 'records');
      console.log('Income rank map:', incomeRankMap);
      console.log('Province map:', provinceMap);

      // Filter by province
      const provinceData = houseBurdenData.filter(row =>
        row.cwt_id === provinceId
      );

      console.log('Filtered data for province:', provinceData.length, 'records');

      // Transform data to match the expected format
      const transformedData = provinceData.map(row => ({
        // Original fields
        cwt_id: row.cwt_id,
        income_rank_id: row.income_rank_id,
        house_type: row.house_type,

        // Mapped fields
        province_name: provinceMap[row.cwt_id] || 'ไม่ระบุ',
        income_rank: incomeRankMap[row.income_rank_id] || 'ไม่ระบุ',

        // Affordability metrics
        house_burden: parseFloat(row.house_burden) || 0,
        house_burden_rent: parseFloat(row.house_burden_rent) || 0,
        house_burden_mort: parseFloat(row.house_burden_mort) || 0,

        // For compatibility with chart component (map to expected field names)
        Quintile: row.income_rank_id, // Use income_rank_id as quintile
        Total_Hburden: parseFloat(row.house_burden) || 0,
        Exp_hbrent: parseFloat(row.house_burden_rent) || 0,
        Exp_hbmort: parseFloat(row.house_burden_mort) || 0,

        // Demand type - default to "กลุ่มประชากรทั่วไป" for local data
        demand_type: 'กลุ่มประชากรทั่วไป'
      }));

      console.log('Transformed data sample:', transformedData.slice(0, 3));

      return {
        records: transformedData,
        provinceMap,
        incomeRankMap
      };
    },
    enabled: !!provinceId,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    cacheTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });
};

/**
 * Hook to get available provinces from local data
 */
export const useLocalProvinces = () => {
  return useQuery({
    queryKey: ['local-provinces'],
    queryFn: async () => {
      const provinceMap = await loadLookupMap('/data/cwt_id.csv', 'cwt_id', 'cwt_name');

      return Object.entries(provinceMap).map(([id, name]) => ({
        id: parseInt(id),
        name: name
      }));
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    cacheTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });
};

/**
 * Hook to get income rank labels
 */
export const useIncomeRankLabels = () => {
  return useQuery({
    queryKey: ['income-rank-labels'],
    queryFn: async () => {
      return await loadLookupMap('/data/income_rank_id.csv', 'income_rank_id', 'income_rank');
    },
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
};

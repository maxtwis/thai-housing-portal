import { useQuery } from '@tanstack/react-query';
import { loadCSV, loadLookupMap } from '../utils/csvLoader';

/**
 * Custom hook to load local household by income data
 * @param {number} provinceId - Province ID (cwt_id)
 * @returns {Object} React Query result with processed data
 */
export const useLocalHouseholdByIncomeData = (provinceId) => {
  return useQuery({
    queryKey: ['local-household-by-income', provinceId],
    queryFn: async () => {
      console.log('Loading local household by income data for province:', provinceId);

      // Load all data in parallel
      const [householdData, incomeRankMap, provinceMap] = await Promise.all([
        loadCSV('/data/household_by_income.csv'),
        loadLookupMap('/data/income_rank_id.csv', 'income_rank_id', 'income_rank'),
        loadLookupMap('/data/cwt_id.csv', 'cwt_id', 'cwt_name')
      ]);

      console.log('Loaded household data:', householdData.length, 'records');
      console.log('Income rank map:', incomeRankMap);
      console.log('Province map:', provinceMap);

      // Filter by province
      const provinceData = householdData.filter(row =>
        row.cwt_id === provinceId
      );

      console.log('Filtered data for province:', provinceData.length, 'records');

      // Transform data to match the expected format
      const transformedData = provinceData.map(row => ({
        // Original fields
        cwt_id: row.cwt_id,
        income_rank_id: row.income_rank_id,
        household_number: parseFloat(row.household_number) || 0,

        // Mapped fields
        province_name: provinceMap[row.cwt_id] || 'ไม่ระบุ',
        income_rank: incomeRankMap[row.income_rank_id] || 'ไม่ระบุ',

        // For chart compatibility
        Quintile: row.income_rank_id,
        value: parseFloat(row.household_number) || 0
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

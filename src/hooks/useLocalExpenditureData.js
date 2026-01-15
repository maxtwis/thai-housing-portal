import { useQuery } from '@tanstack/react-query';
import { loadCSV, loadLookupMap } from '../utils/csvLoader';

/**
 * Custom hook to load average expenditure data
 * @param {number} provinceId - Province ID (cwt_id)
 * @returns {Object} React Query result with processed data
 */
export const useLocalExpenditureData = (provinceId) => {
  return useQuery({
    queryKey: ['local-expenditure', provinceId],
    queryFn: async () => {
      console.log('Loading average expenditure data for province:', provinceId);

      // Load CSV data
      const [expenditureData, incomeRankMap] = await Promise.all([
        loadCSV('/data/average_expenditure.csv'),
        loadLookupMap('/data/income_rank_id.csv', 'income_rank_id', 'income_rank')
      ]);

      console.log('Loaded expenditure data:', expenditureData.length, 'records');
      console.log('Income rank map:', incomeRankMap);

      // Filter by province
      const provinceData = expenditureData.filter(row =>
        row.cwt_id === provinceId
      );

      console.log('Filtered expenditure data for province:', provinceData.length, 'records');

      // Transform data
      const transformedData = provinceData.map(row => ({
        cwt_id: row.cwt_id,
        income_rank_id: parseInt(row.income_rank_id),
        income_rank: incomeRankMap[row.income_rank_id] || `Q${row.income_rank_id}`,
        exp_water_electricity: parseFloat(row.exp_water_electricity) || 0,
        exp_cooking_fuel: parseFloat(row.exp_cooking_fuel) || 0,
        exp_garbage: parseFloat(row.exp_garbage) || 0,
        exp_services: parseFloat(row.exp_services) || 0,
        exp_health: parseFloat(row.exp_health) || 0,
        exp_fuel: parseFloat(row.exp_fuel) || 0,
        exp_transportation: parseFloat(row.exp_transportation) || 0,
        exp_food: parseFloat(row.exp_food) || 0,
        exp_house_repair: parseFloat(row.exp_house_repair) || 0,
        exp_rental: parseFloat(row.exp_rental) || 0,
        exp_mortgage: parseFloat(row.exp_mortgage) || 0
      }));

      // Sort by income rank
      transformedData.sort((a, b) => a.income_rank_id - b.income_rank_id);

      console.log('Transformed expenditure data sample:', transformedData.slice(0, 3));

      return {
        records: transformedData
      };
    },
    enabled: !!provinceId,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });
};

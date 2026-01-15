import { useQuery } from '@tanstack/react-query';
import { loadCSV, loadLookupMap } from '../utils/csvLoader';

/**
 * Custom hook to load local housing supply data with price rank
 * @param {number} provinceId - Province ID (cwt_id)
 * @returns {Object} React Query result with processed data
 */
export const useLocalHousingSupplyData = (provinceId) => {
  return useQuery({
    queryKey: ['local-housing-supply', provinceId],
    queryFn: async () => {
      console.log('Loading local housing supply data for province:', provinceId);

      // Load CSV data - housing_supply already has cwt_name, so we don't need cwt_id.csv
      const [housingSupplyData, priceRankData] = await Promise.all([
        loadCSV('/data/housing_supply.csv'),
        loadCSV('/data/price_rank_id.csv')
      ]);

      console.log('Loaded housing supply data:', housingSupplyData.length, 'records');
      console.log('Loaded price rank data:', priceRankData);

      // Create price rank map (separate for rent and sale)
      const priceRankMap = {};
      priceRankData.forEach(row => {
        priceRankMap[row.price_rank_id] = {
          rent: row.price_rank_rent || '-',
          sale: row.price_rank_sale || '-'
        };
      });

      console.log('Price rank map:', priceRankMap);

      // Filter by province
      const provinceData = housingSupplyData.filter(row =>
        row.cwt_id === provinceId
      );

      console.log('Filtered data for province:', provinceData.length, 'records');

      // Transform data
      const transformedData = provinceData.map(row => ({
        cwt_id: row.cwt_id,
        cwt_name: row.cwt_name,
        price_rank: parseInt(row.price_rank),
        supply_type: row.supply_type,
        supply_unit: parseFloat(row.supply_unit) || 0,
        supply_rent: parseFloat(row.supply_rent) || 0,
        supply_sale: parseFloat(row.supply_sale) || 0,
        price_rank_rent: priceRankMap[row.price_rank]?.rent || '-',
        price_rank_sale: priceRankMap[row.price_rank]?.sale || '-'
      }));

      console.log('Transformed supply data sample:', transformedData.slice(0, 5));

      return {
        records: transformedData,
        priceRankMap
      };
    },
    enabled: !!provinceId,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });
};

/**
 * Hook to get price rank labels
 */
export const usePriceRankLabels = () => {
  return useQuery({
    queryKey: ['price-rank-labels'],
    queryFn: async () => {
      const priceRankData = await loadCSV('/data/price_rank_id.csv');

      const labels = {};
      priceRankData.forEach(row => {
        labels[row.price_rank_id] = {
          rent: row.price_rank_rent || '-',
          sale: row.price_rank_sale || '-'
        };
      });

      return labels;
    },
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
};

/**
 * Custom hook to load housing supply average price data
 * @param {number} provinceId - Province ID (cwt_id)
 * @returns {Object} React Query result with processed data
 */
export const useLocalHousingAveragePriceData = (provinceId) => {
  return useQuery({
    queryKey: ['local-housing-average-price', provinceId],
    queryFn: async () => {
      console.log('Loading housing supply average price data for province:', provinceId);

      // Load CSV data
      const averagePriceData = await loadCSV('/data/housing_supply_average_price.csv');

      console.log('Loaded average price data:', averagePriceData.length, 'records');

      // Filter by province
      const provinceData = averagePriceData.filter(row =>
        row.cwt_id === provinceId
      );

      console.log('Filtered average price data for province:', provinceData.length, 'records');

      // Transform data
      const transformedData = provinceData.map(row => ({
        cwt_id: row.cwt_id,
        supply_type: row.supply_type,
        average_price: parseFloat(row.average_price) || 0
      }));

      console.log('Transformed average price data:', transformedData);

      return {
        records: transformedData
      };
    },
    enabled: !!provinceId,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });
};

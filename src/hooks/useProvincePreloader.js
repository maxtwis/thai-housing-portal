// hooks/useProvincePreloader.js
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { provinces } from '../utils/dataUtils';
import { getCkanData } from '../utils/ckanClient';

export const useProvincePreloader = (currentProvinceId) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const preloadOtherProvinces = async () => {
      // Only preload when the current province is loaded
      const currentHousingQuery = queryClient.getQueryData(['housing-supply', currentProvinceId]);
      
      if (!currentHousingQuery) return;
      
      // Preload housing data for all other provinces
      const otherProvinces = provinces.filter(p => p.id !== currentProvinceId);
      
      for (const province of otherProvinces) {
        // Check if we already have this data
        const existingData = queryClient.getQueryData(['housing-supply', province.id]);
        
        if (!existingData) {
          // Stagger the requests to be nice to the server
          setTimeout(() => {
            queryClient.prefetchQuery({
              queryKey: ['housing-supply', province.id],
              queryFn: async () => {
                console.log(`Preloading housing data for ${province.name}`);
                const result = await getCkanData('15132377-edb0-40b0-9aad-8fd9f6769b92', {
                  filters: JSON.stringify({ geo_id: province.id }),
                  limit: 1000,
                  sort: 'year asc'
                });
                return result;
              },
              staleTime: 5 * 60 * 1000,
              cacheTime: 10 * 60 * 1000,
            });
          }, province.id * 1000); // 1 second apart
        }
      }
    };
    
    // Start preloading after a delay
    const timeoutId = setTimeout(preloadOtherProvinces, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [currentProvinceId, queryClient]);
  
  // Return cache statistics for debugging
  const getCacheStats = () => {
    const stats = {};
    provinces.forEach(province => {
      const data = queryClient.getQueryData(['housing-supply', province.id]);
      stats[province.id] = {
        name: province.name,
        cached: !!data,
        stale: data ? queryClient.getQueryState(['housing-supply', province.id])?.isStale : null
      };
    });
    return stats;
  };
  
  return { getCacheStats };
};
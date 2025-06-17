import { useQuery } from '@tanstack/react-query';
import { getCkanData } from '../utils/ckanClient';

// Apartment supply resource ID
const APARTMENT_RESOURCE_ID = 'b6dbb8e0-1194-4eeb-945d-e883b3275b35';

// Hook to fetch apartment supply data
export const useApartmentData = (filters = {}) => {
  return useQuery({
    queryKey: ['apartment-supply', filters],
    queryFn: async () => {
      console.log('Fetching apartment data from CKAN API...');
      
      const result = await getCkanData(APARTMENT_RESOURCE_ID, {
        limit: 5000,
        sort: 'apartment_id asc',
        ...filters
      });
      
      if (!result || !result.records) {
        throw new Error('No apartment data received from CKAN API');
      }
      
      // Process and validate the data
      const processedData = result.records.map(record => ({
        apartment_id: record.apartment_id,
        apartment_name: record.apartment_name || `Apartment ${record.apartment_id}`,
        room_type: record.room_type,
        size_min: parseFloat(record.size_min) || 0,
        size_max: parseFloat(record.size_max) || 0,
        price_min: parseFloat(record.price_min) || 0,
        price_max: parseFloat(record.price_max) || 0,
        address: record.address,
        latitude: parseFloat(record.latitude),
        longitude: parseFloat(record.longitude),
        // Facility data - ensure numeric values
        facility_aircondition: parseFloat(record.facility_aircondition) || 0,
        facility_waterheater: parseFloat(record.facility_waterheater) || 0,
        facility_furniture: parseFloat(record.facility_furniture) || 0,
        facility_tv: parseInt(record.facility_tv) || 0,
        facility_cabletv: parseInt(record.facility_cabletv) || 0,
        facility_wifi: parseFloat(record.facility_wifi) || 0,
        facility_parking: parseInt(record.facility_parking) || 0,
        facility_moto_parking: parseInt(record.facility_moto_parking) || 0,
        facility_elevator: parseInt(record.facility_elevator) || 0,
        facility_keycard: parseFloat(record.facility_keycard) || 0,
        facility_cctv: parseFloat(record.facility_cctv) || 0,
        facility_security: parseFloat(record.facility_security) || 0,
        facility_laundry_shop: parseInt(record.facility_laundry_shop) || 0,
        facility_shop: parseInt(record.facility_shop) || 0,
        facility_fan: parseInt(record.facility_fan) || 0,
        facility_telephone: parseInt(record.facility_telephone) || 0,
        facility_restaurant: parseInt(record.facility_restaurant) || 0,
        facility_internet_cafe: parseInt(record.facility_internet_cafe) || 0,
        facility_salon: parseInt(record.facility_salon) || 0,
        facility_smoke_allowed: parseInt(record.facility_smoke_allowed) || 0,
        facility_shuttle: parseInt(record.facility_shuttle) || 0,
        facility_pets_allowed: parseInt(record.facility_pets_allowed) || 0,
        facility_pool: parseInt(record.facility_pool) || 0,
        facility_gym: parseInt(record.facility_gym) || 0,
        facility_LAN: parseInt(record.facility_LAN) || 0
      })).filter(apartment => 
        // Filter out apartments without valid coordinates
        apartment.latitude && apartment.longitude && 
        !isNaN(apartment.latitude) && !isNaN(apartment.longitude)
      );
      
      console.log(`Processed ${processedData.length} valid apartment records`);
      
      if (processedData.length === 0) {
        throw new Error('No valid apartment data found with coordinates');
      }
      
      return processedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  });
};

// Hook to get apartment metadata
export const useApartmentMetadata = () => {
  return useQuery({
    queryKey: ['apartment-metadata'],
    queryFn: async () => {
      const result = await getCkanData(APARTMENT_RESOURCE_ID, {
        limit: 0 // Just get metadata, no records
      });
      
      return {
        total: result.total || 0,
        fields: result.fields || [],
        resource_id: result.resource_id
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Utility functions for apartment data processing
export const calculateFacilityScore = (apartment) => {
  const facilityKeys = Object.keys(apartment).filter(key => key.startsWith('facility_'));
  const totalFacilities = facilityKeys.length;
  const availableFacilities = facilityKeys.filter(key => apartment[key] > 0).length;
  return totalFacilities > 0 ? (availableFacilities / totalFacilities) * 100 : 0;
};

export const getApartmentPriceRange = (apartment) => {
  const minPrice = apartment.price_min || 0;
  if (minPrice < 5000) return 'budget';
  if (minPrice < 10000) return 'mid-range';
  if (minPrice < 20000) return 'high-end';
  return 'luxury';
};

export const getApartmentSizeCategory = (apartment) => {
  const maxSize = apartment.size_max || apartment.size_min || 0;
  if (maxSize < 30) return 'small';
  if (maxSize < 50) return 'medium';
  if (maxSize < 80) return 'large';
  return 'very-large';
};
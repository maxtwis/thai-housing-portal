import { useQuery } from '@tanstack/react-query';
import { getCkanData } from '../utils/ckanClient';

// Apartment supply resource ID
const APARTMENT_RESOURCE_ID = 'b6dbb8e0-1194-4eeb-945d-e883b3275b35';

// Hook to fetch apartment supply data with new structure
export const useApartmentData = (filters = {}) => {
  return useQuery({
    queryKey: ['apartment-supply', filters],
    queryFn: async () => {
      console.log('Fetching apartment data from CKAN API...');
      
      const result = await getCkanData(APARTMENT_RESOURCE_ID, {
        limit: 5000,
        sort: 'name asc',
        ...filters
      });
      
      if (!result || !result.records) {
        throw new Error('No apartment data received from CKAN API');
      }
      
      // Process and validate the data with new structure
      const processedData = result.records.map(record => ({
        // Basic property info
        id: record.name + '_' + (record.latitude || '') + '_' + (record.longitude || ''), // Create unique ID
        name: record.name || 'Unknown Property',
        property_type: record.property_type || 'APARTMENT',
        latitude: parseFloat(record.latitude),
        longitude: parseFloat(record.longitude),
        
        // Location info
        province: record.province || '',
        province_code: record.province_code || '',
        district: record.district || '',
        subdistrict: record.subdistrict || '',
        street: record.street || '',
        road: record.road || '',
        house_number: record.house_number || '',
        address: `${record.house_number || ''} ${record.street || ''} ${record.road || ''} ${record.subdistrict || ''} ${record.district || ''} ${record.province || ''}`.trim(),
        
        // Pricing info
        monthly_min_price: parseFloat(record.monthly_min_price) || 0,
        monthly_max_price: parseFloat(record.monthly_max_price) || 0,
        daily_min_price: parseFloat(record.daily_min_price) || 0,
        daily_max_price: parseFloat(record.daily_max_price) || 0,
        daily_rental_type: record.daily_rental_type || '',
        
        // Fee structure
        water_fee_type: record.water_fee_type || '',
        water_unit_price: parseFloat(record.water_unit_price) || 0,
        electric_fee_type: record.electric_fee_type || '',
        electric_unit_price: parseFloat(record.electric_unit_price) || 0,
        service_fee_type: record.service_fee_type || '',
        internet_fee_type: record.internet_fee_type || '',
        deposit_type: record.deposit_type || '',
        
        // Room info
        room_type: record.room_type || '',
        room_size_min: parseFloat(record.room_size_min) || 0,
        room_size_max: parseFloat(record.room_size_max) || 0,
        rooms_available: parseInt(record.rooms_available) || 0,
        total_room_types: parseInt(record.total_room_types) || 0,
        
        // Amenities - convert string 'TRUE'/'FALSE' to boolean
        has_air: record.has_air === 'TRUE' || record.has_air === true,
        has_furniture: record.has_furniture === 'TRUE' || record.has_furniture === true,
        has_internet: record.has_internet === 'TRUE' || record.has_internet === true,
        has_parking: record.has_parking === 'TRUE' || record.has_parking === true,
        has_lift: record.has_lift === 'TRUE' || record.has_lift === true,
        has_pool: record.has_pool === 'TRUE' || record.has_pool === true,
        has_fitness: record.has_fitness === 'TRUE' || record.has_fitness === true,
        has_security: record.has_security === 'TRUE' || record.has_security === true,
        has_cctv: record.has_cctv === 'TRUE' || record.has_cctv === true,
        allow_pet: record.allow_pet === 'TRUE' || record.allow_pet === true,
        total_amenities: parseInt(record.total_amenities) || 0,
        
        // Contact info
        contact_email: record.contact_email || '',
        contact_line_id: record.contact_line_id || '',
        phone_count: parseInt(record.phone_count) || 0,
        url: record.url || ''
      })).filter(property => 
        // Filter out properties without valid coordinates
        property.latitude && property.longitude && 
        !isNaN(property.latitude) && !isNaN(property.longitude)
      );
      
      console.log(`Processed ${processedData.length} valid property records`);
      
      if (processedData.length === 0) {
        throw new Error('No valid property data found with coordinates');
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

// Utility functions for property data processing - updated for new structure
export const calculateAmenityScore = (property) => {
  const amenityKeys = [
    'has_air', 'has_furniture', 'has_internet', 'has_parking',
    'has_lift', 'has_pool', 'has_fitness', 'has_security', 
    'has_cctv', 'allow_pet'
  ];
  const totalAmenities = amenityKeys.length;
  const availableAmenities = amenityKeys.filter(key => property[key] === true).length;
  return totalAmenities > 0 ? (availableAmenities / totalAmenities) * 100 : 0;
};

export const getPropertyPriceRange = (property) => {
  const minPrice = property.monthly_min_price || 0;
  if (minPrice < 5000) return 'budget';
  if (minPrice < 10000) return 'mid-range';
  if (minPrice < 20000) return 'high-end';
  return 'luxury';
};

export const getPropertySizeCategory = (property) => {
  const maxSize = property.room_size_max || property.room_size_min || 0;
  if (maxSize < 20) return 'small';
  if (maxSize < 35) return 'medium';
  if (maxSize < 50) return 'large';
  return 'very-large';
};

export const getPropertyTypeLabel = (propertyType) => {
  const typeLabels = {
    'APARTMENT': 'อพาร์ตเมนต์',
    'CONDO': 'คอนโดมิเนียม',
    'HOUSE': 'บ้าน',
    'TOWNHOUSE': 'ทาวน์เฮ้าส์',
    'STUDIO': 'สตูดิโอ'
  };
  return typeLabels[propertyType] || propertyType;
};

export const getRoomTypeLabel = (roomType) => {
  const roomLabels = {
    'STUDIO': 'สตูดิโอ',
    'ONE_BED_ROOM': '1 ห้องนอน',
    'TWO_BED_ROOM': '2 ห้องนอน',
    'THREE_BED_ROOM': '3 ห้องนอน',
    'FOUR_BED_ROOM': '4 ห้องนอน',
    'FIVE_BED_ROOM': '5 ห้องนอน'
  };
  return roomLabels[roomType] || roomType;
};

// Filter properties based on criteria
export const filterProperties = (properties, filters) => {
  return properties.filter(property => {
    // Price range filter (monthly)
    if (filters.priceRange && filters.priceRange !== 'all') {
      const [minPrice, maxPrice] = filters.priceRange.split('-').map(Number);
      const propertyPrice = property.monthly_min_price || 0;
      if (maxPrice && maxPrice !== 999999) {
        if (propertyPrice < minPrice || propertyPrice > maxPrice) return false;
      } else {
        if (propertyPrice < minPrice) return false;
      }
    }

    // Property type filter
    if (filters.propertyType && filters.propertyType !== 'all') {
      if (property.property_type !== filters.propertyType) return false;
    }

    // Room type filter
    if (filters.roomType && filters.roomType !== 'all') {
      if (property.room_type !== filters.roomType) return false;
    }

    // Size filter
    if (filters.sizeRange && filters.sizeRange !== 'all') {
      const [minSize, maxSize] = filters.sizeRange.split('-').map(Number);
      const propertySize = property.room_size_max || property.room_size_min || 0;
      if (maxSize && maxSize !== 999) {
        if (propertySize < minSize || propertySize > maxSize) return false;
      } else {
        if (propertySize < minSize) return false;
      }
    }

    // Amenity score filter
    if (filters.amenities && filters.amenities !== 'all') {
      const amenityScore = calculateAmenityScore(property);
      const [minScore, maxScore] = filters.amenities.split('-').map(Number);
      if (maxScore) {
        if (amenityScore < minScore || amenityScore > maxScore) return false;
      } else {
        if (amenityScore < minScore) return false;
      }
    }

    // Required amenities filter
    if (filters.requiredAmenities && filters.requiredAmenities.length > 0) {
      const amenityMap = {
        'parking': 'has_parking',
        'internet': 'has_internet',
        'pool': 'has_pool',
        'fitness': 'has_fitness',
        'security': 'has_security',
        'lift': 'has_lift',
        'air': 'has_air',
        'furniture': 'has_furniture',
        'cctv': 'has_cctv',
        'pet': 'allow_pet'
      };

      for (const requiredAmenity of filters.requiredAmenities) {
        const amenityKey = amenityMap[requiredAmenity];
        if (!amenityKey || !property[amenityKey]) {
          return false;
        }
      }
    }

    // Province filter
    if (filters.province && filters.province !== 'all') {
      if (property.province !== filters.province) return false;
    }

    // District filter
    if (filters.district && filters.district !== 'all') {
      if (property.district !== filters.district) return false;
    }

    return true;
  });
};

// Get statistics from property data
export const calculatePropertyStatistics = (properties) => {
  if (!properties || properties.length === 0) {
    return {
      totalProperties: 0,
      averagePrice: 0,
      averageSize: 0,
      averageAmenityScore: 0,
      propertyTypes: {},
      roomTypes: {},
      priceRanges: {},
      provinces: {},
      popularAmenities: {}
    };
  }

  const totalProperties = properties.length;
  const totalPrice = properties.reduce((sum, prop) => sum + (prop.monthly_min_price || 0), 0);
  const totalSize = properties.reduce((sum, prop) => sum + (prop.room_size_min || 0), 0);
  const totalAmenityScore = properties.reduce((sum, prop) => sum + calculateAmenityScore(prop), 0);

  // Calculate property type distribution
  const propertyTypes = {};
  properties.forEach(prop => {
    if (prop.property_type) {
      propertyTypes[prop.property_type] = (propertyTypes[prop.property_type] || 0) + 1;
    }
  });

  // Calculate room type distribution
  const roomTypes = {};
  properties.forEach(prop => {
    if (prop.room_type) {
      roomTypes[prop.room_type] = (roomTypes[prop.room_type] || 0) + 1;
    }
  });

  // Calculate price range distribution
  const priceRanges = {
    'under5k': 0,
    '5k-10k': 0,
    '10k-20k': 0,
    '20k-30k': 0,
    'over30k': 0
  };

  properties.forEach(prop => {
    const price = prop.monthly_min_price || 0;
    if (price < 5000) priceRanges['under5k']++;
    else if (price < 10000) priceRanges['5k-10k']++;
    else if (price < 20000) priceRanges['10k-20k']++;
    else if (price < 30000) priceRanges['20k-30k']++;
    else priceRanges['over30k']++;
  });

  // Calculate province distribution
  const provinces = {};
  properties.forEach(prop => {
    if (prop.province) {
      provinces[prop.province] = (provinces[prop.province] || 0) + 1;
    }
  });

  // Calculate popular amenities
  const popularAmenities = {};
  const amenityFields = [
    { key: 'has_air', label: 'เครื่องปรับอากาศ' },
    { key: 'has_furniture', label: 'เฟอร์นิเจอร์' },
    { key: 'has_internet', label: 'อินเทอร์เน็ต' },
    { key: 'has_parking', label: 'ที่จอดรถ' },
    { key: 'has_lift', label: 'ลิฟต์' },
    { key: 'has_pool', label: 'สระว่ายน้ำ' },
    { key: 'has_fitness', label: 'ฟิตเนส' },
    { key: 'has_security', label: 'รักษาความปลอดภัย' },
    { key: 'has_cctv', label: 'กล้องวงจรปิด' },
    { key: 'allow_pet', label: 'อนุญาตสัตว์เลี้ยง' }
  ];

  amenityFields.forEach(({ key, label }) => {
    const count = properties.filter(prop => prop[key] === true).length;
    popularAmenities[key] = (count / totalProperties) * 100;
  });

  return {
    totalProperties,
    averagePrice: Math.round(totalPrice / totalProperties),
    averageSize: Math.round(totalSize / totalProperties),
    averageAmenityScore: Math.round(totalAmenityScore / totalProperties),
    propertyTypes,
    roomTypes,
    priceRanges,
    provinces,
    popularAmenities
  };
};

// Get unique values for filter dropdowns
export const getUniqueValues = (properties, field) => {
  const values = properties.map(prop => prop[field]).filter(Boolean);
  return [...new Set(values)].sort();
};

// Search properties by text
export const searchProperties = (properties, searchText) => {
  if (!searchText || searchText.trim() === '') return properties;
  
  const lowercaseSearch = searchText.toLowerCase();
  
  return properties.filter(property => {
    return (
      property.name?.toLowerCase().includes(lowercaseSearch) ||
      property.address?.toLowerCase().includes(lowercaseSearch) ||
      property.district?.toLowerCase().includes(lowercaseSearch) ||
      property.subdistrict?.toLowerCase().includes(lowercaseSearch) ||
      property.province?.toLowerCase().includes(lowercaseSearch) ||
      property.property_type?.toLowerCase().includes(lowercaseSearch) ||
      property.room_type?.toLowerCase().includes(lowercaseSearch)
    );
  });
};
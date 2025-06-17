import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCkanData } from '../utils/ckanClient';

// Fix for default markers in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ApartmentSupply = () => {
  const [apartmentData, setApartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [nearbyData, setNearbyData] = useState({});
  const [loadingNearby, setLoadingNearby] = useState(false);
  
  // Map refs
  const mapContainerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const nearbyLayersRef = React.useRef({});

  // Filter state
  const [filters, setFilters] = useState({
    priceRange: 'all',
    roomType: 'all',
    sizeRange: 'all',
    facilities: 'all',
    requiredFacilities: []
  });

  // Color scheme state
  const [colorScheme, setColorScheme] = useState('priceRange');

  // Statistics state
  const [stats, setStats] = useState({
    totalApartments: 0,
    averagePrice: 0,
    averageSize: 0,
    averageFacilityScore: 0,
    roomTypes: {},
    priceRanges: {},
    popularFacilities: {}
  });

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowFilters(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load apartment data from CKAN API
  useEffect(() => {
    const loadApartmentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading apartment data from CKAN API...');
        
        const result = await getCkanData('b6dbb8e0-1194-4eeb-945d-e883b3275b35', {
          limit: 2000,
          sort: 'apartment_id asc'
        });
        
        if (!result || !result.records) {
          throw new Error('No data received from CKAN API');
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
          // Facility data
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
          apartment.latitude && apartment.longitude && 
          !isNaN(apartment.latitude) && !isNaN(apartment.longitude)
        );
        
        console.log(`Processed ${processedData.length} valid apartment records`);
        
        setApartmentData(processedData);
        calculateStatistics(processedData);
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading apartment data:', err);
        setError(`Failed to load apartment data: ${err.message}`);
        setLoading(false);
      }
    };

    loadApartmentData();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [13.7563, 100.5018], // Bangkok coordinates
      zoom: 12,
      maxZoom: 18,
      minZoom: 10,
      zoomControl: !isMobile,
      attributionControl: true
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // Add zoom control for mobile
    if (isMobile) {
      L.control.zoom({
        position: 'topright'
      }).addTo(map);
    }

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isMobile]);

  // Calculate statistics
  const calculateStatistics = (data) => {
    if (!data || data.length === 0) return;

    const totalApartments = data.length;
    const averagePrice = data.reduce((sum, apt) => sum + (apt.price_min || 0), 0) / totalApartments;
    const averageSize = data.reduce((sum, apt) => sum + (apt.size_max || apt.size_min || 0), 0) / totalApartments;
    
    // Calculate facility scores
    const facilityScores = data.map(apt => calculateFacilityScore(apt));
    const averageFacilityScore = facilityScores.reduce((sum, score) => sum + score, 0) / totalApartments;

    // Count room types
    const roomTypes = {};
    data.forEach(apt => {
      const type = apt.room_type || 'Unknown';
      roomTypes[type] = (roomTypes[type] || 0) + 1;
    });

    // Count price ranges
    const priceRanges = {
      '0-5000': 0,
      '5000-10000': 0,
      '10000-20000': 0,
      '20000-30000': 0,
      '30000+': 0
    };
    data.forEach(apt => {
      const price = apt.price_min || 0;
      if (price < 5000) priceRanges['0-5000']++;
      else if (price < 10000) priceRanges['5000-10000']++;
      else if (price < 20000) priceRanges['10000-20000']++;
      else if (price < 30000) priceRanges['20000-30000']++;
      else priceRanges['30000+']++;
    });

    // Calculate popular facilities
    const popularFacilities = {};
    const facilityKeys = Object.keys(data[0] || {}).filter(key => key.startsWith('facility_'));
    facilityKeys.forEach(facility => {
      const count = data.filter(apt => apt[facility] > 0).length;
      popularFacilities[facility] = (count / totalApartments) * 100;
    });

    setStats({
      totalApartments,
      averagePrice,
      averageSize,
      averageFacilityScore,
      roomTypes,
      priceRanges,
      popularFacilities
    });
  };

  // Calculate facility score for an apartment
  const calculateFacilityScore = (apartment) => {
    const facilityKeys = Object.keys(apartment).filter(key => key.startsWith('facility_'));
    const totalFacilities = facilityKeys.length;
    const availableFacilities = facilityKeys.filter(key => apartment[key] > 0).length;
    return totalFacilities > 0 ? (availableFacilities / totalFacilities) * 100 : 0;
  };

  // Get marker color based on color scheme
  const getMarkerColor = (apartment) => {
    const schemes = {
      priceRange: () => {
        const price = apartment.price_min || 0;
        if (price < 5000) return '#2ca02c';
        if (price < 10000) return '#ff7f0e';
        if (price < 20000) return '#d62728';
        return '#9467bd';
      },
      roomType: () => {
        const type = apartment.room_type || '';
        if (type.includes('Studio')) return '#1f77b4';
        if (type.includes('1BR')) return '#ff7f0e';
        if (type.includes('2BR')) return '#2ca02c';
        if (type.includes('3BR')) return '#d62728';
        return '#7f7f7f';
      },
      facilityScore: () => {
        const score = calculateFacilityScore(apartment);
        if (score >= 80) return '#2ca02c';
        if (score >= 60) return '#ff7f0e';
        if (score >= 40) return '#d62728';
        return '#7f7f7f';
      },
      size: () => {
        const size = apartment.size_max || apartment.size_min || 0;
        if (size < 30) return '#9467bd';
        if (size < 50) return '#1f77b4';
        if (size < 80) return '#ff7f0e';
        return '#2ca02c';
      }
    };
    
    return schemes[colorScheme] ? schemes[colorScheme]() : schemes.priceRange();
  };

  // Generate popup content
  const generatePopupContent = (apartment) => {
    const facilityScore = calculateFacilityScore(apartment);
    
    return `
      <div style="min-width: 280px; padding: 12px;">
        <div style="background: #f9fafb; margin: -12px -12px 12px -12px; padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <h3 style="font-weight: bold; color: #1f2937; margin: 0;">${apartment.apartment_name || 'Unnamed Apartment'}</h3>
          <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">${apartment.room_type || 'N/A'}</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; margin-bottom: 8px;">
          <span style="color: #6b7280;">Price Range:</span>
          <span style="font-weight: 500; color: #1f2937;">
            ฿${apartment.price_min?.toLocaleString() || 'N/A'} - ฿${apartment.price_max?.toLocaleString() || 'N/A'}
          </span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; margin-bottom: 8px;">
          <span style="color: #6b7280;">Size:</span>
          <span style="font-weight: 500; color: #1f2937;">
            ${apartment.size_min || 'N/A'} - ${apartment.size_max || 'N/A'} sqm
          </span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; margin-bottom: 12px;">
          <span style="color: #6b7280;">Facility Score:</span>
          <span style="font-weight: 500; color: #1f2937;">${facilityScore.toFixed(0)}%</span>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
          <p style="font-size: 12px; font-weight: 500; color: #6b7280; margin: 0 0 8px 0;">Key Facilities:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${apartment.facility_parking ? '<span style="background: #dbeafe; color: #1e40af; font-size: 12px; padding: 2px 8px; border-radius: 4px;">Parking</span>' : ''}
            ${apartment.facility_wifi ? '<span style="background: #dcfce7; color: #166534; font-size: 12px; padding: 2px 8px; border-radius: 4px;">WiFi</span>' : ''}
            ${apartment.facility_aircondition ? '<span style="background: #f3e8ff; color: #7c2d12; font-size: 12px; padding: 2px 8px; border-radius: 4px;">AC</span>' : ''}
            ${apartment.facility_pool ? '<span style="background: #ecfeff; color: #0891b2; font-size: 12px; padding: 2px 8px; border-radius: 4px;">Pool</span>' : ''}
            ${apartment.facility_gym ? '<span style="background: #fed7aa; color: #ea580c; font-size: 12px; padding: 2px 8px; border-radius: 4px;">Gym</span>' : ''}
            ${apartment.facility_security ? '<span style="background: #fecaca; color: #dc2626; font-size: 12px; padding: 2px 8px; border-radius: 4px;">Security</span>' : ''}
          </div>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;">${apartment.address || 'Address not available'}</p>
          <button 
            onclick="window.showNearbyPlaces && window.showNearbyPlaces(${apartment.latitude}, ${apartment.longitude})" 
            style="font-size: 12px; background: #2563eb; color: white; padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer;"
          >
            Show What's Nearby
          </button>
        </div>
      </div>
    `;
  };

  // Update markers when data or filters change
  useEffect(() => {
    if (!mapRef.current || !apartmentData.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Filter apartment data
    const filteredData = apartmentData.filter(apartment => {
      // Price range filter
      if (filters.priceRange !== 'all') {
        const [minPrice, maxPrice] = filters.priceRange.split('-').map(Number);
        const apartmentPrice = apartment.price_min || 0;
        if (maxPrice && maxPrice !== 999999) {
          if (apartmentPrice < minPrice || apartmentPrice > maxPrice) return false;
        } else {
          if (apartmentPrice < minPrice) return false;
        }
      }

      // Room type filter
      if (filters.roomType !== 'all') {
        if (apartment.room_type !== filters.roomType) return false;
      }

      // Size filter
      if (filters.sizeRange !== 'all') {
        const [minSize, maxSize] = filters.sizeRange.split('-').map(Number);
        const apartmentSize = apartment.size_max || apartment.size_min || 0;
        if (maxSize && maxSize !== 999) {
          if (apartmentSize < minSize || apartmentSize > maxSize) return false;
        } else {
          if (apartmentSize < minSize) return false;
        }
      }

      // Facility score filter
      if (filters.facilities !== 'all') {
        const facilityScore = calculateFacilityScore(apartment);
        const [minScore, maxScore] = filters.facilities.split('-').map(Number);
        if (maxScore) {
          if (facilityScore < minScore || facilityScore > maxScore) return false;
        } else {
          if (facilityScore < minScore) return false;
        }
      }

      // Required facilities filter
      if (filters.requiredFacilities && filters.requiredFacilities.length > 0) {
        const facilityMap = {
          'parking': 'facility_parking',
          'wifi': 'facility_wifi',
          'pool': 'facility_pool',
          'gym': 'facility_gym',
          'security': 'facility_security',
          'elevator': 'facility_elevator'
        };

        for (const requiredFacility of filters.requiredFacilities) {
          const facilityKey = facilityMap[requiredFacility];
          if (!facilityKey || !apartment[facilityKey]) {
            return false;
          }
        }
      }

      return true;
    });

    // Add markers for filtered apartments
    filteredData.forEach(apartment => {
      if (!apartment.latitude || !apartment.longitude) return;

      const isSelected = selectedApartment && selectedApartment.apartment_id === apartment.apartment_id;
      const markerColor = getMarkerColor(apartment);

      // Create custom marker
      const marker = L.circleMarker([apartment.latitude, apartment.longitude], {
        radius: isSelected ? 12 : 8,
        fillColor: markerColor,
        color: isSelected ? '#000' : '#fff',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.8
      });

      marker.bindPopup(generatePopupContent(apartment));

      marker.on('click', () => {
        setSelectedApartment(apartment);
      });

      // Add hover effect for desktop
      if (!isMobile) {
        marker.on('mouseover', () => {
          marker.setStyle({
            radius: 10,
            weight: 3
          });
        });

        marker.on('mouseout', () => {
          marker.setStyle({
            radius: isSelected ? 12 : 8,
            weight: isSelected ? 3 : 2
          });
        });
      }

      marker.addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    // Fit map to markers if there are any
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [apartmentData, filters, colorScheme, selectedApartment, isMobile]);

  // Fetch nearby places using Overpass API
  const fetchNearbyPlaces = async (lat, lon, radius = 1000) => {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"^(restaurant|cafe|hospital|school|bank|pharmacy|supermarket|convenience|fuel)$"](around:${radius},${lat},${lon});
        node["shop"~"^(supermarket|convenience|mall|department_store)$"](around:${radius},${lat},${lon});
        node["public_transport"~"^(platform|station|stop_position)$"](around:${radius},${lat},${lon});
        node["railway"~"^(station|halt)$"](around:${radius},${lat},${lon});
      );
      out geom;
    `;

    try {
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      return [];
    }
  };

  // Show nearby places on map
  const showNearbyPlaces = async (lat, lon) => {
    if (!mapRef.current) return;

    setLoadingNearby(true);

    // Clear existing nearby layers
    Object.values(nearbyLayersRef.current).forEach(layer => {
      mapRef.current.removeLayer(layer);
    });
    nearbyLayersRef.current = {};

    try {
      const nearbyPlaces = await fetchNearbyPlaces(lat, lon);
      
      // Group places by category
      const categories = {
        food: { color: '#ff6b6b', icon: '🍽️', places: [] },
        shopping: { color: '#4ecdc4', icon: '🛒', places: [] },
        transport: { color: '#45b7d1', icon: '🚌', places: [] },
        healthcare: { color: '#96ceb4', icon: '🏥', places: [] },
        education: { color: '#feca57', icon: '🎓', places: [] },
        services: { color: '#ff9ff3', icon: '🏦', places: [] },
        other: { color: '#95a5a6', icon: '📍', places: [] }
      };

      nearbyPlaces.forEach(place => {
        const amenity = place.tags?.amenity;
        const shop = place.tags?.shop;
        const transport = place.tags?.public_transport || place.tags?.railway;

        let category = 'other';
        if (amenity && ['restaurant', 'cafe'].includes(amenity)) category = 'food';
        else if (amenity && ['hospital', 'pharmacy'].includes(amenity)) category = 'healthcare';
        else if (amenity && ['school'].includes(amenity)) category = 'education';
        else if (amenity && ['bank'].includes(amenity)) category = 'services';
        else if (shop || (amenity && ['supermarket', 'convenience'].includes(amenity))) category = 'shopping';
        else if (transport) category = 'transport';

        categories[category].places.push(place);
      });

      // Add markers for each category
      Object.entries(categories).forEach(([categoryName, categoryData]) => {
        if (categoryData.places.length === 0) return;

        const layerGroup = L.layerGroup();
        
        categoryData.places.forEach(place => {
          const marker = L.circleMarker([place.lat, place.lon], {
            radius: 6,
            fillColor: categoryData.color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          });

          const popupContent = `
            <div style="padding: 8px;">
              <h4 style="font-weight: 500; font-size: 14px; margin: 0 0 4px 0;">${place.tags?.name || 'Unnamed'}</h4>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">${place.tags?.amenity || place.tags?.shop || place.tags?.public_transport || 'Unknown type'}</p>
              ${place.tags?.cuisine ? `<p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">Cuisine: ${place.tags.cuisine}</p>` : ''}
              ${place.tags?.opening_hours ? `<p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">Hours: ${place.tags.opening_hours}</p>` : ''}
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.addTo(layerGroup);
        });

        nearbyLayersRef.current[categoryName] = layerGroup;
        layerGroup.addTo(mapRef.current);
      });

      setNearbyData(categories);

    } catch (error) {
      console.error('Error showing nearby places:', error);
    } finally {
      setLoadingNearby(false);
    }
  };

  // Clear nearby places
  const clearNearbyPlaces = () => {
    if (!mapRef.current) return;

    Object.values(nearbyLayersRef.current).forEach(layer => {
      mapRef.current.removeLayer(layer);
    });
    nearbyLayersRef.current = {};
    setNearbyData({});
  };

  // Expose functions to window for popup buttons
  useEffect(() => {
    window.showNearbyPlaces = showNearbyPlaces;
    window.clearNearbyPlaces = clearNearbyPlaces;
    
    return () => {
      window.showNearbyPlaces = null;
      window.clearNearbyPlaces = null;
    };
  }, []);

  // Filter apartment data based on current filters
  const getFilteredData = () => {
    return apartmentData.filter(apartment => {
      // Price range filter
      if (filters.priceRange !== 'all') {
        const [minPrice, maxPrice] = filters.priceRange.split('-').map(Number);
        const apartmentPrice = apartment.price_min || 0;
        if (maxPrice && maxPrice !== 999999) {
          if (apartmentPrice < minPrice || apartmentPrice > maxPrice) return false;
        } else {
          if (apartmentPrice < minPrice) return false;
        }
      }

      // Room type filter
      if (filters.roomType !== 'all') {
        if (apartment.room_type !== filters.roomType) return false;
      }

      // Size filter
      if (filters.sizeRange !== 'all') {
        const [minSize, maxSize] = filters.sizeRange.split('-').map(Number);
        const apartmentSize = apartment.size_max || apartment.size_min || 0;
        if (maxSize && maxSize !== 999) {
          if (apartmentSize < minSize || apartmentSize > maxSize) return false;
        } else {
          if (apartmentSize < minSize) return false;
        }
      }

      // Facility score filter
      if (filters.facilities !== 'all') {
        const facilityScore = calculateFacilityScore(apartment);
        const [minScore, maxScore] = filters.facilities.split('-').map(Number);
        if (maxScore) {
          if (facilityScore < minScore || facilityScore > maxScore) return false;
        } else {
          if (facilityScore < minScore) return false;
        }
      }

      // Required facilities filter
      if (filters.requiredFacilities && filters.requiredFacilities.length > 0) {
        const facilityMap = {
          'parking': 'facility_parking',
          'wifi': 'facility_wifi',
          'pool': 'facility_pool',
          'gym': 'facility_gym',
          'security': 'facility_security',
          'elevator': 'facility_elevator'
        };

        for (const requiredFacility of filters.requiredFacilities) {
          const facilityKey = facilityMap[requiredFacility];
          if (!facilityKey || !apartment[facilityKey]) {
            return false;
          }
        }
      }

      return true;
    });
  };

  const filteredData = getFilteredData();

  // Toggle filters visibility on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Apartment Supply Analysis</h1>
            <p className="text-gray-600 mt-2">
              สำรวจข้อมูลอพาร์ตเมนต์ พร้อมดูสิ่งที่อยู่ใกล้เคียงผ่าน OpenStreetMap
            </p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-gray-600">กำลังโหลดข้อมูลอพาร์ตเมนต์จาก CKAN API...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Apartment Supply Analysis</h1>
            <p className="text-gray-600 mt-2">
              สำรวจข้อมูลอพาร์ตเมนต์ พร้อมดูสิ่งที่อยู่ใกล้เคียงผ่าน OpenStreetMap
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
            <p className="text-sm mt-1">{error}</p>
            <div className="mt-4">
              <p className="text-sm">ตรวจสอบ:</p>
              <ul className="text-sm list-disc list-inside mt-1">
                <li>การเชื่อมต่ออินเทอร์เน็ต</li>
                <li>CKAN API Server (Resource ID: b6dbb8e0-1194-4eeb-945d-e883b3275b35)</li>
                <li>โครงสร้างข้อมูลในฐานข้อมูล</li>
              </ul>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Apartment Supply Analysis</h1>
          <p className="text-gray-600 mt-2">
            สำรวจข้อมูลอพาร์ตเมนต์ พร้อมดูสิ่งที่อยู่ใกล้เคียงผ่าน OpenStreetMap
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              แสดง {filteredData.length.toLocaleString()} จาก {apartmentData.length.toLocaleString()} อพาร์ตเมนต์
            </span>
            {loadingNearby && (
              <span className="text-blue-600 flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-t border-blue-600 mr-1"></div>
                กำลังโหลดสถานที่ใกล้เคียง...
              </span>
            )}
          </div>
        </div>

        {/* Mobile toggle button for filters */}
        {isMobile && (
          <div className="mb-4">
            <button 
              onClick={toggleFilters}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md shadow flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              {showFilters ? 'ซ่อนตัวกรอง' : 'แสดงตัวกรอง'}
            </button>
          </div>
        )}

        {/* Desktop layout - side by side */}
        {!isMobile && (
          <div className="flex flex-row gap-4">
            {/* Left sidebar - Filters and Statistics */}
            <div className="w-1/4 space-y-4">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-4">ตัวกรองข้อมูล</h2>
                
                <div className="space-y-4">
                  {/* Color Scheme Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">แสดงสีตาม</label>
                    <select 
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                      value={colorScheme}
                      onChange={(e) => setColorScheme(e.target.value)}
                    >
                      <option value="priceRange">ช่วงราคา</option>
                      <option value="roomType">ประเภทห้อง</option>
                      <option value="facilityScore">คะแนนสิ่งอำนวยความสะดวก</option>
                      <option value="size">ขนาดห้อง</option>
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ช่วงราคา (บาท/เดือน)</label>
                    <select 
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                      value={filters.priceRange}
                      onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                    >
                      <option value="all">ทุกช่วงราคา</option>
                      <option value="0-5000">ต่ำกว่า 5,000 บาท</option>
                      <option value="5000-10000">5,000 - 10,000 บาท</option>
                      <option value="10000-20000">10,000 - 20,000 บาท</option>
                      <option value="20000-30000">20,000 - 30,000 บาท</option>
                      <option value="30000-999999">มากกว่า 30,000 บาท</option>
                    </select>
                  </div>

                  {/* Room Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ประเภทห้อง</label>
                    <select 
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                      value={filters.roomType}
                      onChange={(e) => setFilters({...filters, roomType: e.target.value})}
                    >
                      <option value="all">ทุกประเภท</option>
                      {[...new Set(apartmentData.map(apt => apt.room_type).filter(Boolean))].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Size Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ขนาดห้อง (ตร.ม.)</label>
                    <select 
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                      value={filters.sizeRange}
                      onChange={(e) => setFilters({...filters, sizeRange: e.target.value})}
                    >
                      <option value="all">ทุกขนาด</option>
                      <option value="0-30">น้อยกว่า 30 ตร.ม.</option>
                      <option value="30-50">30-50 ตร.ม.</option>
                      <option value="50-80">50-80 ตร.ม.</option>
                      <option value="80-120">80-120 ตร.ม.</option>
                      <option value="120-999">มากกว่า 120 ตร.ม.</option>
                    </select>
                  </div>

                  {/* Facility Score Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">คะแนนสิ่งอำนวยความสะดวก</label>
                    <select 
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                      value={filters.facilities}
                      onChange={(e) => setFilters({...filters, facilities: e.target.value})}
                    >
                      <option value="all">ทุกระดับ</option>
                      <option value="80-100">ดีเยี่ยม (80-100%)</option>
                      <option value="60-79">ดี (60-79%)</option>
                      <option value="40-59">ปานกลาง (40-59%)</option>
                      <option value="0-39">พื้นฐาน (0-39%)</option>
                    </select>
                  </div>

                  {/* Required Facilities Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">สิ่งอำนวยความสะดวกที่ต้องการ</label>
                    <div className="space-y-2">
                      {[
                        {key: 'parking', label: 'ที่จอดรถ'},
                        {key: 'wifi', label: 'WiFi'},
                        {key: 'pool', label: 'สระว่ายน้ำ'},
                        {key: 'gym', label: 'ฟิตเนส'},
                        {key: 'security', label: 'รักษาความปลอดภัย'},
                        {key: 'elevator', label: 'ลิฟต์'}
                      ].map(facility => (
                        <label key={facility.key} className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={filters.requiredFacilities?.includes(facility.key) || false}
                            onChange={(e) => {
                              const required = filters.requiredFacilities || [];
                              if (e.target.checked) {
                                setFilters({
                                  ...filters, 
                                  requiredFacilities: [...required, facility.key]
                                });
                              } else {
                                setFilters({
                                  ...filters, 
                                  requiredFacilities: required.filter(f => f !== facility.key)
                                });
                              }
                            }}
                          />
                          <span className="ml-2 text-sm text-gray-700">{facility.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setFilters({
                          priceRange: 'all',
                          roomType: 'all',
                          sizeRange: 'all',
                          facilities: 'all',
                          requiredFacilities: []
                        });
                        setColorScheme('priceRange');
                      }}
                      className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-4">สถิติ</h2>
                <div className="space-y-4">
                  {/* Overall Statistics */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">ภาพรวมอพาร์ตเมนต์</h3>
                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">จำนวนอพาร์ตเมนต์ทั้งหมด:</span>
                        <span className="block text-lg font-medium">
                          {stats.totalApartments.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">ราคาเฉลี่ย:</span>
                        <span className="block text-lg font-medium">
                          ฿{stats.averagePrice.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">ขนาดเฉลี่ย:</span>
                        <span className="block text-lg font-medium">
                          {stats.averageSize.toFixed(1)} ตร.ม.
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">คะแนนสิ่งอำนวยความสะดวกเฉลี่ย:</span>
                        <span className="block text-lg font-medium">
                          {stats.averageFacilityScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Room Types Distribution */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">ประเภทห้อง</h3>
                    <div className="mt-2 space-y-2">
                      {Object.entries(stats.roomTypes)
                        .sort(([,a], [,b]) => b - a)
                        .map(([type, count]) => (
                          <div key={type} className="flex justify-between items-baseline">
                            <span className="text-sm text-gray-500">{type === '' ? 'ไม่มีข้อมูล' : type}:</span>
                            <div className="text-right">
                              <span className="text-base font-medium">
                                {count.toLocaleString()}
                              </span>
                              <span className="text-sm text-gray-500 ml-1">
                                ({((count / stats.totalApartments) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Popular Facilities */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">สิ่งอำนวยความสะดวกยอดนิยม</h3>
                    <div className="mt-2 space-y-2">
                      {Object.entries(stats.popularFacilities)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 6)
                        .map(([facility, percentage]) => {
                          const facilityNames = {
                            facility_parking: 'ที่จอดรถ',
                            facility_wifi: 'WiFi',
                            facility_aircondition: 'เครื่องปรับอากาศ',
                            facility_security: 'รักษาความปลอดภัย',
                            facility_elevator: 'ลิฟต์',
                            facility_cctv: 'กล้องวงจรปิด',
                            facility_pool: 'สระว่ายน้ำ',
                            facility_gym: 'ฟิตเนส'
                          };
                          
                          return (
                            <div key={facility} className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                {facilityNames[facility] || facility.replace('facility_', '')}:
                              </span>
                              <span className="text-sm font-medium text-blue-600">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nearby Places Legend */}
              {Object.keys(nearbyData).length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-800">สถานที่ใกล้เคียง</h3>
                    <button 
                      onClick={clearNearbyPlaces}
                      className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                    >
                      ล้าง
                    </button>
                  </div>
                  {Object.entries(nearbyData)
                    .filter(([_, data]) => data.places.length > 0)
                    .map(([name, data]) => (
                      <div key={name} className="flex items-center mb-1">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: data.color }}
                        ></div>
                        <span className="text-xs">
                          {data.icon} {name.charAt(0).toUpperCase() + name.slice(1)} ({data.places.length})
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            {/* Right side - Map */}
            <div className="w-3/4" style={{ height: "calc(100vh - 120px)" }}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden relative h-full">
                <div 
                  ref={mapContainerRef}
                  className="w-full h-full"
                  style={{ minHeight: "400px" }}
                />
                <div className="absolute bottom-0 right-0 bg-white bg-opacity-75 px-2 py-1 text-xs text-gray-600">
                  © OpenStreetMap contributors
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile layout - stacked */}
        {isMobile && (
          <div className="flex flex-col gap-4">
            {/* Filters - conditionally shown */}
            {showFilters && (
              <div className="w-full bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-4">ตัวกรองข้อมูล</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ราคา</label>
                    <select 
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                      value={filters.priceRange}
                      onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                    >
                      <option value="all">ทุกราคา</option>
                      <option value="0-5000">5,000 บาท</option>
                      <option value="5000-10000">5,000-10,000 บาท</option>
                      <option value="10000-20000">10,000-20,000 บาท</option>
                      <option value="20000-999999">มากกว่า 20,000 บาท</option>
                    </select>
                  </div>

                  {/* Room Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ประเภท</label>
                    <select 
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                      value={filters.roomType}
                      onChange={(e) => setFilters({...filters, roomType: e.target.value})}
                    >
                      <option value="all">ทุกประเภท</option>
                      {[...new Set(apartmentData.map(apt => apt.room_type).filter(Boolean))].slice(0, 5).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Map - always shown */}
            <div className="w-full h-[60vh]">
              <div className="bg-white rounded-lg shadow-md overflow-hidden relative h-full">
                <div 
                  ref={mapContainerRef}
                  className="w-full h-full"
                />
                <div className="absolute bottom-0 right-0 bg-white bg-opacity-75 px-2 py-1 text-xs text-gray-600">
                  © OpenStreetMap contributors
                </div>
              </div>
            </div>
            
            {/* Statistics - always shown on mobile */}
            <div className="w-full bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">สถิติ</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalApartments}</div>
                  <div className="text-sm text-gray-500">อพาร์ตเมนต์</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">฿{Math.round(stats.averagePrice).toLocaleString()}</div>
                  <div className="text-sm text-gray-500">ราคาเฉลี่ย</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Apartment Details Modal */}
        {selectedApartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedApartment.apartment_name || `Apartment ${selectedApartment.apartment_id}`}
                  </h2>
                  <button 
                    onClick={() => setSelectedApartment(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Room Type:</strong> {selectedApartment.room_type || 'N/A'}</p>
                      <p><strong>Size:</strong> {selectedApartment.size_min || 'N/A'} - {selectedApartment.size_max || 'N/A'} sqm</p>
                      <p><strong>Price:</strong> ฿{(selectedApartment.price_min || 0).toLocaleString()} - ฿{(selectedApartment.price_max || 0).toLocaleString()}</p>
                      <p><strong>Address:</strong> {selectedApartment.address || 'N/A'}</p>
                      <p><strong>Coordinates:</strong> {selectedApartment.latitude?.toFixed(6) || 'N/A'}, {selectedApartment.longitude?.toFixed(6) || 'N/A'}</p>
                      <p><strong>Facility Score:</strong> {calculateFacilityScore(selectedApartment).toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Facilities</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedApartment)
                        .filter(([key, value]) => key.startsWith('facility_') && value > 0)
                        .map(([key, value]) => {
                          const facilityNames = {
                            facility_parking: 'ที่จอดรถ',
                            facility_wifi: 'WiFi',
                            facility_aircondition: 'แอร์',
                            facility_security: 'รปภ.',
                            facility_elevator: 'ลิฟต์',
                            facility_pool: 'สระ',
                            facility_gym: 'ฟิตเนส',
                            facility_cctv: 'CCTV'
                          };
                          
                          return (
                            <div key={key} className="flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              {facilityNames[key] || key.replace('facility_', '')}
                            </div>
                          );
                        })}
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          showNearbyPlaces(selectedApartment.latitude, selectedApartment.longitude);
                          setSelectedApartment(null);
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled={loadingNearby}
                      >
                        {loadingNearby ? 'Loading...' : 'Show What\'s Nearby'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentSupply;
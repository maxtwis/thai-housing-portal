import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Overpass API queries for different categories - IMPROVED VERSION
const OVERPASS_QUERIES = {
  schools: (lat, lon, radius = 1000) => `
    [out:json][timeout:25];
    (
      node["amenity"="school"](around:${radius},${lat},${lon});
      node["amenity"="university"](around:${radius},${lat},${lon});
      node["amenity"="kindergarten"](around:${radius},${lat},${lon});
      node["amenity"="college"](around:${radius},${lat},${lon});
      way["amenity"="school"](around:${radius},${lat},${lon});
      way["amenity"="university"](around:${radius},${lat},${lon});
      relation["amenity"="school"](around:${radius},${lat},${lon});
      relation["amenity"="university"](around:${radius},${lat},${lon});
    );
    out geom;
  `,
  shopping: (lat, lon, radius = 1000) => `
    [out:json][timeout:25];
    (
      node["shop"](around:${radius},${lat},${lon});
      node["shop"="supermarket"](around:${radius},${lat},${lon});
      node["shop"="convenience"](around:${radius},${lat},${lon});
      node["shop"="mall"](around:${radius},${lat},${lon});
      node["shop"="department_store"](around:${radius},${lat},${lon});
      node["shop"="general"](around:${radius},${lat},${lon});
      node["amenity"="marketplace"](around:${radius},${lat},${lon});
      node["brand"="7-Eleven"](around:${radius},${lat},${lon});
      node["brand"="Family Mart"](around:${radius},${lat},${lon});
      node["brand"="Lotus"](around:${radius},${lat},${lon});
      node["brand"="Big C"](around:${radius},${lat},${lon});
      node["brand"="Tesco Lotus"](around:${radius},${lat},${lon});
      way["shop"](around:${radius},${lat},${lon});
      way["amenity"="marketplace"](around:${radius},${lat},${lon});
      relation["shop"](around:${radius},${lat},${lon});
    );
    out geom;
  `,
  healthcare: (lat, lon, radius = 1000) => `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lon});
      node["amenity"="clinic"](around:${radius},${lat},${lon});
      node["amenity"="pharmacy"](around:${radius},${lat},${lon});
      node["amenity"="dentist"](around:${radius},${lat},${lon});
      node["amenity"="doctors"](around:${radius},${lat},${lon});
      node["amenity"="veterinary"](around:${radius},${lat},${lon});
      node["healthcare"](around:${radius},${lat},${lon});
      node["shop"="pharmacy"](around:${radius},${lat},${lon});
      way["amenity"="hospital"](around:${radius},${lat},${lon});
      way["amenity"="clinic"](around:${radius},${lat},${lon});
      way["healthcare"](around:${radius},${lat},${lon});
      relation["amenity"="hospital"](around:${radius},${lat},${lon});
    );
    out geom;
  `,
  food: (lat, lon, radius = 1000) => `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](around:${radius},${lat},${lon});
      node["amenity"="cafe"](around:${radius},${lat},${lon});
      node["amenity"="fast_food"](around:${radius},${lat},${lon});
      node["amenity"="bar"](around:${radius},${lat},${lon});
      node["amenity"="pub"](around:${radius},${lat},${lon});
      node["amenity"="food_court"](around:${radius},${lat},${lon});
      node["amenity"="ice_cream"](around:${radius},${lat},${lon});
      node["shop"="bakery"](around:${radius},${lat},${lon});
      node["cuisine"](around:${radius},${lat},${lon});
      node["brand"="McDonald's"](around:${radius},${lat},${lon});
      node["brand"="KFC"](around:${radius},${lat},${lon});
      node["brand"="Starbucks"](around:${radius},${lat},${lon});
      node["brand"="Pizza Hut"](around:${radius},${lat},${lon});
      way["amenity"="restaurant"](around:${radius},${lat},${lon});
      way["amenity"="cafe"](around:${radius},${lat},${lon});
      relation["amenity"="restaurant"](around:${radius},${lat},${lon});
    );
    out geom;
  `,
  parks: (lat, lon, radius = 1000) => `
    [out:json][timeout:25];
    (
      node["leisure"="park"](around:${radius},${lat},${lon});
      node["leisure"="garden"](around:${radius},${lat},${lon});
      node["leisure"="recreation_ground"](around:${radius},${lat},${lon});
      node["leisure"="playground"](around:${radius},${lat},${lon});
      node["amenity"="playground"](around:${radius},${lat},${lon});
      node["natural"="tree"](around:${radius},${lat},${lon});
      node["landuse"="recreation_ground"](around:${radius},${lat},${lon});
      way["leisure"="park"](around:${radius},${lat},${lon});
      way["leisure"="garden"](around:${radius},${lat},${lon});
      way["landuse"="recreation_ground"](around:${radius},${lat},${lon});
      relation["leisure"="park"](around:${radius},${lat},${lon});
    );
    out geom;
  `,
  transport: (lat, lon, radius = 1000) => `
    [out:json][timeout:25];
    (
      node["public_transport"="station"](around:${radius},${lat},${lon});
      node["public_transport"="stop_position"](around:${radius},${lat},${lon});
      node["public_transport"="platform"](around:${radius},${lat},${lon});
      node["amenity"="bus_station"](around:${radius},${lat},${lon});
      node["highway"="bus_stop"](around:${radius},${lat},${lon});
      node["railway"="station"](around:${radius},${lat},${lon});
      node["railway"="subway_entrance"](around:${radius},${lat},${lon});
      node["amenity"="taxi"](around:${radius},${lat},${lon});
      node["amenity"="fuel"](around:${radius},${lat},${lon});
      way["public_transport"="station"](around:${radius},${lat},${lon});
      way["amenity"="bus_station"](around:${radius},${lat},${lon});
      relation["public_transport"="stop_area"](around:${radius},${lat},${lon});
    );
    out geom;
  `,
  worship: (lat, lon, radius = 1000) => `
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"](around:${radius},${lat},${lon});
      node["building"="temple"](around:${radius},${lat},${lon});
      node["building"="church"](around:${radius},${lat},${lon});
      node["building"="mosque"](around:${radius},${lat},${lon});
      node["religion"](around:${radius},${lat},${lon});
      way["amenity"="place_of_worship"](around:${radius},${lat},${lon});
      way["building"="temple"](around:${radius},${lat},${lon});
      way["building"="church"](around:${radius},${lat},${lon});
      relation["amenity"="place_of_worship"](around:${radius},${lat},${lon});
    );
    out geom;
  `
};

// Category configurations
const CATEGORIES = {
  schools: { 
    name: 'Schools', 
    color: '#4285F4', 
    icon: '🏫',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300'
  },
  shopping: { 
    name: 'Shopping', 
    color: '#EA4335', 
    icon: '🛒',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300'
  },
  healthcare: { 
    name: 'Healthcare', 
    color: '#34A853', 
    icon: '🏥',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300'
  },
  food: { 
    name: 'Food & Drink', 
    color: '#FBBC04', 
    icon: '🍽️',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300'
  },
  parks: { 
    name: 'Parks', 
    color: '#0F9D58', 
    icon: '🌳',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300'
  },
  transport: { 
    name: 'Transport', 
    color: '#9C27B0', 
    icon: '🚌',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300'
  },
  worship: { 
    name: 'Places of Worship', 
    color: '#FF5722', 
    icon: '⛪',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300'
  }
};

const StockMap = ({ filters, colorScheme = 'buildingType', isMobile }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const buildingLayerRef = useRef(null);
  const legendRef = useRef(null);
  const poiLayersRef = useRef({});
  const searchMarkerRef = useRef(null);
  
  const [activeCategories, setActiveCategories] = useState(['schools', 'healthcare']);
  const [nearbyData, setNearbyData] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchCenter, setSearchCenter] = useState(null);
  const [showNearbyPanel, setShowNearbyPanel] = useState(true);
  const [searchRadius, setSearchRadius] = useState(1000);

  // Function to validate and possibly transform coordinates
  const validateAndTransformCoords = (lat, lng) => {
    // Check if coordinates are in Thailand's expected range
    const isValidThaiCoords = (
      lat >= 5.0 && lat <= 21.0 &&  // Thailand latitude range
      lng >= 97.0 && lng <= 106.0    // Thailand longitude range
    );
    
    if (isValidThaiCoords) {
      return { lat, lng, transformed: false };
    }
    
    // Check if coordinates might be swapped
    const isSwappedValid = (
      lng >= 5.0 && lng <= 21.0 &&
      lat >= 97.0 && lat <= 106.0
    );
    
    if (isSwappedValid) {
      console.warn('Coordinates appear to be swapped, correcting:', { original: { lat, lng }, corrected: { lat: lng, lng: lat } });
      return { lat: lng, lng: lat, transformed: true };
    }
    
    // Check if coordinates are in projected system (need transformation)
    // Common Thai projected coordinates are much larger numbers
    if (Math.abs(lat) > 1000000 || Math.abs(lng) > 1000000) {
      console.warn('Coordinates appear to be in projected system, cannot auto-transform:', { lat, lng });
      return null;
    }
    
    console.warn('Invalid coordinates detected:', { lat, lng });
    return null;
  };

  // Dynamic height calculation based on viewport
  const getMapHeight = () => {
    if (isMobile) {
      return "60vh";
    } else {
      return "calc(100vh - 150px)";
    }
  };

  // Function to query Overpass API with better debugging
  const queryOverpass = async (query) => {
    try {
      console.log('🔍 Overpass Query:', query.substring(0, 200) + '...');
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: query
      });
      
      if (!response.ok) {
        console.error('❌ Overpass API HTTP Error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Overpass API Response:', {
        elements: data.elements?.length || 0,
        generator: data.generator,
        timestamp: data.osm3s?.timestamp_osm_base
      });
      
      return data.elements || [];
    } catch (error) {
      console.error('❌ Overpass API Error:', error);
      throw error;
    }
  };

  // Function to create custom markers for POIs
  const createPOIMarker = (category, size = 24) => {
    const config = CATEGORIES[category];
    return L.divIcon({
      className: 'poi-marker',
      html: `<div style="
        background-color: ${config.color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        font-size: ${size * 0.6}px;
        cursor: pointer;
      ">${config.icon}</div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  // Function to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Function to format distance
  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  // Function to get POI name with better fallbacks
  const getPOIName = (poi) => {
    // Try different name fields in order of preference
    const nameFields = [
      'name:en',    // English name
      'name:th',    // Thai name
      'name',       // Default name
      'brand',      // Brand name (e.g., 7-Eleven)
      'operator',   // Operator name
      'shop',       // Shop type
      'amenity',    // Amenity type
      'cuisine',    // Cuisine type for restaurants
      'healthcare', // Healthcare type
      'leisure',    // Leisure type
      'building'    // Building type
    ];
    
    for (const field of nameFields) {
      if (poi.tags?.[field]) {
        return poi.tags[field];
      }
    }
    
    // If no name found, create descriptive name from tags
    if (poi.tags) {
      if (poi.tags.shop) return `${poi.tags.shop} shop`;
      if (poi.tags.amenity) return poi.tags.amenity;
      if (poi.tags.building) return `${poi.tags.building} building`;
    }
    
    return 'Unknown Place';
  };

  // Function to get POI address
  const getPOIAddress = (poi) => {
    const tags = poi.tags || {};
    const addressParts = [];
    
    if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
    if (tags['addr:street']) addressParts.push(tags['addr:street']);
    if (tags['addr:district']) addressParts.push(tags['addr:district']);
    if (tags['addr:city']) addressParts.push(tags['addr:city']);
    
    return addressParts.length > 0 ? addressParts.join(', ') : null;
  };

  // Function to fetch nearby places
  const fetchNearbyPlaces = async (lat, lon, categories = activeCategories, radius = searchRadius) => {
    if (categories.length === 0) return;
    
    setLoading(true);
    const results = {};
    const errors = [];

    try {
      for (const category of categories) {
        if (OVERPASS_QUERIES[category]) {
          try {
            const query = OVERPASS_QUERIES[category](lat, lon, radius);
            const elements = await queryOverpass(query);
            results[category] = elements.filter(element => element.lat && element.lon);
            
            // Add small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.error(`Error fetching ${category}:`, error);
            errors.push(category);
            results[category] = [];
          }
        }
      }
      
      setNearbyData(results);
      displayPOIs(results, lat, lon);
      
      if (errors.length > 0) {
        console.warn('Failed to fetch data for categories:', errors);
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to display POIs on map
  const displayPOIs = (data, centerLat, centerLon) => {
    if (!mapRef.current) return;

    // Clear existing POI layers
    Object.values(poiLayersRef.current).forEach(layer => {
      if (mapRef.current.hasLayer(layer)) {
        mapRef.current.removeLayer(layer);
      }
    });
    poiLayersRef.current = {};

    // Add new POI layers
    Object.entries(data).forEach(([category, pois]) => {
      if (activeCategories.includes(category) && pois.length > 0) {
        const layerGroup = L.layerGroup();
        
        pois.forEach((poi, index) => {
          const lat = poi.lat;
          const lon = poi.lon;
          
          if (lat && lon) {
            const distance = calculateDistance(centerLat, centerLon, lat, lon);
            const marker = L.marker([lat, lon], {
              icon: createPOIMarker(category, 28)
            });
            
            // Create popup content
            const name = getPOIName(poi);
            const address = getPOIAddress(poi);
            const category_display = CATEGORIES[category].name;
            
            const popupContent = `
              <div style="min-width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 20px; margin-right: 8px;">${CATEGORIES[category].icon}</span>
                  <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${CATEGORIES[category].color};">
                    ${name}
                  </h3>
                </div>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666; font-weight: 500;">
                  ${category_display}
                </p>
                ${address ? `<p style="margin: 0 0 4px 0; font-size: 11px; color: #888; line-height: 1.3;">${address}</p>` : ''}
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                  <p style="margin: 0; font-size: 11px; color: #999; display: flex; align-items: center;">
                    <span style="margin-right: 4px;">📍</span>
                    Distance: <strong style="margin-left: 4px; color: ${CATEGORIES[category].color};">${formatDistance(distance)}</strong>
                  </p>
                </div>
                ${poi.tags?.phone ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">📞 ${poi.tags.phone}</p>` : ''}
                ${poi.tags?.website ? `<p style="margin: 4px 0 0 0; font-size: 11px;"><a href="${poi.tags.website}" target="_blank" style="color: ${CATEGORIES[category].color};">🌐 Website</a></p>` : ''}
              </div>
            `;
            
            marker.bindPopup(popupContent, {
              maxWidth: 300,
              className: 'poi-popup'
            });
            
            // Add hover effect
            marker.on('mouseover', function() {
              this.openPopup();
            });
            
            layerGroup.addLayer(marker);
          }
        });
        
        poiLayersRef.current[category] = layerGroup;
        layerGroup.addTo(mapRef.current);
      }
    });
  };

  // Handle category toggle
  const toggleCategory = (category) => {
    const newCategories = activeCategories.includes(category)
      ? activeCategories.filter(c => c !== category)
      : [...activeCategories, category];
    
    setActiveCategories(newCategories);
    
    if (searchCenter && newCategories.length > 0) {
      fetchNearbyPlaces(searchCenter.lat, searchCenter.lng, newCategories);
    } else if (newCategories.length === 0) {
      // Clear all POI layers if no categories selected
      Object.values(poiLayersRef.current).forEach(layer => {
        if (mapRef.current && mapRef.current.hasLayer(layer)) {
          mapRef.current.removeLayer(layer);
        }
      });
      poiLayersRef.current = {};
      setNearbyData({});
    }
  };

  // Handle search radius change
  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius);
    if (searchCenter && activeCategories.length > 0) {
      fetchNearbyPlaces(searchCenter.lat, searchCenter.lng, activeCategories, newRadius);
    }
  };

  // Clear search
  const clearSearch = () => {
    if (mapRef.current) {
      // Remove search marker
      if (searchMarkerRef.current) {
        mapRef.current.removeLayer(searchMarkerRef.current);
        searchMarkerRef.current = null;
      }
      
      // Clear POI layers
      Object.values(poiLayersRef.current).forEach(layer => {
        if (mapRef.current.hasLayer(layer)) {
          mapRef.current.removeLayer(layer);
        }
      });
      poiLayersRef.current = {};
    }
    
    setSearchCenter(null);
    setNearbyData({});
  };

  // Building popup content generation (your existing function)
  const generatePopupContent = (feature, colorScheme) => {
    return `
      <div class="p-3 min-w-[240px]">
        <div class="bg-gray-50 -m-3 p-3 mb-3 border-b">
          <h3 class="font-bold text-gray-800">
            ${feature.HOUSENUMBER ? `เลขที่ ${feature.HOUSENUMBER}` : 'ไม่มีข้อมูลเลขที่อาคาร'}
          </h3>
          <p class="text-sm text-gray-600 mt-1">
            ${feature.TP_build || 'ไม่มีข้อมูลประเภทอาคาร'}
          </p>
        </div>
        
        <div class="space-y-2">
          <div class="flex justify-between items-baseline text-sm">
            <span class="text-gray-600">จำนวนชั้น</span>
            <span class="font-medium text-gray-800">${feature.STOREY ? `${feature.STOREY} ชั้น` : '-'}</span>
          </div>

          ${feature.TP_build === 'ที่อยู่อาศัย' ? `
            <div class="flex justify-between items-baseline text-sm">
              <span class="text-gray-600">พื้นที่</span>
              <span class="font-medium text-gray-800">${feature.AREA ? `${feature.AREA.toFixed(1)} ตร.ม.` : '-'}</span>
            </div>

            <div class="flex justify-between items-baseline text-sm">
              <span class="text-gray-600">จำนวนสมาชิก</span>
              <span class="font-medium text-gray-800">${feature.Household_member_total ? `${feature.Household_member_total} คน` : '-'}</span>
            </div>

            <div class="flex justify-between items-baseline text-sm">
              <span class="text-gray-600">ค่าเช่า</span>
              <span class="font-medium text-gray-800">
                ${feature.House_rentcost ? `฿${feature.House_rentcost.toLocaleString()}/เดือน` : '-'}
              </span>
            </div>

            ${colorScheme === 'transportAccess' || colorScheme === 'healthAccess' ? `
              <div class="border-t border-gray-200 mt-3 pt-3">
                ${colorScheme === 'transportAccess' ? `
                  <div class="flex justify-between items-baseline text-sm">
                    <span class="text-gray-600">ระยะทางถึงระบบขนส่ง</span>
                    <span class="font-medium text-gray-800">
                      ${Math.min(
                        feature.Facility_transportation || 999,
                        feature.Facility_metro || 999,
                        feature.Facility_busstop || 999
                      ).toFixed(2)} กม.
                    </span>
                  </div>
                ` : ''}

                ${colorScheme === 'healthAccess' ? `
                  <div class="flex justify-between items-baseline text-sm">
                    <span class="text-gray-600">ระยะทางถึงสถานพยาบาล</span>
                    <span class="font-medium text-gray-800">
                      ${Math.min(
                        feature.Facility_hospital || 999,
                        feature.Facility_healthcenter || 999,
                        feature.Facility_pharmarcy || 999
                      ).toFixed(2)} กม.
                    </span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          ` : ''}
          
          <div class="border-t border-gray-200 mt-3 pt-3">
            <button onclick="
              try {
                if (window.searchNearbyFromBuilding) {
                  window.searchNearbyFromBuilding();
                } else if (window.handleNearbySearchFromBuilding && window.currentBuildingCoords) {
                  window.handleNearbySearchFromBuilding(window.currentBuildingCoords);
                } else {
                  alert('Nearby search function not available. Please try clicking directly on the map.');
                }
              } catch (error) {
                console.error('Error in nearby search:', error);
                alert('Error occurred while searching nearby places. Please try again.');
              }
            " 
            class="w-full bg-blue-600 text-white text-sm py-1 px-2 rounded hover:bg-blue-700">
              🔍 What's nearby?
            </button>
          </div>
        </div>
      </div>
    `;
  };

  // Color schemes for different attributes (your existing function)
  const getColor = (feature) => {
    const schemes = {
      buildingType: () => {
        const buildingType = feature.TP_build || '';
        const colorMap = {
          'ที่อยู่อาศัย': '#ff7f0e',
          'พาณิชยกรรม': '#1f77b4',
          'ที่อยู่อาศัยกึ่งพาณิชยกรรม': '#2ca02c',
          'อุตสาหกรรม': '#d62728',
          'สาธารณูปโภค สาธารณูปการ': '#9467bd',
          'สถาบันการศึกษา': '#8c564b',
          'สถาบันศาสนา': '#e377c2',
          'สถาบันราชการและการสาธารณสุข': '#7f7f7f',
          'นันทนาการ': '#bcbd22'
        };
        return colorMap[buildingType] || '#808080';
      },
      transportAccess: () => {
        if (feature.TP_build !== 'ที่อยู่อาศัย') return '#808080';
        const distance = Math.min(
          feature.Facility_transportation || 999,
          feature.Facility_metro || 999,
          feature.Facility_busstop || 999
        );
        if (distance <= 0.5) return '#fef0d9';
        if (distance <= 1) return '#fdbb84';
        if (distance <= 1.5) return '#fc8d59';
        if (distance <= 2) return '#ef6548';
        return '#67000d';
      },
      healthAccess: () => {
        if (feature.TP_build !== 'ที่อยู่อาศัย') return '#808080';
        const distance = Math.min(
          feature.Facility_hospital || 999,
          feature.Facility_healthcenter || 999,
          feature.Facility_pharmarcy || 999
        );
        if (distance <= 1) return '#fef0d9';
        if (distance <= 2) return '#fdbb84';
        if (distance <= 3) return '#fc8d59';
        if (distance <= 4) return '#ef6548';
        return '#67000d';
      },
      householdSize: () => {
        if (feature.TP_build !== 'ที่อยู่อาศัย') return '#808080';
        const size = feature.Household_member_total || 0;
        if (size <= 1) return '#f7fbff';
        if (size <= 2) return '#deebf7';
        if (size <= 3) return '#c6dbef';
        if (size <= 4) return '#9ecae1';
        if (size <= 5) return '#6baed6';
        if (size <= 6) return '#4292c6';
        if (size <= 7) return '#2171b5';
        return '#084594';
      },
      rentCost: () => {
        if (feature.TP_build !== 'ที่อยู่อาศัย') return '#808080';
        const cost = feature.House_rentcost || 0;
        if (cost < 5000) return '#ffffd4';
        if (cost < 10000) return '#fee391';
        if (cost < 15000) return '#fec44f';
        if (cost < 20000) return '#fe9929';
        if (cost < 25000) return '#ec7014';
        if (cost < 30000) return '#cc4c02';
        return '#8c2d04';
      }
    };
    
    return schemes[colorScheme] ? schemes[colorScheme]() : schemes.buildingType();
  };

  // Legend items for each color scheme (your existing function)
  const getLegendItems = () => {
    const items = {
      buildingType: [
        { color: '#ff7f0e', label: 'ที่อยู่อาศัย' },
        { color: '#1f77b4', label: 'พาณิชยกรรม' },
        { color: '#2ca02c', label: 'ที่อยู่อาศัยกึ่งพาณิชยกรรม' },
        { color: '#d62728', label: 'อุตสาหกรรม' },
        { color: '#9467bd', label: 'สาธารณูปโภค สาธารณูปการ' },
        { color: '#8c564b', label: 'สถาบันการศึกษา' },
        { color: '#e377c2', label: 'สถาบันศาสนา' },
        { color: '#7f7f7f', label: 'สถาบันราชการและการสาธารณสุข' },
        { color: '#bcbd22', label: 'นันทนาการ' },
        { color: '#808080', label: 'ไม่มีข้อมูล' }
      ],
      transportAccess: [
        { color: '#fef0d9', label: '< 250m (ที่อยู่อาศัย)' },
        { color: '#fdbb84', label: '250-500m (ที่อยู่อาศัย)' },
        { color: '#fc8d59', label: '500m-1km (ที่อยู่อาศัย)' },
        { color: '#ef6548', label: '1-2km (ที่อยู่อาศัย)' },
        { color: '#67000d', label: '> 2km (ที่อยู่อาศัย)' },
        { color: '#808080', label: 'อาคารประเภทอื่นๆ' }
      ],
      healthAccess: [
        { color: '#fef0d9', label: '< 1km (ที่อยู่อาศัย)' },
        { color: '#fdbb84', label: '1-2km (ที่อยู่อาศัย)' },
        { color: '#fc8d59', label: '2-3km (ที่อยู่อาศัย)' },
        { color: '#ef6548', label: '3-4km (ที่อยู่อาศัย)' },
        { color: '#67000d', label: '> 4km (ที่อยู่อาศัย)' },
        { color: '#808080', label: 'อาคารประเภทอื่นๆ' }
      ],
      householdSize: [
        { color: '#f7fbff', label: '1 คน (ที่อยู่อาศัย)' },
        { color: '#deebf7', label: '2 คน (ที่อยู่อาศัย)' },
        { color: '#c6dbef', label: '3 คน (ที่อยู่อาศัย)' },
        { color: '#9ecae1', label: '4 คน (ที่อยู่อาศัย)' },
        { color: '#6baed6', label: '5 คน (ที่อยู่อาศัย)' },
        { color: '#4292c6', label: '6 คน (ที่อยู่อาศัย)' },
        { color: '#2171b5', label: '7 คน (ที่อยู่อาศัย)' },
        { color: '#084594', label: '8+ คน (ที่อยู่อาศัย)' },
        { color: '#808080', label: 'อาคารประเภทอื่นๆ' }
      ],
      rentCost: [
        { color: '#ffffd4', label: '< ฿5,000 (ที่อยู่อาศัย)' },
        { color: '#fee391', label: '฿5,000-10,000 (ที่อยู่อาศัย)' },
        { color: '#fec44f', label: '฿10,000-15,000 (ที่อยู่อาศัย)' },
        { color: '#fe9929', label: '฿15,000-20,000 (ที่อยู่อาศัย)' },
        { color: '#ec7014', label: '฿20,000-25,000 (ที่อยู่อาศัย)' },
        { color: '#cc4c02', label: '฿25,000-30,000 (ที่อยู่อาศัย)' },
        { color: '#8c2d04', label: '> ฿30,000 (ที่อยู่อาศัย)' },
        { color: '#808080', label: 'อาคารประเภทอื่นๆ' }
      ]
    };
    return items[colorScheme] || items.buildingType;
  };

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [13.6688, 100.6147], 
      zoom: 12,
      maxZoom: 18,
      minZoom: 10,
      zoomControl: !isMobile,
      attributionControl: true
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // Add zoom control for mobile in a different position
    if (isMobile) {
      L.control.zoom({
        position: 'topright'
      }).addTo(map);
    }

    mapRef.current = map;
    
    // Create legend container with responsive styling
    const legend = L.control({ position: isMobile ? 'bottomleft' : 'bottomright' });
    
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend');
      
      if (isMobile) {
        div.style.cssText = 'background: white; padding: 8px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); font-size: 10px; max-height: 100px; overflow-y: auto; max-width: 280px;';
      } else {
        div.style.cssText = 'background: white; padding: 10px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); font-size: 12px; max-height: 400px; overflow-y: auto;';
      }
      
      return div;
    };
    
    legend.addTo(map);
    legendRef.current = legend;

    // Add click handler for "What's nearby" search
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      // Validate coordinates
      const validCoords = validateAndTransformCoords(lat, lng);
      if (!validCoords) {
        console.error('Invalid coordinates from map click:', { lat, lng });
        return;
      }
      
      const { lat: validLat, lng: validLng } = validCoords;
      
      // Remove previous search marker
      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
      }
      
      // Add new search center marker
      searchMarkerRef.current = L.marker([validLat, validLng], {
        icon: L.divIcon({
          className: 'search-center-marker',
          html: `<div style="
            background-color: #FF4444;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">📍</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);
      
      setSearchCenter({ lat: validLat, lng: validLng });
      
      if (activeCategories.length > 0) {
        fetchNearbyPlaces(validLat, validLng, activeCategories, searchRadius);
      }
    });

    // Global function for popup buttons
    window.searchNearby = (lat, lon) => {
      // Validate coordinates
      const validCoords = validateAndTransformCoords(lat, lon);
      if (!validCoords) {
        console.error('Invalid coordinates for nearby search:', { lat, lon });
        alert('Invalid coordinates detected. Please try clicking directly on the map.');
        return;
      }
      
      const { lat: validLat, lng: validLng } = validCoords;
      
      // Remove previous search marker
      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
      }
      
      // Add new search center marker
      searchMarkerRef.current = L.marker([validLat, validLng], {
        icon: L.divIcon({
          className: 'search-center-marker',
          html: `<div style="
            background-color: #FF4444;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">📍</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);
      
      setSearchCenter({ lat: validLat, lng: validLng });
      map.setView([validLat, validLng], Math.max(map.getZoom(), 14));
      
      if (activeCategories.length > 0) {
        fetchNearbyPlaces(validLat, validLng, activeCategories, searchRadius);
      } else {
        // If no categories are selected, show a message
        alert('Please select at least one category to search for nearby places.');
      }
    };

    // Global function for building popup buttons (stores coordinates in closure)
    window.searchNearbyFromBuilding = () => {
      if (window.currentBuildingCoords) {
        const { lat, lng } = window.currentBuildingCoords;
        window.searchNearby(lat, lng);
      } else {
        alert('No building coordinates available. Please click on a building first.');
      }
    };

    // Load GeoJSON data
    fetch('/data/bldg_pkn.geojson')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load GeoJSON data');
        return response.json();
      })
      .then(geojsonData => {
        // Style function for buildings
        const style = (feature) => ({
          fillColor: getColor(feature.properties),
          weight: 0.3,
          opacity: 0.4,
          color: '#666666',
          fillOpacity: 0.6
        });

        // Add building layer
        const buildingLayer = L.geoJSON(geojsonData, {
          style: style,
          onEachFeature: (feature, layer) => {
            // Add popup on click (for all devices)
            layer.on('click', (e) => {
              // Store building coordinates for nearby search
              const coords = e.latlng;
              window.currentBuildingCoords = coords;
              
              const popup = L.popup({
                maxWidth: isMobile ? 300 : 400,
                className: 'building-popup'
              })
                .setLatLng(e.latlng)
                .setContent(generatePopupContent(feature.properties, colorScheme))
                .openOn(map);
            });

            // Add hover effect for desktop
            if (!isMobile) {
              layer.on('mouseover', (e) => {
                layer.setStyle({
                  weight: 2,
                  color: '#666',
                  fillOpacity: 0.8
                });
              });

              layer.on('mouseout', (e) => {
                buildingLayer.resetStyle(layer);
              });
            }
          }
        }).addTo(map);

        buildingLayerRef.current = buildingLayer;

        // Fit map to data bounds
        map.fitBounds(buildingLayer.getBounds(), {
          padding: isMobile ? [20, 20] : [50, 50],
          maxZoom: isMobile ? 14 : 16
        });

        // Update legend initially
        updateLegend();
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
      });

    return () => {
      // Cleanup global functions
      if (window.searchNearby) {
        delete window.searchNearby;
      }
      if (window.searchNearbyFromBuilding) {
        delete window.searchNearbyFromBuilding;
      }
      if (window.handleNearbySearchFromBuilding) {
        delete window.handleNearbySearchFromBuilding;
      }
      if (window.currentBuildingCoords) {
        delete window.currentBuildingCoords;
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [isMobile]); // Keep only isMobile as dependency

  // Separate useEffect to update global functions when dependencies change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Handle nearby search from building popup
    const handleNearbySearchFromBuilding = (buildingCoords) => {
      if (!buildingCoords) {
        alert('No building coordinates available.');
        return;
      }

      const { lat, lng } = buildingCoords;
      
      // Validate coordinates
      const validCoords = validateAndTransformCoords(lat, lng);
      if (!validCoords) {
        console.error('Invalid coordinates for nearby search:', { lat, lng });
        alert('Invalid coordinates detected. Please try clicking directly on the map.');
        return;
      }
      
      const { lat: validLat, lng: validLng } = validCoords;
      
      // Remove previous search marker
      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
      }
      
      // Add new search center marker
      searchMarkerRef.current = L.marker([validLat, validLng], {
        icon: L.divIcon({
          className: 'search-center-marker',
          html: `<div style="
            background-color: #FF4444;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">📍</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);
      
      setSearchCenter({ lat: validLat, lng: validLng });
      map.setView([validLat, validLng], Math.max(map.getZoom(), 14));
      
      if (activeCategories.length > 0) {
        fetchNearbyPlaces(validLat, validLng, activeCategories, searchRadius);
      } else {
        // If no categories are selected, show a message
        alert('Please select at least one category to search for nearby places.');
      }
    };

    // Update global functions with current state
    window.searchNearby = (lat, lon) => {
      // Validate coordinates
      const validCoords = validateAndTransformCoords(lat, lon);
      if (!validCoords) {
        console.error('Invalid coordinates for nearby search:', { lat, lon });
        alert('Invalid coordinates detected. Please try clicking directly on the map.');
        return;
      }
      
      const { lat: validLat, lng: validLng } = validCoords;
      
      // Remove previous search marker
      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
      }
      
      // Add new search center marker
      searchMarkerRef.current = L.marker([validLat, validLng], {
        icon: L.divIcon({
          className: 'search-center-marker',
          html: `<div style="
            background-color: #FF4444;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">📍</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);
      
      setSearchCenter({ lat: validLat, lng: validLng });
      map.setView([validLat, validLng], Math.max(map.getZoom(), 14));
      
      if (activeCategories.length > 0) {
        fetchNearbyPlaces(validLat, validLng, activeCategories, searchRadius);
      } else {
        // If no categories are selected, show a message
        alert('Please select at least one category to search for nearby places.');
      }
    };

    window.searchNearbyFromBuilding = () => {
      if (window.currentBuildingCoords) {
        const { lat, lng } = window.currentBuildingCoords;
        window.searchNearby(lat, lng);
      } else {
        alert('No building coordinates available. Please click on a building first.');
      }
    };

    // Make the handle function available globally as a backup
    window.handleNearbySearchFromBuilding = handleNearbySearchFromBuilding;
    
  }, [activeCategories, searchRadius]); // Update when these change

  // Update filters when they change
  useEffect(() => {
    if (!mapRef.current || !buildingLayerRef.current) return;

    // Filter the layer based on current filters
    buildingLayerRef.current.eachLayer((layer) => {
      const feature = layer.feature.properties;
      let shouldShow = true;
      
      if (filters.buildingType !== 'all') {
        shouldShow = shouldShow && (feature.TP_build === filters.buildingType);
      }
      
      if (filters.stories !== 'all') {
        const [min, max] = filters.stories.split('-').map(Number);
        const stories = feature.STOREY || 0;
        shouldShow = shouldShow && (stories >= min && stories <= max);
      }
      
      if (filters.rentRange !== 'all') {
        const [min, max] = filters.rentRange.split('-').map(Number);
        const rent = feature.House_rentcost || 0;
        shouldShow = shouldShow && (rent >= min && rent <= max);
      }

      // Show/hide layer based on filter
      if (shouldShow) {
        if (!mapRef.current.hasLayer(layer)) {
          layer.addTo(mapRef.current);
        }
      } else {
        if (mapRef.current.hasLayer(layer)) {
          mapRef.current.removeLayer(layer);
        }
      }
    });
  }, [filters]);

  // Update colors when color scheme changes
  useEffect(() => {
    if (!mapRef.current || !buildingLayerRef.current) return;

    // Re-style all layers
    buildingLayerRef.current.eachLayer((layer) => {
      layer.setStyle({
        fillColor: getColor(layer.feature.properties),
        weight: 0.3,
        opacity: 0.4,
        color: '#666666',
        fillOpacity: 0.6
      });
    });

    updateLegend();
  }, [colorScheme]);

  // Update legend content
  const updateLegend = () => {
    if (!legendRef.current || !legendRef.current.getContainer()) return;

    const items = getLegendItems();
    const title = {
      buildingType: 'ประเภทอาคาร',
      transportAccess: 'การเข้าถึงระบบขนส่ง',
      healthAccess: 'การเข้าถึงสถานพยาบาล',
      householdSize: 'ขนาดครัวเรือน',
      rentCost: 'ค่าเช่า'
    }[colorScheme] || 'คำอธิบายสัญลักษณ์';
    
    // Different styling for mobile vs desktop
    const fontSize = isMobile ? '10px' : '12px';
    const marginBottom = isMobile ? '2px' : '4px';
    const colorBoxSize = isMobile ? '12px' : '16px';
    
    legendRef.current.getContainer().innerHTML = `
      <h4 style="margin: 0 0 8px 0; font-weight: 600; font-size: ${fontSize};">${title}</h4>
      ${items.map(item => `
        <div style="display: flex; align-items: center; margin-bottom: ${marginBottom};">
          <span style="display: inline-block; width: ${colorBoxSize}; height: ${colorBoxSize}; margin-right: 8px; background: ${item.color}; border: 1px solid rgba(0,0,0,0.2);"></span>
          <span style="font-size: ${fontSize};">${item.label}</span>
        </div>
      `).join('')}
    `;
  };

  // Calculate total results
  const getTotalResults = () => {
    return Object.values(nearbyData).reduce((total, pois) => total + pois.length, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden relative h-full flex flex-col">
      {/* Nearby Places Panel - Above the map */}
      <div className={`bg-white border-b border-gray-200 transition-all duration-300 ${
        showNearbyPanel ? 'block' : 'hidden'
      }`}>
        
        {/* Panel Header */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center">
              <span className="mr-2">🔍</span>
              What's nearby?
            </h3>
            <button
              onClick={() => setShowNearbyPanel(!showNearbyPanel)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showNearbyPanel ? '−' : '+'}
            </button>
          </div>
          {!searchCenter && (
            <p className="text-xs text-gray-500 mt-1">Click on map to search</p>
          )}
          {searchCenter && (
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <span className="mr-1">📍</span>
              Search location set
              <button
                onClick={clearSearch}
                className="ml-2 text-red-500 hover:text-red-700 text-xs underline"
              >
                Clear
              </button>
            </p>
          )}
        </div>

        {/* Search Radius Control */}
        <div className="p-3 border-b border-gray-100">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Search Radius: {searchRadius}m
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="500"
              max="2000"
              step="250"
              value={searchRadius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 min-w-[60px]">
              {searchRadius < 1000 ? `${searchRadius}m` : `${(searchRadius/1000).toFixed(1)}km`}
            </span>
          </div>
        </div>

        {/* Category Selection */}
        <div className="p-3 border-b border-gray-100">
          <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {Object.entries(CATEGORIES).map(([key, config]) => (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                className={`text-xs px-2 py-2 rounded-md flex items-center justify-between transition-all ${
                  activeCategories.includes(key)
                    ? `${config.bgColor} ${config.textColor} ${config.borderColor} border`
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>{config.icon}</span>
                  <span className="font-medium">{config.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {nearbyData[key] && nearbyData[key].length > 0 && (
                    <span className="bg-white text-gray-700 px-1.5 py-0.5 rounded-full text-xs font-bold">
                      {nearbyData[key].length}
                    </span>
                  )}
                  {activeCategories.includes(key) && (
                    <span className="text-xs">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-xs">Searching nearby places...</span>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {searchCenter && Object.keys(nearbyData).length > 0 && !loading && (
          <div className="p-3 border-b border-gray-100">
            <div className="text-xs text-gray-600 mb-2">
              <strong>Found {getTotalResults()} places</strong> within {searchRadius < 1000 ? `${searchRadius}m` : `${(searchRadius/1000).toFixed(1)}km`}
            </div>
            
            <div className={`grid gap-1 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
              {Object.entries(nearbyData).map(([category, pois]) => {
                if (activeCategories.includes(category) && pois.length > 0) {
                  return (
                    <div key={category} className="flex items-center justify-between text-xs p-1 rounded bg-gray-50">
                      <span className="flex items-center">
                        <span className="mr-1">{CATEGORIES[category].icon}</span>
                        <span className="font-medium text-xs">{CATEGORIES[category].name}</span>
                      </span>
                      <span className="bg-white px-1 py-0.5 rounded text-xs font-bold text-gray-700">
                        {pois.length}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
              💡 Click on map markers for more details
            </div>
          </div>
        )}

        {/* No Results */}
        {searchCenter && Object.keys(nearbyData).length > 0 && getTotalResults() === 0 && !loading && (
          <div className="p-3 text-center">
            <p className="text-xs text-gray-500">
              No places found in selected categories
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try increasing search radius or selecting more categories
            </p>
          </div>
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && searchCenter && (
          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-600">
              <strong>Debug Info:</strong>
              <br />
              Search Center: {searchCenter.lat.toFixed(6)}, {searchCenter.lng.toFixed(6)}
              <br />
              Radius: {searchRadius}m
              <br />
              Active Categories: {activeCategories.join(', ')}
            </div>
          </div>
        )}

        {/* Test Buttons for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-3 border-t border-gray-100 bg-yellow-50">
            <div className="text-xs text-gray-700 mb-2">
              <strong>Debug Controls:</strong>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const testLat = 13.6688;
                  const testLng = 100.6147;
                  console.log('Testing nearby search with coordinates:', { testLat, testLng });
                  if (activeCategories.length > 0) {
                    fetchNearbyPlaces(testLat, testLng, activeCategories, searchRadius);
                  } else {
                    console.warn('No active categories selected');
                  }
                }}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
              >
                Test API Call
              </button>
              <button
                onClick={async () => {
                  if (!searchCenter) {
                    alert('Please click on the map first to set a search location');
                    return;
                  }
                  
                  const { lat, lng } = searchCenter;
                  console.log('🔍 Testing broad query for all POIs near:', { lat, lng });
                  
                  try {
                    const broadQuery = `
                      [out:json][timeout:25];
                      (
                        node(around:1000,${lat},${lng});
                        way(around:1000,${lat},${lng});
                      );
                      out geom;
                    `;
                    
                    const results = await queryOverpass(broadQuery);
                    console.log('📊 Broad search results:', {
                      total: results.length,
                      nodes: results.filter(r => r.type === 'node').length,
                      ways: results.filter(r => r.type === 'way').length,
                      sample: results.slice(0, 5).map(r => ({
                        type: r.type,
                        tags: r.tags,
                        id: r.id
                      }))
                    });
                    
                    // Count by common tags
                    const tagCounts = {};
                    results.forEach(r => {
                      if (r.tags) {
                        Object.keys(r.tags).forEach(key => {
                          if (['amenity', 'shop', 'leisure', 'healthcare', 'building'].includes(key)) {
                            const tagValue = `${key}=${r.tags[key]}`;
                            tagCounts[tagValue] = (tagCounts[tagValue] || 0) + 1;
                          }
                        });
                      }
                    });
                    
                    console.log('🏷️ Common tags found:', tagCounts);
                    
                  } catch (error) {
                    console.error('Broad query failed:', error);
                  }
                }}
                className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded"
              >
                Test Broad Query
              </button>
              <button
                onClick={() => {
                  console.log('=== StockMap Debug Info ===');
                  console.log('Active categories:', activeCategories);
                  console.log('Search radius:', searchRadius);
                  console.log('Search center:', searchCenter);
                  console.log('Nearby data count:', Object.keys(nearbyData).length);
                  console.log('Loading state:', loading);
                  console.log('Map ref:', !!mapRef.current);
                  
                  // Show detailed results per category
                  Object.entries(nearbyData).forEach(([category, pois]) => {
                    if (pois.length > 0) {
                      console.log(`📍 ${category.toUpperCase()}:`, {
                        count: pois.length,
                        samples: pois.slice(0, 3).map(p => ({
                          name: getPOIName(p),
                          tags: p.tags,
                          coords: [p.lat, p.lon]
                        }))
                      });
                    }
                  });
                  
                  console.log('Window functions available:', {
                    searchNearby: typeof window.searchNearby,
                    searchNearbyFromBuilding: typeof window.searchNearbyFromBuilding,
                    handleNearbySearchFromBuilding: typeof window.handleNearbySearchFromBuilding,
                    currentBuildingCoords: !!window.currentBuildingCoords
                  });
                  console.log('=== End Debug Info ===');
                }}
                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
              >
                Log State
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Button - When panel is hidden */}
      {!showNearbyPanel && (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={() => setShowNearbyPanel(true)}
            className="bg-white rounded-lg shadow-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
          >
            <span className="mr-2">🔍</span>
            What's nearby?
          </button>
        </div>
      )}

      {/* Map Container - Takes remaining space */}
      <div className="flex-1 relative">
        <div 
          ref={mapContainerRef}
          className="w-full h-full"
          style={{ 
            minHeight: "400px"
          }}
        />
        
        {/* Attribution */}
        <div className="absolute bottom-0 right-0 bg-white bg-opacity-75 px-2 py-1 text-xs text-gray-600">
          © OpenStreetMap contributors
        </div>
      </div>

      {/* Custom CSS for better popup styling */}
      <style jsx>{`
        .poi-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .poi-popup .leaflet-popup-content {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .building-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .search-center-marker {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default StockMap;
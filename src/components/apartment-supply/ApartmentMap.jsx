import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'material-symbols/outlined.css';

// Calculate category score based on nearby count (adjusted for Thai vehicle access)
const calculateCategoryScore = (count, category) => {
  // Updated thresholds for larger search radius (car/motorcycle access)
  const thresholds = {
    restaurant: { excellent: 50, good: 25, fair: 10 },     // More restaurants in larger radius
    convenience: { excellent: 25, good: 12, fair: 5 },     // More convenience stores
    school: { excellent: 15, good: 8, fair: 3 },           // More schools in larger area
    health: { excellent: 20, good: 10, fair: 4 },          // More healthcare facilities
    transport: { excellent: 30, good: 15, fair: 6 }        // More transport options
  };

  const threshold = thresholds[category] || thresholds.restaurant;

  if (count >= threshold.excellent) return 100;
  if (count >= threshold.good) return 80;
  if (count >= threshold.fair) return 60;
  if (count > 0) return 40;
  return 0;
};

// Service-specific radius limits optimized for Thai transportation (car/motorcycle)
const getServiceRadius = (category) => {
  const serviceRadii = {
    // Public transport: BTS/MRT stations, bus stops - motorcycle/car access (2-3km)
    transport: 2500,
    // Daily convenience stores: 7-Eleven, shopping - quick motorcycle trips (1-2km)
    convenience: 1500,
    // Restaurants/food: Dining out culture - willing to drive further (2-4km)
    restaurant: 3000,
    // Healthcare: Hospital/clinic access - important, will travel by car (3-5km)
    health: 4000,
    // Schools: Educational institutions - daily commute by car/motorcycle (2-5km)
    school: 3500
  };
  return serviceRadii[category] || 2000; // Default 2km for Thai context
};

// Fetch nearby places and return both count and data for caching
const fetchNearbyPlacesData = async (category, lat, lng, customRadius = null) => {
  const radius = customRadius || getServiceRadius(category);
  const buildOverpassQuery = (category, lat, lng, radius) => {
    const timeout = 15; // Increased timeout for better results
    switch(category) {
      case 'restaurant':
        return `[out:json][timeout:${timeout}];(node["amenity"~"^(restaurant|cafe|fast_food|food_court)$"](around:${radius},${lat},${lng});way["amenity"~"^(restaurant|cafe|fast_food|food_court)$"](around:${radius},${lat},${lng});relation["amenity"~"^(restaurant|cafe|fast_food|food_court)$"](around:${radius},${lat},${lng}););out geom;`;
      case 'convenience':
        return `[out:json][timeout:${timeout}];(node["shop"~"^(convenience|supermarket|mall|department_store)$"](around:${radius},${lat},${lng});way["shop"~"^(convenience|supermarket|mall|department_store)$"](around:${radius},${lat},${lng});relation["shop"~"^(convenience|supermarket|mall|department_store)$"](around:${radius},${lat},${lng}););out geom;`;
      case 'school':
        return `[out:json][timeout:${timeout}];(node["amenity"~"^(school|university|college|kindergarten)$"](around:${radius},${lat},${lng});way["amenity"~"^(school|university|college|kindergarten)$"](around:${radius},${lat},${lng});relation["amenity"~"^(school|university|college|kindergarten)$"](around:${radius},${lat},${lng}););out geom;`;
      case 'health':
        return `[out:json][timeout:${timeout}];(node["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"](around:${radius},${lat},${lng});node["healthcare"](around:${radius},${lat},${lng});node["shop"="chemist"](around:${radius},${lat},${lng});way["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"](around:${radius},${lat},${lng});way["healthcare"](around:${radius},${lat},${lng});relation["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"](around:${radius},${lat},${lng}););out geom;`;
      case 'transport':
        return `[out:json][timeout:${timeout}];(node["public_transport"](around:${radius},${lat},${lng});node["highway"="bus_stop"](around:${radius},${lat},${lng});node["amenity"="bus_station"](around:${radius},${lat},${lng});node["railway"~"^(station|halt|tram_stop)$"](around:${radius},${lat},${lng});way["public_transport"](around:${radius},${lat},${lng});way["amenity"="bus_station"](around:${radius},${lat},${lng});way["railway"~"^(station|halt)$"](around:${radius},${lat},${lng});relation["public_transport"](around:${radius},${lat},${lng}););out geom;`;
      default:
        return buildOverpassQuery('restaurant', lat, lng, radius);
    }
  };

  const query = buildOverpassQuery(category, lat, lng, radius);
  
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: query,
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - wait and retry once
        console.log(`Rate limited for ${category}, waiting 3s...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        const retryResponse = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: query,
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Overpass API error: ${retryResponse.status}`);
        }
        
        const retryData = await retryResponse.json();
        const elements = retryData.elements || [];
        return { count: elements.length, elements };
      }
      
      if (response.status === 504) {
        // Gateway timeout - try with smaller radius
        console.log(`Timeout for ${category}, trying smaller radius...`);
        const smallerRadius = Math.floor(radius * 0.7);
        const fallbackQuery = buildOverpassQuery(category, lat, lng, smallerRadius);
        
        const fallbackResponse = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: fallbackQuery,
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const elements = fallbackData.elements || [];
          const count = elements.length;
          console.log(`Fallback success for ${category}: ${count} places in ${smallerRadius}m radius`);
          // Scale up the count to approximate the original radius
          return { count: Math.round(count * 1.4), elements };
        }
      }
      
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const elements = data.elements || [];
    const count = elements.length;
    console.log(`Overpass API returned ${count} elements for ${category}`);
    return { count, elements };
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    return { count: 0, elements: [] };
  }
};

// Legacy function for backward compatibility
const fetchNearbyCount = async (category, lat, lng, customRadius = null) => {
  const result = await fetchNearbyPlacesData(category, lat, lng, customRadius);
  return result.count;
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // Convert to meters
  return Math.round(distance);
};

// Format distance for display
const formatDistance = (distanceInMeters) => {
  if (distanceInMeters < 1000) {
    return `${distanceInMeters} เมตร`;
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)} กิโลเมตร`;
  }
};

// Fix default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ApartmentMap = ({ 
  apartmentData, 
  selectedApartment,
  onApartmentSelect,
  colorScheme = 'priceRange', 
  proximityScores = {},
  setProximityScores,
  calculateAmenityScore,
  selectedProximityPlace,
  showingNearbyPlaces,
  isMobile
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const markerClusterRef = useRef(null);
  const pinnedMarkerRef = useRef(null);
  const nearbyLayersRef = useRef({});
  const isInitialLoad = useRef(true);
  const hasZoomedToMarker = useRef(false);
  
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [calculatingProximity, setCalculatingProximity] = useState(null);
  const [selectedApartmentCoords, setSelectedApartmentCoords] = useState(null);
  const [cachedServiceData, setCachedServiceData] = useState({});

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [13.7563, 100.5018], // Bangkok center
        zoom: 10,
        zoomControl: !isMobile,
        attributionControl: false,
        preferCanvas: true, // Better performance
      });

      // Add zoom control for mobile in bottom right
      if (isMobile) {
        L.control.zoom({
          position: 'bottomright'
        }).addTo(map);
      }

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create a simple layer group instead of clustering for now to avoid _setPos errors
      markerClusterRef.current = L.layerGroup();

      // Wait for map to be ready before adding layer group
      map.whenReady(() => {
        try {
          map.addLayer(markerClusterRef.current);
          console.log('Marker layer group added successfully');
        } catch (layerError) {
          console.error('Error adding marker layer:', layerError);
        }
      });

      mapRef.current = map;

      // Add click handler to close pinned marker when clicking on map background
      map.on('click', (e) => {
        const isMapBackground = e.originalEvent.target.classList.contains('leaflet-container');
        
        if (isMapBackground) {
          // Clear selected apartment and pinned marker
          if (pinnedMarkerRef.current) {
            try {
              mapRef.current.removeLayer(pinnedMarkerRef.current);
            } catch (removeError) {
              console.warn('Error removing pinned marker on map click:', removeError);
            }
            pinnedMarkerRef.current = null;
          }
          onApartmentSelect(null);
        }
      });

    } catch (mapError) {
      console.error('Error initializing map:', mapError);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (removeError) {
          console.warn('Error removing map:', removeError);
        }
        mapRef.current = null;
      }
    };
  }, []);

  // Calculate proximity score for a property (using original weighted logic)
  const calculateProximityForProperty = async (property) => {
    // Check if already calculated or currently calculating
    if (proximityScores[property.id] || calculatingProximity === property.id) {
      console.log(`Proximity score already exists or calculating for ${property.apartment_name || property.name || property.id}: ${proximityScores[property.id] || 'calculating...'}`);
      return;
    }

    setCalculatingProximity(property.id);
    
    try {
      console.log(`Calculating proximity score for: ${property.apartment_name || property.name || property.id} at coordinates [${property.latitude}, ${property.longitude}]`);
      
      // Use weighted categories with radius information
      const categories = {
        transport: { weight: 0.25, name: 'ขนส่งสาธารณะ', radius: getServiceRadius('transport') },
        convenience: { weight: 0.20, name: 'ร้านสะดวกซื้อ', radius: getServiceRadius('convenience') },
        restaurant: { weight: 0.20, name: 'ร้านอาหาร', radius: getServiceRadius('restaurant') },
        health: { weight: 0.20, name: 'สถานพยาบาล', radius: getServiceRadius('health') },
        school: { weight: 0.15, name: 'สถานศึกษา', radius: getServiceRadius('school') }
      };

      let weightedScore = 0;
      let totalWeight = 0;
      let completedCategories = [];
      const propertyServiceData = {};

      for (const [category, config] of Object.entries(categories)) {
        try {
          const radius = getServiceRadius(category);
          console.log(`Fetching ${config.name} data for ${property.apartment_name || property.name || property.id} within ${radius}m...`);
          const nearbyData = await fetchNearbyPlacesData(category, property.latitude, property.longitude, radius);
          const nearbyCount = nearbyData.count;
          const categoryScore = calculateCategoryScore(nearbyCount, category);

          // Store the service data for later use
          propertyServiceData[category] = {
            elements: nearbyData.elements,
            count: nearbyCount,
            radius: radius,
            centerLat: property.latitude,
            centerLng: property.longitude
          };
          
          weightedScore += categoryScore * config.weight;
          totalWeight += config.weight;
          completedCategories.push({ 
            category, 
            score: categoryScore, 
            count: nearbyCount,
            weight: config.weight 
          });
          
          console.log(`${config.name}: ${nearbyCount} places found within ${config.radius}m, score: ${categoryScore}% (weight: ${config.weight}) for ${property.apartment_name || property.name || property.id}`);

          // Update with partial weighted score after 2 categories
          if (completedCategories.length === 2) {
            const partialScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
            setProximityScores(prev => ({
              ...prev,
              [property.id]: partialScore
            }));
            console.log(`Partial weighted score after ${completedCategories.length} categories: ${partialScore}% for ${property.apartment_name || property.name || property.id}`);
          }
          
          // Adaptive delay based on density
          const delay = nearbyCount > 50 ? 150 : 250;
          await new Promise(resolve => setTimeout(resolve, delay));
          
        } catch (error) {
          console.error(`Error fetching ${category} data for ${property.apartment_name || property.name || property.id}:`, error);
          // Continue with other categories
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      const finalScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
      
      // Update final score and cache service data
      setProximityScores(prev => {
        const newScores = {
          ...prev,
          [property.id]: finalScore
        };
        console.log(`Updated proximity scores:`, Object.keys(newScores).map(id =>
          `${id.substring(0, 20)}...: ${newScores[id]}%`
        ));
        return newScores;
      });

      // Cache the service data for this property
      setCachedServiceData(prev => ({
        ...prev,
        [property.id]: propertyServiceData
      }));
      
      console.log(`Final weighted proximity score: ${finalScore}% for ${property.apartment_name || property.name || property.id}`);
      console.log('Category breakdown:', completedCategories.map(c => 
        `${c.category}: ${c.score}% (count: ${c.count}, weight: ${c.weight})`
      ).join(', '));
      
    } catch (error) {
      console.error(`Error calculating proximity score for ${property.apartment_name || property.name || property.id}:`, error);
      setProximityScores(prev => ({
        ...prev,
        [property.id]: 0
      }));
      // Clear any partial cached data on error
      setCachedServiceData(prev => {
        const newCache = { ...prev };
        delete newCache[property.id];
        return newCache;
      });
    } finally {
      setCalculatingProximity(null);
    }
  };

  // Show nearby places using cached data from proximity calculations
  const showNearbyPlaces = async (placeType, selectedApartment) => {
    if (!mapRef.current || loadingNearby || !selectedApartment) return;

    setLoadingNearby(true);
    clearNearbyPlaces();

    try {
      console.log(`Loading nearby ${placeType} for apartment ${selectedApartment.id}`);

      // Check if we have cached data for this apartment and service type
      const apartmentData = cachedServiceData[selectedApartment.id];
      if (!apartmentData || !apartmentData[placeType]) {
        console.log(`No cached data for ${placeType}. Please wait for proximity calculation to complete.`);
        setLoadingNearby(false);
        return;
      }

      const serviceData = apartmentData[placeType];
      const elements = serviceData.elements;
      const maxRadius = serviceData.radius;
      
      if (elements && elements.length > 0) {
        const layerGroup = L.layerGroup();
        
        // Place type icons and colors - exactly matching ProximityPlaceButtons
        const placeConfig = {
          restaurant: { icon: 'restaurant', color: '#ef4444' },      // Red-500 - matches proximity panel
          health: { icon: 'local_hospital', color: '#10b981' },      // Green-500 - matches proximity panel
          school: { icon: 'school', color: '#3b82f6' },              // Blue-500 - matches proximity panel
          convenience: { icon: 'store', color: '#f97316' },          // Orange-500 - matches proximity panel
          transport: { icon: 'directions_bus', color: '#8b5cf6' }    // Purple-500 - matches proximity panel
        };

        const config = placeConfig[placeType] || placeConfig.restaurant;

        // Create custom icon for this service type
        const createServiceIcon = (iconName, color) => {
          return L.divIcon({
            html: `
              <div class="service-marker" style="
                background-color: ${color};
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #ffffff;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              ">
                <span class="material-symbols-outlined" style="color: white; font-size: 18px;">${iconName}</span>
              </div>
            `,
            className: 'custom-service-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
          });
        };

        const serviceIcon = createServiceIcon(config.icon, config.color);

        // Process cached elements and add distance info
        const elementsWithDistance = [];

        elements.forEach(element => {
          let lat, lng, name = 'ไม่ระบุชื่อ';

          // Handle different element types
          if (element.type === 'node' && element.lat && element.lon) {
            lat = element.lat;
            lng = element.lon;
          } else if (element.type === 'way' && element.geometry && element.geometry.length > 0) {
            // Calculate center of way
            const coords = element.geometry;
            lat = coords.reduce((sum, coord) => sum + coord.lat, 0) / coords.length;
            lng = coords.reduce((sum, coord) => sum + coord.lon, 0) / coords.length;
          } else if (element.center) {
            lat = element.center.lat;
            lng = element.center.lon;
          } else if (element.bounds) {
            lat = (element.bounds.minlat + element.bounds.maxlat) / 2;
            lng = (element.bounds.minlon + element.bounds.maxlon) / 2;
          }

          if (lat && lng) {
            if (element.tags) {
              name = element.tags.name ||
                     element.tags['name:th'] ||
                     element.tags['name:en'] ||
                     element.tags.brand ||
                     'ไม่ระบุชื่อ';
            }

            // Calculate distance from apartment center
            const distanceFromCenter = calculateDistance(serviceData.centerLat, serviceData.centerLng, lat, lng);

            // Only include if within the service radius
            if (distanceFromCenter <= maxRadius) {
              elementsWithDistance.push({ ...element, lat, lng, name, distanceFromCenter });
            }
          }
        });

        // Sort by distance and create markers
        elementsWithDistance
          .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter)
          .forEach(element => {
            const marker = L.marker([element.lat, element.lng], {
              icon: serviceIcon
            });

            // Enhanced popup with more info and distance
            const amenityType = element.tags?.amenity || element.tags?.shop || element.tags?.public_transport || element.tags?.railway || element.tags?.highway || placeType;
            const address = element.tags?.['addr:street'] || element.tags?.['addr:housenumber'] || '';

            // Calculate distance from selected apartment
            const distance = calculateDistance(
              selectedApartment.latitude,
              selectedApartment.longitude,
              element.lat,
              element.lng
            );
            const distanceColor = distance <= maxRadius ? 'text-green-600' : 'text-orange-600';
            const distanceInfo = `<div class="text-xs font-medium ${distanceColor} mb-1">ระยะทาง: ${formatDistance(distance)}</div>`;

            marker.bindPopup(`
              <div class="text-center">
                <div class="mb-2">
                  <span class="material-symbols-outlined" style="font-size: 24px; color: ${config.color};">${config.icon}</span>
                </div>
                <div class="font-medium text-sm mb-1">${element.name}</div>
                <div class="text-xs text-gray-600 mb-1">${amenityType}</div>
                ${distanceInfo}
                ${address ? `<div class="text-xs text-gray-500">${address}</div>` : ''}
              </div>
            `, {
              closeButton: true,
              maxWidth: 220,
              className: 'simple-place-popup'
            });

            layerGroup.addLayer(marker);
          });

        layerGroup.addTo(mapRef.current);
        nearbyLayersRef.current[placeType] = layerGroup;

        console.log(`Loaded ${elementsWithDistance.length} of ${elements.length} ${placeType} places within ${maxRadius}m radius from cache`);
      } else {
        console.log(`No ${placeType} places found in cached data`);
      }
    } catch (error) {
      console.error(`Error loading nearby ${placeType}:`, error);
    } finally {
      setLoadingNearby(false);
    }
  };

  // Clear nearby places
  const clearNearbyPlaces = () => {
    Object.values(nearbyLayersRef.current).forEach(layer => {
      if (mapRef.current && layer) {
        mapRef.current.removeLayer(layer);
      }
    });
    nearbyLayersRef.current = {};
  };

  // Handle proximity place selection
  useEffect(() => {
    if (selectedProximityPlace && showingNearbyPlaces && mapRef.current && selectedApartment) {
      showNearbyPlaces(selectedProximityPlace, selectedApartment);
    } else {
      clearNearbyPlaces();
    }
  }, [selectedProximityPlace, showingNearbyPlaces, selectedApartment, cachedServiceData]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current || !markerClusterRef.current) return;

    // Clear existing markers
    markerClusterRef.current.clearLayers();
    markersRef.current = [];

    if (!apartmentData || apartmentData.length === 0) return;

    // Add markers for apartments with better error handling
    apartmentData.forEach(property => {
      try {
        // Validate coordinates
        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn('Invalid coordinates for property:', property.id);
          return;
        }

        const isSelected = selectedApartment && selectedApartment.id === property.id;
        
        // Create marker with error handling
        const marker = L.circleMarker([lat, lng], createSimpleMarker(property, isSelected, false));

        // Add property reference for debugging
        marker.propertyData = property;

        // Click handler - simplified without tooltip
        marker.on('click', (e) => {
          try {
            L.DomEvent.stopPropagation(e);
            
            // Remove existing pinned marker
            if (pinnedMarkerRef.current) {
              mapRef.current.removeLayer(pinnedMarkerRef.current);
            }

            // Create new pinned marker
            const pinnedMarker = L.circleMarker([lat, lng], createSimpleMarker(property, true, false));
            
            pinnedMarker.addTo(mapRef.current);
            pinnedMarkerRef.current = pinnedMarker;
            
            // Select apartment (this will update the statistics panel)
            onApartmentSelect(property);

            // Store selected apartment coordinates for distance calculations
            setSelectedApartmentCoords({ lat, lng });

            // Calculate proximity score if not already calculated
            if (!proximityScores[property.id] && calculatingProximity !== property.id) {
              calculateProximityForProperty(property);
            }
            
            // Zoom to marker if not already zoomed
            if (!hasZoomedToMarker.current) {
              mapRef.current.setView([lat, lng], 15, {
                animate: true,
                duration: 1
              });
              hasZoomedToMarker.current = true;
            }
          } catch (clickError) {
            console.error('Error handling marker click:', clickError);
          }
        });

        // Hover effects with error handling
        marker.on('mouseover', () => {
          try {
            marker.isHovered = true;
            const hoveredOptions = createSimpleMarker(property, isSelected, true);
            marker.setStyle(hoveredOptions);
          } catch (hoverError) {
            console.error('Error on marker hover:', hoverError);
          }
        });

        marker.on('mouseout', () => {
          try {
            marker.isHovered = false;
            const normalOptions = createSimpleMarker(property, isSelected, false);
            marker.setStyle(normalOptions);
          } catch (hoverError) {
            console.error('Error on marker mouseout:', hoverError);
          }
        });

        // Add to arrays and layer group
        markersRef.current.push(marker);
        
        // Add to layer group instead of cluster to avoid _setPos errors
        try {
          markerClusterRef.current.addLayer(marker);
        } catch (addLayerError) {
          console.error('Error adding marker to layer group:', addLayerError);
          // Fallback: add directly to map if layer group fails
          try {
            marker.addTo(mapRef.current);
          } catch (directAddError) {
            console.error('Error adding marker directly to map:', directAddError);
          }
        }
        
      } catch (markerError) {
        console.error('Error creating marker for property:', property.id, markerError);
      }
    });

    // Initial map bounds with error handling
    if (isInitialLoad.current && apartmentData.length > 0 && !selectedApartment) {
      try {
        const validCoords = apartmentData
          .filter(item => !isNaN(parseFloat(item.latitude)) && !isNaN(parseFloat(item.longitude)))
          .map(item => [parseFloat(item.latitude), parseFloat(item.longitude)]);
        
        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords);
          mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (boundsError) {
        console.error('Error setting initial bounds:', boundsError);
      }
      isInitialLoad.current = false;
    }

  }, [apartmentData, colorScheme, selectedApartment, proximityScores]);

  // Update pinned marker when selectedApartment changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing pinned marker
    if (pinnedMarkerRef.current) {
      try {
        mapRef.current.removeLayer(pinnedMarkerRef.current);
      } catch (removeError) {
        console.warn('Error removing pinned marker:', removeError);
      }
      pinnedMarkerRef.current = null;
    }

    // Add new pinned marker if apartment is selected
    if (selectedApartment) {
      try {
        const lat = parseFloat(selectedApartment.latitude);
        const lng = parseFloat(selectedApartment.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          const pinnedMarker = L.circleMarker([lat, lng], createSimpleMarker(selectedApartment, true, false));

          pinnedMarker.addTo(mapRef.current);
          pinnedMarkerRef.current = pinnedMarker;

          // Store coordinates for distance calculations
          setSelectedApartmentCoords({ lat, lng });
        } else {
          console.warn('Invalid coordinates for selected apartment:', selectedApartment.id);
        }
      } catch (pinnedError) {
        console.error('Error creating pinned marker:', pinnedError);
      }
    } else {
      // Clear coordinates when no apartment is selected
      setSelectedApartmentCoords(null);
    }
  }, [selectedApartment]);

  // Color scheme functions
  const getMarkerColor = (property, colorScheme) => {
    switch (colorScheme) {
      case 'priceRange':
        const price = property.monthly_min_price || 0;
        if (price < 5000) return '#22c55e';      // Green - cheap
        if (price < 10000) return '#84cc16';     // Light green
        if (price < 20000) return '#eab308';     // Yellow
        if (price < 30000) return '#f97316';     // Orange
        return '#ef4444';                        // Red - expensive
      
      case 'amenityScore':
        const amenityScore = calculateAmenityScore ? calculateAmenityScore(property) : 0;
        if (amenityScore >= 80) return '#10b981'; // High
        if (amenityScore >= 60) return '#f59e0b'; // Medium
        if (amenityScore >= 40) return '#ef4444'; // Low
        return '#6b7280'; // Very low
      
      case 'proximityScore':
        const proximityScore = proximityScores[property.id] || 0;
        if (proximityScore >= 80) return '#10b981'; // High
        if (proximityScore >= 60) return '#f59e0b'; // Medium
        if (proximityScore >= 40) return '#ef4444'; // Low
        return '#6b7280'; // Very low or not calculated
      
      default:
        return '#3b82f6'; // Default blue
    }
  };

  // Create marker style
  // Create performant circle marker with property-type color coding
  const createSimpleMarker = (property, isSelected, isHovered) => {
    const markerColor = getMarkerColor(property, colorScheme);
    const radius = isSelected ? 8 : (isHovered ? 6 : 5);
    const weight = isSelected ? 3 : (isHovered ? 2 : 1);
    const opacity = isSelected ? 1 : 0.8;
    const fillOpacity = isSelected ? 0.9 : 0.7;

    return {
      radius: radius,
      fillColor: markerColor,
      color: '#ffffff',
      weight: weight,
      opacity: opacity,
      fillOpacity: fillOpacity
    };
  };

  // Expose methods to parent component
  useEffect(() => {
    window.apartmentMapInstance = {
      showNearbyPlaces,
      clearNearbyPlaces
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Loading Overlays */}
      {(loadingNearby || calculatingProximity) && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">
              {loadingNearby && 'กำลังโหลดสถานที่ใกล้เคียง...'}
              {calculatingProximity && 'กำลังคำนวณคะแนน...'}
            </span>
          </div>
        </div>
      )}

      {/* Service Radius Information */}
      {selectedProximityPlace && showingNearbyPlaces && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 border border-gray-200">
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">รัศมีการเดินทาง (รถ/มอเตอร์ไซค์):</div>
            <div className="text-blue-600">
              {(() => {
                const radius = getServiceRadius(selectedProximityPlace);
                const categoryNames = {
                  transport: 'ขนส่งสาธารณะ',
                  convenience: 'ร้านสะดวกซื้อ',
                  restaurant: 'ร้านอาหาร',
                  health: 'สถานพยาบาล',
                  school: 'สถานศึกษา'
                };
                const kmDistance = (radius / 1000).toFixed(1);
                return `${categoryNames[selectedProximityPlace] || selectedProximityPlace}: ในรัศมี ${kmDistance} กม.`;
              })()
            }
            </div>
          </div>
        </div>
      )}

      {/* Proximity Calculation Status */}
      {Object.keys(proximityScores).length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 z-10 border border-gray-200">
          <div className="text-xs text-gray-600">
            คะแนนความใกล้เคียง: {Object.keys(proximityScores).length} รายการ
          </div>
        </div>
      )}
    </div>
  );
};

export default ApartmentMap;
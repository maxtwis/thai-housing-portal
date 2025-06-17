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

const ApartmentMap = ({ apartmentData, filters, colorScheme = 'priceRange', isMobile, selectedApartment, onApartmentSelect }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const nearbyLayersRef = useRef({});

  // Dynamic height calculation based on viewport
  const getMapHeight = () => {
    if (isMobile) {
      return "60vh";
    } else {
      return "calc(100vh - 120px)";
    }
  };

  // Color schemes for different attributes
  const getMarkerColor = (apartment) => {
    const schemes = {
      priceRange: () => {
        const price = apartment.price_min || 0;
        if (price < 5000) return '#2ca02c';      // Green - Budget
        if (price < 10000) return '#ff7f0e';    // Orange - Mid-range
        if (price < 20000) return '#d62728';    // Red - High-end
        return '#9467bd';                       // Purple - Luxury
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
        if (score >= 80) return '#2ca02c';      // Green - Excellent
        if (score >= 60) return '#ff7f0e';     // Orange - Good
        if (score >= 40) return '#d62728';     // Red - Average
        return '#7f7f7f';                      // Gray - Basic
      },
      size: () => {
        const size = apartment.size_max || apartment.size_min || 0;
        if (size < 30) return '#9467bd';       // Purple - Small
        if (size < 50) return '#1f77b4';       // Blue - Medium
        if (size < 80) return '#ff7f0e';       // Orange - Large
        return '#2ca02c';                      // Green - Very Large
      }
    };
    
    return schemes[colorScheme] ? schemes[colorScheme]() : schemes.priceRange();
  };

  // Calculate facility score
  const calculateFacilityScore = (apartment) => {
    const facilityKeys = Object.keys(apartment).filter(key => key.startsWith('facility_'));
    const totalFacilities = facilityKeys.length;
    const availableFacilities = facilityKeys.filter(key => apartment[key] > 0).length;
    return totalFacilities > 0 ? (availableFacilities / totalFacilities) * 100 : 0;
  };

  // Generate apartment popup content
  const generatePopupContent = (apartment) => {
    const facilityScore = calculateFacilityScore(apartment);
    
    return `
      <div class="p-3 min-w-[280px]">
        <div class="bg-gray-50 -m-3 p-3 mb-3 border-b">
          <h3 class="font-bold text-gray-800">${apartment.apartment_name || 'Unnamed Apartment'}</h3>
          <p class="text-sm text-gray-600 mt-1">${apartment.room_type || 'N/A'}</p>
        </div>
        
        <div class="space-y-2">
          <div class="flex justify-between items-baseline text-sm">
            <span class="text-gray-600">Price Range:</span>
            <span class="font-medium text-gray-800">
              ฿${apartment.price_min?.toLocaleString() || 'N/A'} - ฿${apartment.price_max?.toLocaleString() || 'N/A'}
            </span>
          </div>
          
          <div class="flex justify-between items-baseline text-sm">
            <span class="text-gray-600">Size:</span>
            <span class="font-medium text-gray-800">
              ${apartment.size_min || 'N/A'} - ${apartment.size_max || 'N/A'} sqm
            </span>
          </div>
          
          <div class="flex justify-between items-baseline text-sm">
            <span class="text-gray-600">Facility Score:</span>
            <span class="font-medium text-gray-800">${facilityScore.toFixed(0)}%</span>
          </div>
          
          <div class="border-t border-gray-200 mt-3 pt-3">
            <p class="text-xs font-medium text-gray-600 mb-2">Key Facilities:</p>
            <div class="flex flex-wrap gap-1">
              ${apartment.facility_parking ? '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Parking</span>' : ''}
              ${apartment.facility_wifi ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">WiFi</span>' : ''}
              ${apartment.facility_aircondition ? '<span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">AC</span>' : ''}
              ${apartment.facility_pool ? '<span class="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded">Pool</span>' : ''}
              ${apartment.facility_gym ? '<span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Gym</span>' : ''}
              ${apartment.facility_security ? '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Security</span>' : ''}
            </div>
          </div>
          
          <div class="border-t border-gray-200 mt-3 pt-3">
            <p class="text-xs text-gray-500">${apartment.address || 'Address not available'}</p>
            <button 
              onclick="window.apartmentMapInstance?.showNearbyPlaces(${apartment.latitude}, ${apartment.longitude})" 
              class="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Show What's Nearby
            </button>
          </div>
        </div>
      </div>
    `;
  };

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

    // Clear existing nearby layers
    Object.values(nearbyLayersRef.current).forEach(layer => {
      mapRef.current.removeLayer(layer);
    });
    nearbyLayersRef.current = {};

    // Show loading indicator
    const loadingPopup = L.popup()
      .setLatLng([lat, lon])
      .setContent('<div class="text-center p-2"><div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div><p class="mt-2 text-sm">Loading nearby places...</p></div>')
      .openOn(mapRef.current);

    try {
      const nearbyPlaces = await fetchNearbyPlaces(lat, lon);
      mapRef.current.closePopup(loadingPopup);

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
            <div class="p-2">
              <h4 class="font-medium text-sm">${place.tags?.name || 'Unnamed'}</h4>
              <p class="text-xs text-gray-600">${place.tags?.amenity || place.tags?.shop || place.tags?.public_transport || 'Unknown type'}</p>
              ${place.tags?.cuisine ? `<p class="text-xs text-gray-500">Cuisine: ${place.tags.cuisine}</p>` : ''}
              ${place.tags?.opening_hours ? `<p class="text-xs text-gray-500">Hours: ${place.tags.opening_hours}</p>` : ''}
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.addTo(layerGroup);
        });

        nearbyLayersRef.current[categoryName] = layerGroup;
        layerGroup.addTo(mapRef.current);
      });

      // Create legend for nearby places
      const legendContent = `
        <div class="p-3 bg-white rounded shadow-lg">
          <h4 class="font-medium text-sm mb-2">Nearby Places</h4>
          ${Object.entries(categories)
            .filter(([_, data]) => data.places.length > 0)
            .map(([name, data]) => `
              <div class="flex items-center mb-1">
                <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${data.color}"></div>
                <span class="text-xs">${data.icon} ${name.charAt(0).toUpperCase() + name.slice(1)} (${data.places.length})</span>
              </div>
            `).join('')}
          <button onclick="window.apartmentMapInstance?.clearNearbyPlaces()" class="mt-2 text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700">
            Clear
          </button>
        </div>
      `;

      const legend = L.control({ position: 'bottomleft' });
      legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'nearby-legend');
        div.innerHTML = legendContent;
        return div;
      };
      
      nearbyLayersRef.current.legend = legend;
      legend.addTo(mapRef.current);

    } catch (error) {
      mapRef.current.closePopup(loadingPopup);
      console.error('Error showing nearby places:', error);
    }
  };

  // Clear nearby places
  const clearNearbyPlaces = () => {
    if (!mapRef.current) return;

    Object.values(nearbyLayersRef.current).forEach(layer => {
      mapRef.current.removeLayer(layer);
    });
    nearbyLayersRef.current = {};
  };

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

    // Expose methods to window for popup buttons
    window.apartmentMapInstance = {
      showNearbyPlaces,
      clearNearbyPlaces
    };

    return () => {
      if (mapRef.current) {
        window.apartmentMapInstance = null;
        mapRef.current.remove();
      }
    };
  }, [isMobile]);

  // Update apartment markers when data or filters change
  useEffect(() => {
    if (!mapRef.current || !apartmentData) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Filter apartment data
    const filteredData = apartmentData.filter(apartment => {
      // Apply filters here
      if (filters.priceRange !== 'all') {
        const [minPrice, maxPrice] = filters.priceRange.split('-').map(Number);
        const apartmentPrice = apartment.price_min || 0;
        if (maxPrice) {
          if (apartmentPrice < minPrice || apartmentPrice > maxPrice) return false;
        } else {
          if (apartmentPrice < minPrice) return false;
        }
      }

      if (filters.roomType !== 'all') {
        if (apartment.room_type !== filters.roomType) return false;
      }

      if (filters.facilities !== 'all') {
        const facilityScore = calculateFacilityScore(apartment);
        const [minScore, maxScore] = filters.facilities.split('-').map(Number);
        if (maxScore) {
          if (facilityScore < minScore || facilityScore > maxScore) return false;
        } else {
          if (facilityScore < minScore) return false;
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
        if (onApartmentSelect) {
          onApartmentSelect(apartment);
        }
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden relative h-full">
      <div 
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ 
          minHeight: "400px", 
          height: getMapHeight() 
        }}
      />
      <div className="absolute bottom-0 right-0 bg-white bg-opacity-75 px-2 py-1 text-xs text-gray-600">
        © OpenStreetMap contributors
      </div>
    </div>
  );
};

export default ApartmentMap;
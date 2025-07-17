import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

// Import proximity scoring utilities
import { fetchNearbyCount, buildOverpassQuery, calculateProximityScore } from '../../utils/proximityScoring';

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

      // Initialize marker cluster with better options to prevent _setPos errors
      markerClusterRef.current = L.markerClusterGroup({
        maxClusterRadius: isMobile ? 40 : 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        removeOutsideVisibleBounds: true,
        animate: !isMobile,
        animateAddingMarkers: !isMobile,
        disableClusteringAtZoom: 15,
        // Add these options to prevent positioning errors
        chunkedLoading: true,
        chunkProgress: function(processed, total, elapsed) {
          if (processed === total) {
            console.log('Marker clustering completed');
          }
        }
      });

      // Wait for map to be ready before adding cluster
      map.whenReady(() => {
        try {
          map.addLayer(markerClusterRef.current);
          console.log('Marker cluster layer added successfully');
        } catch (clusterError) {
          console.error('Error adding marker cluster:', clusterError);
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

  // Calculate proximity score for a property
  const calculateProximityForProperty = async (property) => {
    if (proximityScores[property.id]) {
      return;
    }

    setCalculatingProximity(property.id);
    
    try {
      console.log(`Calculating proximity score for: ${property.apartment_name || property.id}`);
      const score = await calculateProximityScore(property);
      
      setProximityScores(prev => ({
        ...prev,
        [property.id]: score
      }));
      
      console.log(`Proximity score calculated: ${score}% for ${property.apartment_name || property.id}`);
    } catch (error) {
      console.error('Error calculating proximity score:', error);
      setProximityScores(prev => ({
        ...prev,
        [property.id]: 0
      }));
    } finally {
      setCalculatingProximity(null);
    }
  };

  // Show nearby places based on selected proximity place
  const showNearbyPlaces = async (placeType, centerLat, centerLng) => {
    if (!mapRef.current || loadingNearby) return;

    setLoadingNearby(true);
    clearNearbyPlaces();

    try {
      console.log(`Loading nearby ${placeType} around ${centerLat}, ${centerLng}`);
      
      const query = buildOverpassQuery(placeType, centerLat, centerLng, 2000);
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: query,
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const layerGroup = L.layerGroup();
        
        // Place type icons and colors
        const placeConfig = {
          restaurant: { icon: '🍽️', color: '#ef4444' },
          health: { icon: '🏥', color: '#10b981' },
          school: { icon: '🎓', color: '#3b82f6' },
          convenience: { icon: '🏪', color: '#f97316' },
          transport: { icon: '🚌', color: '#8b5cf6' }
        };

        const config = placeConfig[placeType] || placeConfig.restaurant;

        data.elements.forEach(element => {
          let lat, lng, name = 'ไม่ระบุชื่อ';

          if (element.lat && element.lon) {
            lat = element.lat;
            lng = element.lon;
          } else if (element.center) {
            lat = element.center.lat;
            lng = element.center.lon;
          } else if (element.bounds) {
            lat = (element.bounds.minlat + element.bounds.maxlat) / 2;
            lng = (element.bounds.minlon + element.bounds.maxlon) / 2;
          }

          if (lat && lng) {
            if (element.tags) {
              name = element.tags.name || element.tags['name:th'] || element.tags['name:en'] || 'ไม่ระบุชื่อ';
            }

            const marker = L.circleMarker([lat, lng], {
              radius: 6,
              fillColor: config.color,
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            });

            // Simple popup without the complex tooltip functionality
            marker.bindPopup(`
              <div class="text-center">
                <div class="text-lg mb-1">${config.icon}</div>
                <div class="font-medium text-sm">${name}</div>
              </div>
            `, {
              closeButton: true,
              maxWidth: 200,
              className: 'simple-place-popup'
            });

            layerGroup.addLayer(marker);
          }
        });

        layerGroup.addTo(mapRef.current);
        nearbyLayersRef.current[placeType] = layerGroup;
        
        console.log(`Loaded ${data.elements.length} ${placeType} places`);
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
    if (selectedProximityPlace && showingNearbyPlaces && mapRef.current) {
      const center = mapRef.current.getCenter();
      showNearbyPlaces(selectedProximityPlace, center.lat, center.lng);
    } else {
      clearNearbyPlaces();
    }
  }, [selectedProximityPlace, showingNearbyPlaces]);

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

        // Add to arrays and cluster
        markersRef.current.push(marker);
        
        // Add to cluster with error handling
        try {
          markerClusterRef.current.addLayer(marker);
        } catch (clusterError) {
          console.error('Error adding marker to cluster:', clusterError);
          // Fallback: add directly to map if clustering fails
          marker.addTo(mapRef.current);
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
        } else {
          console.warn('Invalid coordinates for selected apartment:', selectedApartment.id);
        }
      } catch (pinnedError) {
        console.error('Error creating pinned marker:', pinnedError);
      }
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
  const createSimpleMarker = (property, isSelected, isHovered) => {
    const markerColor = getMarkerColor(property, colorScheme);
    const size = isSelected ? 12 : (isHovered ? 10 : 8);

    return {
      radius: size,
      fillColor: markerColor,
      color: '#ffffff',
      weight: isSelected ? 3 : 2,
      opacity: 1,
      fillOpacity: 0.9
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

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 border border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">สีแสดง{getColorSchemeName(colorScheme)}</div>
        <div className="space-y-1">
          {getColorSchemeLabels(colorScheme).map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border border-white" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

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

// Helper functions for legend
const getColorSchemeName = (colorScheme) => {
  switch (colorScheme) {
    case 'priceRange': return 'ช่วงราคา';
    case 'amenityScore': return 'คะแนนสิ่งอำนวยความสะดวก';
    case 'proximityScore': return 'คะแนนความใกล้เคียง';
    default: return 'ข้อมูล';
  }
};

const getColorSchemeLabels = (colorScheme) => {
  switch (colorScheme) {
    case 'priceRange':
      return [
        { color: '#22c55e', label: '< 5,000 บาท' },
        { color: '#84cc16', label: '5,000-10,000 บาท' },
        { color: '#eab308', label: '10,000-20,000 บาท' },
        { color: '#f97316', label: '20,000-30,000 บาท' },
        { color: '#ef4444', label: '> 30,000 บาท' }
      ];
    case 'amenityScore':
    case 'proximityScore':
      return [
        { color: '#10b981', label: 'สูง (80-100%)' },
        { color: '#f59e0b', label: 'ปานกลาง (60-79%)' },
        { color: '#ef4444', label: 'ต่ำ (40-59%)' },
        { color: '#6b7280', label: 'ต่ำมาก (0-39%)' }
      ];
    default:
      return [{ color: '#3b82f6', label: 'ข้อมูล' }];
  }
};

export default ApartmentMap;
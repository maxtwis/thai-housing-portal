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

const ApartmentMap = ({ 
  apartmentData = [], 
  filters = {}, 
  colorScheme = 'priceRange', 
  isMobile = false, 
  selectedApartment = null, 
  onApartmentSelect = () => {},
  calculateFacilityScore = () => 0
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const nearbyLayersRef = useRef({});
  const [loadingNearby, setLoadingNearby] = useState(false);
  const hasZoomedToMarker = useRef(false); // Track if we've zoomed to a marker
  const isInitialLoad = useRef(true); // Track initial load

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
        if (price < 5000) return '#22c55e';  // Green - Budget
        if (price < 10000) return '#84cc16'; // Light green
        if (price < 20000) return '#eab308'; // Yellow
        if (price < 30000) return '#f97316'; // Orange
        return '#ef4444'; // Red - Expensive
      },
      roomType: () => {
        const roomTypeColors = {
          'หอพัก': '#3b82f6',
          'แมนชั่น': '#8b5cf6',
          'อพาร์ตเมนต์': '#06b6d4',
          'คอนโด': '#f59e0b'
        };
        return roomTypeColors[apartment.room_type] || '#6b7280';
      },
      facilityScore: () => {
        const score = calculateFacilityScore(apartment);
        if (score >= 80) return '#059669';  // High score - green
        if (score >= 60) return '#0891b2';  // Medium-high - blue
        if (score >= 40) return '#ca8a04';  // Medium - yellow
        if (score >= 20) return '#ea580c';  // Low - orange
        return '#dc2626';  // Very low - red
      },
      size: () => {
        const size = apartment.size_max || apartment.size_min || 0;
        if (size >= 50) return '#7c3aed';   // Large - purple
        if (size >= 35) return '#2563eb';   // Medium-large - blue
        if (size >= 25) return '#059669';   // Medium - green
        if (size >= 15) return '#ea580c';   // Small - orange
        return '#dc2626';  // Very small - red
      }
    };
    
    return schemes[colorScheme] ? schemes[colorScheme]() : schemes.priceRange();
  };

  // Generate popup content for apartment markers
  const generatePopupContent = (apartment) => {
    const facilityScore = calculateFacilityScore(apartment);
    
    return `
      <div style="max-width: 280px; padding: 0; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: #f8fafc; padding: 12px; margin: -20px -20px 12px -20px; border-bottom: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1e293b;">${apartment.apartment_name}</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
            <span style="background: #dbeafe; color: #1e40af; font-size: 12px; padding: 2px 8px; border-radius: 4px;">${apartment.room_type || 'N/A'}</span>
            <span style="background: #dcfce7; color: #166534; font-size: 12px; padding: 2px 8px; border-radius: 4px;">฿${apartment.price_min?.toLocaleString() || 'N/A'}/เดือน</span>
            <span style="background: #fef3c7; color: #92400e; font-size: 12px; padding: 2px 8px; border-radius: 4px;">${apartment.size_max || apartment.size_min || 'N/A'} ตร.ม.</span>
          </div>
          <div style="background: #e2e8f0; padding: 6px; border-radius: 4px;">
            <p style="margin: 0; font-size: 12px; color: #475569;">คะแนนสิ่งอำนวยความสะดวก: <strong>${facilityScore}%</strong></p>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <p style="font-size: 13px; font-weight: 500; color: #374151; margin: 0 0 6px 0;">สิ่งอำนวยความสะดวก:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${apartment.facility_wifi ? '<span style="background: #ddd6fe; color: #5b21b6; font-size: 12px; padding: 2px 8px; border-radius: 4px;">WiFi</span>' : ''}
            ${apartment.facility_parking ? '<span style="background: #e0e7ff; color: #3730a3; font-size: 12px; padding: 2px 8px; border-radius: 4px;">ที่จอดรถ</span>' : ''}
            ${apartment.facility_aircondition ? '<span style="background: #f3e8ff; color: #7c2d12; font-size: 12px; padding: 2px 8px; border-radius: 4px;">AC</span>' : ''}
            ${apartment.facility_pool ? '<span style="background: #ecfeff; color: #0891b2; font-size: 12px; padding: 2px 8px; border-radius: 4px;">Pool</span>' : ''}
            ${apartment.facility_gym ? '<span style="background: #fed7aa; color: #ea580c; font-size: 12px; padding: 2px 8px; border-radius: 4px;">Gym</span>' : ''}
            ${apartment.facility_security ? '<span style="background: #fecaca; color: #dc2626; font-size: 12px; padding: 2px 8px; border-radius: 4px;">Security</span>' : ''}
          </div>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;">${apartment.address || 'Address not available'}</p>
          <button 
            onclick="window.apartmentMapInstance && window.apartmentMapInstance.showNearbyPlaces(${apartment.latitude}, ${apartment.longitude})" 
            style="font-size: 12px; background: #2563eb; color: white; padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer;"
          >
            Show What's Nearby
          </button>
        </div>
      </div>
    `;
  };

  // Show nearby places function
  const showNearbyPlaces = async (lat, lng) => {
    if (!mapRef.current) return;

    setLoadingNearby(true);
    
    try {
      // Clear existing nearby data
      clearNearbyPlaces();

      // Overpass API query for nearby amenities
      const radius = 500; // 500 meters
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"~"^(restaurant|cafe|convenience|school|hospital|bank|atm)$"](around:${radius},${lat},${lng});
          node["shop"~"^(supermarket|convenience|department_store)$"](around:${radius},${lat},${lng});
          node["public_transport"~"^(platform|station)$"](around:${radius},${lat},${lng});
        );
        out geom;
      `;
      
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
      const data = await response.json();

      // Group places by category
      const categories = {
        'ร้านอาหาร': { places: [], color: '#ef4444' },
        'ร้านสะดวกซื้อ': { places: [], color: '#22c55e' },
        'โรงพยาบาล': { places: [], color: '#3b82f6' },
        'ธนาคาร/ATM': { places: [], color: '#f59e0b' },
        'ขนส่งสาธารณะ': { places: [], color: '#8b5cf6' }
      };

      data.elements.forEach(element => {
        const amenity = element.tags.amenity;
        const shop = element.tags.shop;
        const transport = element.tags.public_transport;

        if (amenity === 'restaurant' || amenity === 'cafe') {
          categories['ร้านอาหาร'].places.push(element);
        } else if (amenity === 'convenience' || shop === 'convenience' || shop === 'supermarket') {
          categories['ร้านสะดวกซื้อ'].places.push(element);
        } else if (amenity === 'hospital') {
          categories['โรงพยาบาล'].places.push(element);
        } else if (amenity === 'bank' || amenity === 'atm') {
          categories['ธนาคาร/ATM'].places.push(element);
        } else if (transport) {
          categories['ขนส่งสาธารณะ'].places.push(element);
        }
      });

      // Add markers for each category
      Object.entries(categories).forEach(([categoryName, category]) => {
        if (category.places.length === 0) return;

        const layerGroup = L.layerGroup();

        category.places.forEach(place => {
          const marker = L.circleMarker([place.lat, place.lon], {
            radius: 6,
            fillColor: category.color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          });

          const popupContent = `
            <div style="font-family: system-ui, -apple-system, sans-serif;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">${place.tags.name || categoryName}</h4>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">ประเภท: ${categoryName}</p>
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
        mapRef.current = null;
      }
    };
  }, [isMobile]);

  // Create simple, clean custom marker icon
  const createCustomMarker = (apartment, isSelected, isHover = false) => {
    const markerColor = getMarkerColor(apartment);
    const size = isSelected || isHover ? 24 : 20;
    const borderWidth = isSelected ? 3 : 2;
    const borderColor = isSelected ? '#ffffff' : '#ffffff';
    
    // Create a simple, clean pin-style marker
    const markerHtml = `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size + 8}px;
        cursor: pointer;
        transform: translate(-50%, -100%);
      ">
        <!-- Drop shadow -->
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: ${size * 0.8}px;
          height: 3px;
          background: rgba(0,0,0,0.2);
          border-radius: 50%;
          filter: blur(1px);
        "></div>
        
        <!-- Main circle -->
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${markerColor};
          border: ${borderWidth}px solid ${borderColor};
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          position: relative;
          top: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <!-- Inner dot -->
          <div style="
            width: ${size * 0.3}px;
            height: ${size * 0.3}px;
            background: ${borderColor};
            border-radius: 50%;
          "></div>
        </div>
        
        <!-- Pin pointer -->
        <div style="
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 8px solid ${markerColor};
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        "></div>
      </div>
    `;

    return L.divIcon({
      html: markerHtml,
      className: 'custom-clean-marker',
      iconSize: [size, size + 8],
      iconAnchor: [size/2, size + 8],
      popupAnchor: [0, -(size + 8)]
    });
  };

  // Alternative: Use Font Awesome or Unicode icons
  const createIconMarker = (apartment, isSelected, isHover = false) => {
    const markerColor = getMarkerColor(apartment);
    const size = isSelected || isHover ? 32 : 28;
    const borderColor = isSelected ? '#ffffff' : '#ffffff';
    
    const markerHtml = `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        cursor: pointer;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Background circle -->
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${markerColor};
          border: 2px solid ${borderColor};
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <!-- Building icon (Unicode) -->
          <span style="
            font-size: ${size * 0.5}px;
            color: ${borderColor};
            font-weight: bold;
            line-height: 1;
          ">🏢</span>
        </div>
      </div>
    `;

    return L.divIcon({
      html: markerHtml,
      className: 'custom-icon-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2]
    });
  };

  // Update apartment markers when data or filters change (but NOT when apartment is selected)
  useEffect(() => {
    if (!mapRef.current || !apartmentData) return;

    console.log('Updating markers, selectedApartment:', selectedApartment?.apartment_name, 'hasZoomedToMarker:', hasZoomedToMarker.current);

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for filtered apartments
    apartmentData.forEach(apartment => {
      if (!apartment.latitude || !apartment.longitude) return;

      const isSelected = selectedApartment && selectedApartment.apartment_id === apartment.apartment_id;

      // Create custom marker using the clean style
      const customIcon = createCustomMarker(apartment, isSelected, false);

      // Create marker with custom icon
      const marker = L.marker([apartment.latitude, apartment.longitude], {
        icon: customIcon
      });

      // Store apartment data on the marker for reference
      marker.apartmentData = apartment;
      marker.isHovered = false;

      marker.bindPopup(generatePopupContent(apartment));

      // CLICK HANDLER
      marker.on('click', (e) => {
        console.log('Marker clicked!', apartment.apartment_name);
        
        // Prevent event bubbling
        L.DomEvent.stopPropagation(e);
        
        // Set flag to prevent fitBounds
        hasZoomedToMarker.current = true;
        
        // Set selected apartment
        if (onApartmentSelect) {
          onApartmentSelect(apartment);
        }
        
        // Zoom to the selected apartment marker
        console.log('Zooming to:', apartment.latitude, apartment.longitude);
        
        // Use panTo + setZoom for more reliable zooming
        mapRef.current.panTo([apartment.latitude, apartment.longitude]);
        setTimeout(() => {
          mapRef.current.setZoom(16);
        }, 300);
      });

      // FIXED HOVER EFFECT - only changes size, keeps color
      if (!isMobile) {
        marker.on('mouseover', () => {
          marker.isHovered = true;
          const hoverIcon = createCustomMarker(apartment, isSelected, true);
          marker.setIcon(hoverIcon);
        });

        marker.on('mouseout', () => {
          marker.isHovered = false;
          const normalIcon = createCustomMarker(apartment, isSelected, false);
          marker.setIcon(normalIcon);
        });
      }

      marker.addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    // CRITICAL FIX: Only fit bounds on initial load and when no apartment is selected
    // AND when we haven't manually zoomed to a marker
    if (isInitialLoad.current && !selectedApartment && !hasZoomedToMarker.current && markersRef.current.length > 0) {
      console.log('Fitting bounds to all markers (initial load)');
      const group = new L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
      isInitialLoad.current = false;
    } else {
      console.log('Skipping fitBounds - selectedApartment:', !!selectedApartment, 'hasZoomedToMarker:', hasZoomedToMarker.current);
    }

  }, [apartmentData, colorScheme, isMobile]); // Keep selectedApartment OUT of dependencies

  // Separate effect ONLY for updating marker icons when selection changes
  useEffect(() => {
    if (!mapRef.current || !selectedApartment) return;

    console.log('Updating marker icons for selected apartment:', selectedApartment.apartment_name);

    // Update marker icons without recreating them or changing map view
    markersRef.current.forEach(marker => {
      const apartment = apartmentData.find(apt => 
        Math.abs(apt.latitude - marker.getLatLng().lat) < 0.0001 && 
        Math.abs(apt.longitude - marker.getLatLng().lng) < 0.0001
      );
      
      if (apartment) {
        const isSelected = apartment.apartment_id === selectedApartment.apartment_id;
        const isHovered = marker.isHovered || false;
        const updatedIcon = createCustomMarker(apartment, isSelected, isHovered);
        marker.setIcon(updatedIcon);
      }
    });

  }, [selectedApartment, apartmentData]); // This effect ONLY handles icon updates

  // Reset zoom flag when filters change (but not when apartment selection changes)
  useEffect(() => {
    hasZoomedToMarker.current = false;
    console.log('Reset zoom flag due to filter/data change');
  }, [apartmentData, colorScheme]);

  // Add a manual zoom function for debugging
  const zoomToApartment = (apartment) => {
    if (!mapRef.current || !apartment) return;
    
    console.log('Manual zoom function called for:', apartment.apartment_name);
    hasZoomedToMarker.current = true;
    
    try {
      // Close any open popups first
      mapRef.current.closePopup();
      
      // Use panTo + setZoom for reliability
      mapRef.current.panTo([apartment.latitude, apartment.longitude]);
      setTimeout(() => {
        mapRef.current.setZoom(16);
      }, 300);
      
    } catch (error) {
      console.error('Manual zoom error:', error);
    }
  };

  // Function to reset view to show all markers
  const resetView = () => {
    hasZoomedToMarker.current = false;
    if (onApartmentSelect) {
      onApartmentSelect(null); // Clear selection
    }
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  // Expose zoom function to window for debugging
  useEffect(() => {
    window.apartmentMapInstance = {
      showNearbyPlaces,
      clearNearbyPlaces,
      zoomToApartment, // Add this for debugging
      resetView, // Add reset function
      mapRef: mapRef.current
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden relative h-full">
      {loadingNearby && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-md shadow z-10">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">กำลังค้นหาสถานที่ใกล้เคียง...</span>
          </div>
        </div>
      )}
      
      {/* Debug panel - remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-2 py-1 text-xs z-10 rounded">
          <div>Markers: {markersRef.current.length}</div>
          <div>Selected: {selectedApartment ? selectedApartment.apartment_name : 'None'}</div>
          <div>Zoomed: {hasZoomedToMarker.current ? 'Yes' : 'No'}</div>
          {selectedApartment && (
            <div className="flex gap-1 mt-1">
              <button 
                onClick={() => zoomToApartment(selectedApartment)}
                className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
              >
                Manual Zoom
              </button>
              <button 
                onClick={resetView}
                className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
              >
                Reset View
              </button>
            </div>
          )}
        </div>
      )}
      
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
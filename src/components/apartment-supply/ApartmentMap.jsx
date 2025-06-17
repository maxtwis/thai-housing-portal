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

  // Update apartment markers when data or filters change (but NOT when apartment is selected)
  useEffect(() => {
    if (!mapRef.current || !apartmentData) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for filtered apartments
    apartmentData.forEach(apartment => {
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
        // Zoom to the selected apartment marker - THIS IS THE KEY FIX
        mapRef.current.setView([apartment.latitude, apartment.longitude], 16, {
          animate: true,
          duration: 0.5
        });
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

    // Only fit bounds on initial load or filter changes (NOT when apartment is selected)
    if (!selectedApartment && markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [apartmentData, colorScheme, isMobile]); // REMOVED selectedApartment from dependencies

  // Separate effect to handle selected apartment styling without refitting bounds
  useEffect(() => {
    if (!mapRef.current || !selectedApartment) return;

    // Update marker styles without recreating them
    markersRef.current.forEach(marker => {
      const apartment = apartmentData.find(apt => 
        Math.abs(apt.latitude - marker.getLatLng().lat) < 0.0001 && 
        Math.abs(apt.longitude - marker.getLatLng().lng) < 0.0001
      );
      
      if (apartment) {
        const isSelected = apartment.apartment_id === selectedApartment.apartment_id;
        marker.setStyle({
          radius: isSelected ? 12 : 8,
          color: isSelected ? '#000' : '#fff',
          weight: isSelected ? 3 : 2
        });
      }
    });
  }, [selectedApartment, apartmentData]); // This effect only handles styling

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
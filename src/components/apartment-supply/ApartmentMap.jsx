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
  apartmentData, 
  colorScheme = 'priceRange', 
  isMobile, 
  onApartmentSelect, 
  selectedApartment 
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const nearbyLayersRef = useRef({});
  const isInitialLoad = useRef(true);
  const hasZoomedToMarker = useRef(false);
  
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Dynamic height calculation based on viewport
  const getMapHeight = () => {
    if (isMobile) {
      return "60vh";
    } else {
      return "calc(100vh - 150px)";
    }
  };

  // Calculate facility score
  const calculateFacilityScore = (apartment) => {
    const facilities = [
      'facility_wifi',
      'facility_parking', 
      'facility_aircondition',
      'facility_pool',
      'facility_gym',
      'facility_security',
      'facility_elevator',
      'facility_waterheater',
      'facility_laundry',
      'facility_cctv'
    ];
    
    const availableFacilities = facilities.filter(facility => apartment[facility]);
    return Math.round((availableFacilities.length / facilities.length) * 100);
  };

  // Enhanced popup content generator for apartment markers
  const generatePopupContent = (apartment) => {
    const facilityScore = calculateFacilityScore(apartment);
    
    // Helper function to format price range
    const formatPriceRange = () => {
      if (apartment.price_min && apartment.price_max && apartment.price_min !== apartment.price_max) {
        return `฿${apartment.price_min?.toLocaleString()} - ฿${apartment.price_max?.toLocaleString()}`;
      } else if (apartment.price_min) {
        return `฿${apartment.price_min?.toLocaleString()}`;
      }
      return 'ราคาไม่ระบุ';
    };

    // Helper function to format size range
    const formatSizeRange = () => {
      if (apartment.size_min && apartment.size_max && apartment.size_min !== apartment.size_max) {
        return `${apartment.size_min} - ${apartment.size_max} ตร.ม.`;
      } else if (apartment.size_max || apartment.size_min) {
        return `${apartment.size_max || apartment.size_min} ตร.ม.`;
      }
      return 'ขนาดไม่ระบุ';
    };

    // Facility icons mapping
    const facilityIcons = {
      wifi: '📶',
      parking: '🚗',
      aircondition: '❄️',
      pool: '🏊‍♂️',
      gym: '💪',
      security: '🔒',
      elevator: '🛗',
      waterheater: '🚿',
      laundry: '👕',
      cctv: '📹'
    };

    // Get available facilities
    const facilities = [];
    if (apartment.facility_wifi) facilities.push({ key: 'wifi', label: 'WiFi', icon: facilityIcons.wifi });
    if (apartment.facility_parking) facilities.push({ key: 'parking', label: 'ที่จอดรถ', icon: facilityIcons.parking });
    if (apartment.facility_aircondition) facilities.push({ key: 'aircondition', label: 'เครื่องปรับอากาศ', icon: facilityIcons.aircondition });
    if (apartment.facility_pool) facilities.push({ key: 'pool', label: 'สระว่ายน้ำ', icon: facilityIcons.pool });
    if (apartment.facility_gym) facilities.push({ key: 'gym', label: 'ห้องออกกำลังกาย', icon: facilityIcons.gym });
    if (apartment.facility_security) facilities.push({ key: 'security', label: 'รปภ. 24 ชั่วโมง', icon: facilityIcons.security });
    if (apartment.facility_elevator) facilities.push({ key: 'elevator', label: 'ลิฟต์', icon: facilityIcons.elevator });
    if (apartment.facility_waterheater) facilities.push({ key: 'waterheater', label: 'เครื่องทำน้ำอุ่น', icon: facilityIcons.waterheater });
    if (apartment.facility_laundry) facilities.push({ key: 'laundry', label: 'ห้องซักรีด', icon: facilityIcons.laundry });
    if (apartment.facility_cctv) facilities.push({ key: 'cctv', label: 'กล้องวงจรปิด', icon: facilityIcons.cctv });

    // Facility score color
    const getScoreColor = (score) => {
      if (score >= 80) return '#10b981'; // green
      if (score >= 60) return '#f59e0b'; // yellow
      if (score >= 40) return '#ef4444'; // orange
      return '#6b7280'; // gray
    };

    return `
      <div style="
        max-width: 320px; 
        padding: 0; 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      ">
        <!-- Header Section -->
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 16px;
          color: white;
          position: relative;
          overflow: hidden;
        ">
          <div style="position: absolute; top: -50%; right: -50%; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
          <div style="position: relative; z-index: 1;">
            <h3 style="
              margin: 0 0 8px 0; 
              font-size: 18px; 
              font-weight: 700; 
              line-height: 1.3;
              text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            ">${apartment.apartment_name}</h3>
            
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <div style="
                background: rgba(255,255,255,0.2); 
                backdrop-filter: blur(10px);
                padding: 4px 10px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: 600;
                border: 1px solid rgba(255,255,255,0.3);
              ">${apartment.room_type || 'ห้องพัก'}</div>
              
              <div style="
                background: rgba(255,255,255,0.2); 
                backdrop-filter: blur(10px);
                padding: 4px 10px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: 600;
                border: 1px solid rgba(255,255,255,0.3);
              ">${formatSizeRange()}</div>
            </div>

            <div style="
              font-size: 20px; 
              font-weight: 800; 
              color: #fff;
              text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            ">${formatPriceRange()}<span style="font-size: 14px; font-weight: 500;">/เดือน</span></div>
          </div>
        </div>

        <!-- Content Section -->
        <div style="padding: 16px;">
          <!-- Facility Score -->
          <div style="
            background: linear-gradient(90deg, rgba(${getScoreColor(facilityScore).replace('#', '')}, 0.1) 0%, rgba(${getScoreColor(facilityScore).replace('#', '')}, 0.05) 100%);
            border: 1px solid rgba(${getScoreColor(facilityScore).replace('#', '')}, 0.2);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            text-align: center;
          ">
            <div style="
              font-size: 24px; 
              font-weight: 800; 
              color: ${getScoreColor(facilityScore)};
              margin-bottom: 4px;
            ">${facilityScore}%</div>
            <div style="
              font-size: 12px; 
              color: #6b7280; 
              font-weight: 500;
            ">คะแนนสิ่งอำนวยความสะดวก</div>
          </div>

          <!-- Facilities Grid -->
          ${facilities.length > 0 ? `
            <div style="margin-bottom: 16px;">
              <h4 style="
                margin: 0 0 12px 0; 
                font-size: 14px; 
                font-weight: 600; 
                color: #374151;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <span style="font-size: 16px;">✨</span>
                สิ่งอำนวยความสะดวก
              </h4>
              
              <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 8px;
              ">
                ${facilities.map(facility => `
                  <div style="
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                  ">
                    <span style="font-size: 16px;">${facility.icon}</span>
                    <span style="
                      font-size: 12px; 
                      color: #475569; 
                      font-weight: 500;
                      line-height: 1.2;
                    ">${facility.label}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div style="
              text-align: center;
              padding: 20px;
              color: #9ca3af;
              font-size: 14px;
            ">
              <div style="font-size: 24px; margin-bottom: 8px;">🏢</div>
              ไม่มีข้อมูลสิ่งอำนวยความสะดวก
            </div>
          `}

          <!-- Address Section -->
          ${apartment.address ? `
            <div style="
              background: #f1f5f9;
              border-left: 4px solid #3b82f6;
              padding: 12px;
              border-radius: 0 8px 8px 0;
              margin-bottom: 16px;
            ">
              <div style="
                display: flex;
                align-items: flex-start;
                gap: 8px;
              ">
                <span style="font-size: 16px; margin-top: 2px;">📍</span>
                <div>
                  <div style="
                    font-size: 12px; 
                    color: #475569; 
                    font-weight: 500; 
                    margin-bottom: 4px;
                  ">ที่อยู่</div>
                  <div style="
                    font-size: 13px; 
                    color: #1e293b; 
                    line-height: 1.4;
                  ">${apartment.address}</div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div style="
            display: flex;
            gap: 8px;
            margin-top: 16px;
          ">
            <button onclick="window.apartmentMapInstance && window.apartmentMapInstance.showNearbyPlaces && window.apartmentMapInstance.showNearbyPlaces('restaurant')" style="
              flex: 1;
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white;
              border: none;
              border-radius: 8px;
              padding: 10px 12px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(59, 130, 246, 0.4)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(59, 130, 246, 0.3)'">
              🍴 ร้านอาหารใกล้เคียง
            </button>
            
            <button onclick="window.apartmentMapInstance && window.apartmentMapInstance.showNearbyPlaces && window.apartmentMapInstance.showNearbyPlaces('convenience')" style="
              flex: 1;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              border: none;
              border-radius: 8px;
              padding: 10px 12px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(16, 185, 129, 0.4)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(16, 185, 129, 0.3)'">
              🏪 ร้านสะดวกซื้อ
            </button>
          </div>
        </div>
      </div>
    `;
  };

  // Get marker color based on apartment data and color scheme
  const getMarkerColor = (apartment) => {
    const schemes = {
      priceRange: () => {
        const price = apartment.price_min || 0;
        if (price < 5000) return '#10b981'; // green
        if (price < 10000) return '#f59e0b'; // amber
        if (price < 20000) return '#ef4444'; // red
        return '#8b5cf6'; // purple
      },
      facilityScore: () => {
        const score = calculateFacilityScore(apartment);
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        if (score >= 40) return '#ef4444';
        return '#6b7280';
      },
      roomType: () => {
        const typeColors = {
          'Studio': '#8b5cf6',
          '1 Bedroom': '#3b82f6',
          '2 Bedroom': '#10b981',
          '3 Bedroom': '#f59e0b',
          'Condo': '#ef4444'
        };
        return typeColors[apartment.room_type] || '#6b7280';
      }
    };

    return schemes[colorScheme] ? schemes[colorScheme]() : schemes.priceRange();
  };

  // Create simple circle marker options
  const createSimpleMarker = (apartment, isSelected, isHover = false) => {
    const markerColor = getMarkerColor(apartment);
    const size = isSelected || isHover ? 12 : 8;

    return {
      radius: size,
      fillColor: markerColor,
      color: '#ffffff',
      weight: isSelected ? 3 : 2,
      opacity: 1,
      fillOpacity: 0.9
    };
  };

  // Show nearby places function
  const showNearbyPlaces = async (category = 'restaurant') => {
    if (!mapRef.current) return;

    setLoadingNearby(true);
    
    try {
      clearNearbyPlaces();

      const center = mapRef.current.getCenter();
      const radius = 500; // 500 meters

      // Category-specific queries
      const queries = {
        restaurant: 'node["amenity"~"^(restaurant|cafe|fast_food)$"]',
        convenience: 'node["shop"~"^(convenience|supermarket)$"]',
        transport: 'node["public_transport"="stop_position"]'
      };

      const overpassQuery = `
        [out:json][timeout:25];
        (
          ${queries[category] || queries.restaurant}
          (around:${radius},${center.lat},${center.lng});
        );
        out geom;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
      });

      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const layerGroup = L.layerGroup();
        
        data.elements.forEach(place => {
          if (place.lat && place.lon) {
            const marker = L.circleMarker([place.lat, place.lon], {
              radius: 6,
              fillColor: category === 'restaurant' ? '#ef4444' : category === 'convenience' ? '#10b981' : '#3b82f6',
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            });

            const popupContent = `
              <div style="padding: 8px; min-width: 200px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">
                  ${place.tags.name || place.tags.amenity || place.tags.shop || 'สถานที่'}
                </h4>
                ${place.tags.cuisine ? `<p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">Cuisine: ${place.tags.cuisine}</p>` : ''}
                ${place.tags?.opening_hours ? `<p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">Hours: ${place.tags.opening_hours}</p>` : ''}
              </div>
            `;

            marker.bindPopup(popupContent);
            marker.addTo(layerGroup);
          }
        });

        nearbyLayersRef.current[category] = layerGroup;
        layerGroup.addTo(mapRef.current);
      }

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

  // Update apartment markers when data or filters change
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

      // Use CircleMarker for better accuracy and reliability
      const markerOptions = createSimpleMarker(apartment, isSelected, false);
      
      const marker = L.circleMarker([apartment.latitude, apartment.longitude], markerOptions);

      // Store apartment data on the marker for reference
      marker.apartmentData = apartment;
      marker.isHovered = false;

      // Enhanced popup binding options
      const popupOptions = {
        closeButton: true,
        autoClose: true,
        closeOnEscapeKey: true,
        maxWidth: 340,
        minWidth: 300,
        offset: [0, -12],
        className: 'custom-apartment-popup',
        autoPanPadding: [10, 10]
      };

      // Bind popup with enhanced content
      marker.bindPopup(generatePopupContent(apartment), popupOptions);

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

      // HOVER EFFECTS - only changes size, keeps color
      if (!isMobile) {
        marker.on('mouseover', () => {
          marker.isHovered = true;
          const hoverOptions = createSimpleMarker(apartment, isSelected, true);
          marker.setStyle(hoverOptions);
        });

        marker.on('mouseout', () => {
          marker.isHovered = false;
          const normalOptions = createSimpleMarker(apartment, isSelected, false);
          marker.setStyle(normalOptions);
        });
      }

      marker.addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    // Only fit bounds on initial load and when no apartment is selected
    if (isInitialLoad.current && !selectedApartment && !hasZoomedToMarker.current && markersRef.current.length > 0) {
      console.log('Fitting bounds to all markers (initial load)');
      const group = new L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
      isInitialLoad.current = false;
    } else {
      console.log('Skipping fitBounds - selectedApartment:', !selectedApartment, 'hasZoomedToMarker:', hasZoomedToMarker.current);
    }

  }, [apartmentData, colorScheme, isMobile]);

  // Separate effect for updating marker styles when selection changes
  useEffect(() => {
    if (!mapRef.current || !selectedApartment) return;

    console.log('Updating marker styles for selected apartment:', selectedApartment.apartment_name);

    // Update marker styles without recreating them
    markersRef.current.forEach(marker => {
      const apartment = apartmentData.find(apt => 
        Math.abs(apt.latitude - marker.getLatLng().lat) < 0.0001 && 
        Math.abs(apt.longitude - marker.getLatLng().lng) < 0.0001
      );
      
      if (apartment) {
        const isSelected = apartment.apartment_id === selectedApartment.apartment_id;
        const isHovered = marker.isHovered || false;
        const updatedOptions = createSimpleMarker(apartment, isSelected, isHovered);
        marker.setStyle(updatedOptions);
      }
    });

  }, [selectedApartment, apartmentData]);

  // Reset zoom flag when filters change
  useEffect(() => {
    hasZoomedToMarker.current = false;
    console.log('Reset zoom flag due to filter/data change');
  }, [apartmentData, colorScheme]);

  // Manual zoom function for debugging
  const zoomToApartment = (apartment) => {
    if (!mapRef.current || !apartment) return;
    
    console.log('Manual zoom function called for:', apartment.apartment_name);
    hasZoomedToMarker.current = true;
    
    try {
      mapRef.current.closePopup();
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
      onApartmentSelect(null);
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
      zoomToApartment,
      resetView,
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

      {/* Custom CSS for enhanced popup styling */}
      <style jsx>{`
        :global(.custom-apartment-popup .leaflet-popup-content-wrapper) {
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.1) !important;
          border: none !important;
          background: white !important;
        }
        
        :global(.custom-apartment-popup .leaflet-popup-content) {
          margin: 0 !important;
          width: auto !important;
        }
        
        :global(.custom-apartment-popup .leaflet-popup-tip) {
          background: white !important;
          border: none !important;
          box-shadow: -2px 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        :global(.custom-apartment-popup .leaflet-popup-close-button) {
          position: absolute !important;
          top: 12px !important;
          right: 12px !important;
          color: white !important;
          font-size: 20px !important;
          font-weight: bold !important;
          background: rgba(0,0,0,0.3) !important;
          border-radius: 50% !important;
          width: 28px !important;
          height: 28px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-decoration: none !important;
          z-index: 10 !important;
          transition: all 0.2s ease !important;
        }
        
        :global(.custom-apartment-popup .leaflet-popup-close-button:hover) {
          background: rgba(0,0,0,0.5) !important;
          transform: scale(1.1) !important;
        }

        :global(.poi-popup .leaflet-popup-content-wrapper) {
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        }
        
        :global(.poi-popup .leaflet-popup-content) {
          margin: 0 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
      `}</style>
    </div>
  );
};

export default ApartmentMap;
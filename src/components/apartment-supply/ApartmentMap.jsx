import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import marker clustering
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

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
  const markerClusterRef = useRef(null);
  const nearbyLayersRef = useRef({});
  const isInitialLoad = useRef(true);
  const hasZoomedToMarker = useRef(false);
  
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyNotification, setNearbyNotification] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.7563, 100.5018], // Bangkok default
      zoom: 10,
      zoomControl: !isMobile,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      dragging: true,
      tap: true,
      boxZoom: false
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

    // Custom popup positioning to prevent clipping
    map.on('popupopen', function(e) {
      const popup = e.popup;
      const popupLatLng = popup.getLatLng();
      const popupPoint = map.latLngToContainerPoint(popupLatLng);
      const mapSize = map.getSize();
      
      // Check if popup would be clipped at the top
      if (popupPoint.y < 200) {
        // Adjust the popup offset to open below the marker instead
        popup.options.offset = [0, 25];
        popup.update();
      } else {
        // Default offset (above the marker)
        popup.options.offset = [0, -8];
        popup.update();
      }
    });

    // Initialize marker cluster group with custom options
    const markerCluster = L.markerClusterGroup({
      // Clustering options
      maxClusterRadius: 50, // Maximum radius for clustering (in pixels)
      spiderfyOnMaxZoom: true, // Show all markers when zoomed to max and clicked
      showCoverageOnHover: false, // Don't show cluster area on hover
      zoomToBoundsOnClick: true, // Zoom to cluster bounds when clicked
      spiderfyDistanceMultiplier: 1.2, // Distance multiplier for spider
      removeOutsideVisibleBounds: true, // Remove markers outside visible bounds for performance
      
      // Custom cluster icon creation
      iconCreateFunction: function(cluster) {
        const childCount = cluster.getChildCount();
        let c = ' marker-cluster-';
        
        // Size and color based on cluster size
        if (childCount < 10) {
          c += 'small';
        } else if (childCount < 100) {
          c += 'medium';
        } else {
          c += 'large';
        }

        return new L.DivIcon({
          html: '<div><span>' + childCount + '</span></div>',
          className: 'marker-cluster' + c,
          iconSize: new L.Point(40, 40)
        });
      }
    });

    markerClusterRef.current = markerCluster;
    map.addLayer(markerCluster);
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

  // Color scheme logic
  const getMarkerColor = (apartment) => {
    const schemes = {
      priceRange: () => {
        const price = apartment.price_min || 0;
        if (price <= 5000) return '#22c55e'; // Green - Low price
        if (price <= 10000) return '#eab308'; // Yellow - Medium price
        if (price <= 20000) return '#f97316'; // Orange - High price
        return '#ef4444'; // Red - Very high price
      },
      roomType: () => {
        const roomType = apartment.room_type || '';
        switch (roomType.toLowerCase()) {
          case 'studio': return '#8b5cf6'; // Purple
          case '1 bedroom': return '#06b6d4'; // Cyan
          case '2 bedroom': return '#10b981'; // Emerald
          case '3 bedroom': return '#f59e0b'; // Amber
          default: return '#6b7280'; // Gray
        }
      },
      facilityScore: () => {
        const score = calculateFacilityScore(apartment);
        if (score >= 80) return '#22c55e'; // Green - Excellent
        if (score >= 60) return '#eab308'; // Yellow - Good
        if (score >= 40) return '#f97316'; // Orange - Fair
        return '#ef4444'; // Red - Poor
      }
    };
    
    return colorScheme in schemes ? schemes[colorScheme]() : schemes.priceRange();
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
            ">${apartment.apartment_name || 'ไม่ระบุชื่อ'}</h3>
            
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
            <div style="
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 8px;
              margin-bottom: 16px;
            ">
              ${facilities.slice(0, 6).map(facility => `
                <div style="
                  display: flex; 
                  flex-direction: column; 
                  align-items: center; 
                  text-align: center;
                  padding: 8px;
                  background: #f8fafc;
                  border-radius: 6px;
                  border: 1px solid #e2e8f0;
                ">
                  <div style="font-size: 16px; margin-bottom: 4px;">${facility.icon}</div>
                  <div style="font-size: 10px; color: #64748b; font-weight: 500;">${facility.label}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div style="
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr;
            gap: 6px;
            margin-bottom: 12px;
          ">
            <button onclick="window.apartmentMapInstance?.showNearbyPlaces('restaurant')" 
                    style="
                      background: #ef4444; 
                      color: white; 
                      border: none;
                      padding: 8px 4px; 
                      border-radius: 6px; 
                      font-size: 11px; 
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s;
                    ">
              🍽️ ร้านอาหาร
            </button>
            <button onclick="window.apartmentMapInstance?.showNearbyPlaces('convenience')" 
                    style="
                      background: #10b981; 
                      color: white; 
                      border: none;
                      padding: 8px 4px; 
                      border-radius: 6px; 
                      font-size: 11px; 
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s;
                    ">
              🏪 ร้านสะดวกซื้อ
            </button>
            <button onclick="window.apartmentMapInstance?.showNearbyPlaces('school')" 
                    style="
                      background: #8b5cf6; 
                      color: white; 
                      border: none;
                      padding: 8px 4px; 
                      border-radius: 6px; 
                      font-size: 11px; 
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s;
                    ">
              🎓 โรงเรียน
            </button>
          </div>

          <!-- Clear button -->
          <button onclick="window.apartmentMapInstance?.clearNearbyPlaces()" 
                  style="
                    background: #6b7280; 
                    color: white; 
                    border: none;
                    padding: 6px 12px; 
                    border-radius: 6px; 
                    font-size: 10px; 
                    font-weight: 500;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.2s;
                  ">
            ✕ ล้างสถานที่ใกล้เคียง
          </button>
        </div>
      </div>
    `;
  };

  // Show nearby places function
  const showNearbyPlaces = async (category = 'restaurant') => {
    if (!mapRef.current) return;

    setLoadingNearby(true);
    
    try {
      // Close any open apartment popup to reveal amenity markers
      mapRef.current.closePopup();
      
      clearNearbyPlaces();

      // Use selected apartment coordinates if available, otherwise use map center
      let searchCenter;
      if (selectedApartment && selectedApartment.latitude && selectedApartment.longitude) {
        searchCenter = { lat: selectedApartment.latitude, lng: selectedApartment.longitude };
      } else {
        searchCenter = mapRef.current.getCenter();
      }

      const radius = 1000; // 1km radius

      // Category-specific queries
      const buildQuery = (category, lat, lng, radius) => {
        switch(category) {
          case 'restaurant':
            return `
              [out:json][timeout:25];
              (
                node["amenity"~"^(restaurant|cafe|fast_food)$"](around:${radius},${lat},${lng});
                way["amenity"~"^(restaurant|cafe|fast_food)$"](around:${radius},${lat},${lng});
              );
              out geom;
            `;
          case 'convenience':
            return `
              [out:json][timeout:25];
              (
                node["shop"~"^(convenience|supermarket)$"](around:${radius},${lat},${lng});
                way["shop"~"^(convenience|supermarket)$"](around:${radius},${lat},${lng});
              );
              out geom;
            `;
          case 'school':
            return `
              [out:json][timeout:25];
              (
                node["amenity"~"^(school|university|kindergarten)$"](around:${radius},${lat},${lng});
                way["amenity"~"^(school|university|kindergarten)$"](around:${radius},${lat},${lng});
              );
              out geom;
            `;
          default:
            return buildQuery('restaurant', lat, lng, radius);
        }
      };

      const query = buildQuery(category, searchCenter.lat, searchCenter.lng, radius);
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const layerGroup = L.layerGroup();
        
        data.elements.forEach(place => {
          let markerLat, markerLng;
          
          if (place.type === 'node' && place.lat && place.lon) {
            markerLat = place.lat;
            markerLng = place.lon;
          } else if (place.type === 'way' && place.geometry) {
            const coords = place.geometry;
            if (coords && coords.length > 0) {
              const latSum = coords.reduce((sum, coord) => sum + coord.lat, 0);
              const lngSum = coords.reduce((sum, coord) => sum + coord.lon, 0);
              markerLat = latSum / coords.length;
              markerLng = lngSum / coords.length;
            }
          }
          
          if (markerLat && markerLng) {
            const categoryStyles = {
              restaurant: { color: '#ef4444', icon: '🍽️' },
              convenience: { color: '#10b981', icon: '🏪' },
              school: { color: '#8b5cf6', icon: '🎓' },
              health: { color: '#ec4899', icon: '🏥' },
              transport: { color: '#3b82f6', icon: '🚌' }
            };

            const style = categoryStyles[category] || categoryStyles.restaurant;
            const markerRadius = place.type === 'way' ? 10 : 8;

            const marker = L.circleMarker([markerLat, markerLng], {
              radius: markerRadius,
              fillColor: style.color,
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: place.type === 'way' ? 0.8 : 0.7
            });

            const name = place.tags?.name || place.tags?.brand || `${style.icon} สถานที่`;
            marker.bindPopup(`
              <div class="p-2">
                <strong>${style.icon} ${name}</strong>
                <br><small class="text-gray-600">ประเภท: ${category}</small>
              </div>
            `);

            layerGroup.addLayer(marker);
          }
        });
        
        nearbyLayersRef.current[category] = layerGroup;
        layerGroup.addTo(mapRef.current);
        
        showNearbyNotification(category, data.elements.length);
      } else {
        showNearbyNotification(category, 0);
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      showNearbyNotification(category, 0);
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
    setNearbyNotification(null);
  };

  // Show notification about nearby places
  const showNearbyNotification = (category, count) => {
    const categoryNames = {
      restaurant: 'ร้านอาหาร',
      convenience: 'ร้านสะดวกซื้อ',
      school: 'สถานศึกษา',
      health: 'สถานพยาบาล',
      transport: 'ขนส่งสาธารณะ'
    };
    
    const notification = {
      category: categoryNames[category] || category,
      count,
      timestamp: Date.now()
    };
    
    setNearbyNotification(notification);
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNearbyNotification(null);
    }, 5000);
  };

  // Update apartment markers when data or filters change
  useEffect(() => {
    if (!mapRef.current || !apartmentData || !markerClusterRef.current) return;

    console.log('Updating clustered markers, selectedApartment:', selectedApartment?.apartment_name);

    // Clear existing markers from cluster
    markerClusterRef.current.clearLayers();
    markersRef.current = [];

    // Add markers to cluster group
    apartmentData.forEach(apartment => {
      if (!apartment.latitude || !apartment.longitude) return;

      const isSelected = selectedApartment && selectedApartment.apartment_id === apartment.apartment_id;
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
        offset: [0, -8],
        className: 'custom-apartment-popup',
        autoPan: true,
        autoPanPadding: [20, 20],
        keepInView: true
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

      // Add marker to cluster group instead of directly to map
      markerClusterRef.current.addLayer(marker);
      markersRef.current.push(marker);
    });

    // Only fit bounds on initial load and when no apartment is selected
    if (isInitialLoad.current && !selectedApartment && !hasZoomedToMarker.current && markersRef.current.length > 0) {
      console.log('Fitting bounds to clustered markers (initial load)');
      const group = new L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
      isInitialLoad.current = false;
    } else {
      console.log('Skipping fitBounds - selectedApartment:', !!selectedApartment, 'hasZoomedToMarker:', hasZoomedToMarker.current);
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

  // Dynamic height calculation based on viewport
  const getMapHeight = () => {
    if (isMobile) {
      return "60vh";
    } else {
      return "calc(100vh - 150px)";
    }
  };

  return (
    <div className="relative">
      {/* Loading indicator for nearby places */}
      {loadingNearby && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 border">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">กำลังค้นหาสถานที่ใกล้เคียง...</span>
          </div>
        </div>
      )}

      {/* Notification for nearby places */}
      {nearbyNotification && (
        <div className="absolute top-4 left-4 z-[1000] bg-green-100 border border-green-300 rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between space-x-2">
            <span className="text-sm text-green-800">
              พบ {nearbyNotification.category} จำนวน {nearbyNotification.count} แห่ง
            </span>
            <button 
              onClick={() => setNearbyNotification(null)}
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        style={{ height: getMapHeight() }}
        className="w-full rounded-lg overflow-hidden shadow-lg border"
      />
    </div>
  );
};

export default ApartmentMap;
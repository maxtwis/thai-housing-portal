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
  selectedApartment,
  calculateFacilityScore
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const markerClusterRef = useRef(null);
  const pinnedMarkerRef = useRef(null); // For temporarily pinned marker
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

    // Simplified popup positioning
    map.on('popupopen', function(e) {
      const popup = e.popup;
      console.log('Popup opened successfully');
      
      // Simple positioning - just check if popup would be clipped at the top
      const popupLatLng = popup.getLatLng();
      const popupPoint = map.latLngToContainerPoint(popupLatLng);
      
      if (popupPoint.y < 150) {
        // Show popup below marker if too close to top
        popup.options.offset = [0, 25];
        popup.update();
      }
    });

    // Handle popup close - restore marker to cluster if needed
    map.on('popupclose', function(e) {
      // Add a small delay to prevent conflicts with other operations
      setTimeout(() => {
        if (pinnedMarkerRef.current && mapRef.current.hasLayer(pinnedMarkerRef.current)) {
          try {
            // Remove the pinned marker from map
            mapRef.current.removeLayer(pinnedMarkerRef.current);
            
            // Add it back to the cluster
            markerClusterRef.current.addLayer(pinnedMarkerRef.current);
            
            // Clear the reference
            pinnedMarkerRef.current = null;
          } catch (error) {
            console.warn('Error restoring marker to cluster:', error);
            // Clear the reference anyway to prevent further issues
            pinnedMarkerRef.current = null;
          }
        }
      }, 50);
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

  // Color scheme logic - updated for new data structure
  const getMarkerColor = (property) => {
    const schemes = {
      priceRange: () => {
        const price = property.monthly_min_price || 0;
        if (price <= 5000) return '#22c55e'; // Green - Low price
        if (price <= 10000) return '#eab308'; // Yellow - Medium price
        if (price <= 20000) return '#f97316'; // Orange - High price
        return '#ef4444'; // Red - Very high price
      },
      propertyType: () => {
        const propertyType = property.property_type || '';
        switch (propertyType.toLowerCase()) {
          case 'apartment': return '#8b5cf6'; // Purple
          case 'condo': return '#06b6d4'; // Cyan
          case 'house': return '#10b981'; // Emerald
          case 'townhouse': return '#f59e0b'; // Amber
          default: return '#6b7280'; // Gray
        }
      },
      roomType: () => {
        const roomType = property.room_type || '';
        switch (roomType.toLowerCase()) {
          case 'studio': return '#8b5cf6'; // Purple
          case 'one_bed_room': return '#06b6d4'; // Cyan
          case 'two_bed_room': return '#10b981'; // Emerald
          case 'three_bed_room': return '#f59e0b'; // Amber
          default: return '#6b7280'; // Gray
        }
      },
      amenityScore: () => {
        const score = calculateFacilityScore ? calculateFacilityScore(property) : 0;
        if (score >= 80) return '#22c55e'; // Green - Excellent
        if (score >= 60) return '#eab308'; // Yellow - Good
        if (score >= 40) return '#f97316'; // Orange - Fair
        return '#ef4444'; // Red - Poor
      },
      size: () => {
        const size = property.room_size_min || property.room_size_max || 0;
        if (size <= 20) return '#22c55e'; // Green - Small
        if (size <= 35) return '#eab308'; // Yellow - Medium
        if (size <= 50) return '#f97316'; // Orange - Large
        return '#ef4444'; // Red - Very large
      }
    };
    
    return colorScheme in schemes ? schemes[colorScheme]() : schemes.priceRange();
  };

  // Create simple circle marker options
  const createSimpleMarker = (property, isSelected, isHover = false) => {
    const markerColor = getMarkerColor(property);
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

  // Enhanced popup content generator for properties - updated for new structure
  const generatePopupContent = (property) => {
    const amenityScore = calculateFacilityScore ? calculateFacilityScore(property) : 0;
    
    // Helper function to format price range
    const formatPriceRange = () => {
      if (property.monthly_min_price && property.monthly_max_price && property.monthly_min_price !== property.monthly_max_price) {
        return `฿${property.monthly_min_price?.toLocaleString()} - ฿${property.monthly_max_price?.toLocaleString()}`;
      } else if (property.monthly_min_price) {
        return `฿${property.monthly_min_price?.toLocaleString()}`;
      }
      return 'ราคาไม่ระบุ';
    };

    // Helper function to format size range
    const formatSizeRange = () => {
      if (property.room_size_min && property.room_size_max && property.room_size_min !== property.room_size_max) {
        return `${property.room_size_min} - ${property.room_size_max} ตร.ม.`;
      } else if (property.room_size_max || property.room_size_min) {
        return `${property.room_size_max || property.room_size_min} ตร.ม.`;
      }
      return 'ขนาดไม่ระบุ';
    };

    // Amenity icons mapping
    const amenityIcons = {
      has_air: '❄️',
      has_furniture: '🛋️',
      has_internet: '📶',
      has_parking: '🚗',
      has_lift: '🛗',
      has_pool: '🏊‍♂️',
      has_fitness: '💪',
      has_security: '🔒',
      has_cctv: '📹',
      allow_pet: '🐕'
    };

    // Get available amenities
    const amenities = [];
    if (property.has_air) amenities.push({ key: 'has_air', label: 'เครื่องปรับอากาศ', icon: amenityIcons.has_air });
    if (property.has_furniture) amenities.push({ key: 'has_furniture', label: 'เฟอร์นิเจอร์', icon: amenityIcons.has_furniture });
    if (property.has_internet) amenities.push({ key: 'has_internet', label: 'อินเทอร์เน็ต', icon: amenityIcons.has_internet });
    if (property.has_parking) amenities.push({ key: 'has_parking', label: 'ที่จอดรถ', icon: amenityIcons.has_parking });
    if (property.has_lift) amenities.push({ key: 'has_lift', label: 'ลิฟต์', icon: amenityIcons.has_lift });
    if (property.has_pool) amenities.push({ key: 'has_pool', label: 'สระว่ายน้ำ', icon: amenityIcons.has_pool });
    if (property.has_fitness) amenities.push({ key: 'has_fitness', label: 'ฟิตเนส', icon: amenityIcons.has_fitness });
    if (property.has_security) amenities.push({ key: 'has_security', label: 'รักษาความปลอดภัย', icon: amenityIcons.has_security });
    if (property.has_cctv) amenities.push({ key: 'has_cctv', label: 'กล้องวงจรปิด', icon: amenityIcons.has_cctv });
    if (property.allow_pet) amenities.push({ key: 'allow_pet', label: 'อนุญาตสัตว์เลี้ยง', icon: amenityIcons.allow_pet });

    // Amenity score color
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
            ">${property.name || 'ไม่ระบุชื่อ'}</h3>
            
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <div style="
                background: rgba(255,255,255,0.2); 
                backdrop-filter: blur(10px);
                padding: 4px 10px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: 600;
                border: 1px solid rgba(255,255,255,0.3);
              ">${property.property_type || 'ที่พัก'}</div>
              
              <div style="
                background: rgba(255,255,255,0.2); 
                backdrop-filter: blur(10px);
                padding: 4px 10px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: 600;
                border: 1px solid rgba(255,255,255,0.3);
              ">${property.room_type || 'ห้องพัก'}</div>
              
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
            
            ${property.daily_min_price && property.daily_min_price > 0 ? `
              <div style="
                font-size: 14px; 
                font-weight: 600; 
                color: #fff;
                opacity: 0.9;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
              ">฿${property.daily_min_price?.toLocaleString()}/วัน</div>
            ` : ''}
          </div>
        </div>

        <!-- Content Section -->
        <div style="padding: 16px;">
          <!-- Amenity Score -->
          <div style="
            background: linear-gradient(90deg, rgba(${getScoreColor(amenityScore).replace('#', '')}, 0.1) 0%, rgba(${getScoreColor(amenityScore).replace('#', '')}, 0.05) 100%);
            border: 1px solid rgba(${getScoreColor(amenityScore).replace('#', '')}, 0.2);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            text-align: center;
          ">
            <div style="
              font-size: 24px; 
              font-weight: 800; 
              color: ${getScoreColor(amenityScore)};
              margin-bottom: 4px;
            ">${amenityScore}%</div>
            <div style="
              font-size: 12px; 
              color: #6b7280; 
              font-weight: 500;
            ">คะแนนสิ่งอำนวยความสะดวก</div>
          </div>

          <!-- Amenities Grid -->
          ${amenities.length > 0 ? `
            <div style="
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 8px;
              margin-bottom: 16px;
            ">
              ${amenities.slice(0, 6).map(amenity => `
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
                  <div style="font-size: 16px; margin-bottom: 4px;">${amenity.icon}</div>
                  <div style="font-size: 10px; color: #64748b; font-weight: 500;">${amenity.label}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Contact & Additional Info -->
          ${property.contact_line_id ? `
            <div style="
              background: #f8fafc; 
              padding: 8px 10px; 
              border-radius: 6px; 
              margin-bottom: 8px; 
              border-left: 3px solid #3b82f6;
              font-size: 12px;
            ">
              <span style="color: #64748b;">Line ID: </span>
              <span style="color: #334155; font-weight: 500;">${property.contact_line_id}</span>
            </div>
          ` : ''}
          
          ${property.rooms_available && property.rooms_available > 0 ? `
            <div style="
              background: #f8fafc; 
              padding: 8px 10px; 
              border-radius: 6px; 
              margin-bottom: 8px; 
              border-left: 3px solid #10b981;
              font-size: 12px;
            ">
              <span style="color: #64748b;">ห้องว่าง: </span>
              <span style="color: #334155; font-weight: 500;">${property.rooms_available} ห้อง</span>
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div style="
            display: grid; 
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;
          ">
            <button onclick="window.apartmentMapInstance?.showNearbyPlaces('restaurant')" 
                    style="
                      background: #3b82f6; 
                      color: white; 
                      border: none;
                      padding: 10px 8px; 
                      border-radius: 8px; 
                      font-size: 12px; 
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
                      padding: 10px 8px; 
                      border-radius: 8px; 
                      font-size: 12px; 
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
                      padding: 10px 8px; 
                      border-radius: 8px; 
                      font-size: 12px; 
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s;
                    ">
              🎓 สถานศึกษา
            </button>
            <button onclick="window.apartmentMapInstance?.showNearbyPlaces('health')" 
                    style="
                      background: #ec4899; 
                      color: white; 
                      border: none;
                      padding: 10px 8px; 
                      border-radius: 8px; 
                      font-size: 12px; 
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s;
                    ">
              🏥 สถานพยาบาล
            </button>
            <button onclick="window.apartmentMapInstance?.showNearbyPlaces('transport')" 
                    style="
                      background: #f59e0b; 
                      color: white; 
                      border: none;
                      padding: 10px 8px; 
                      border-radius: 8px; 
                      font-size: 12px; 
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s;
                      grid-column: span 2;
                    ">
              🚌 ขนส่งสาธารณะ
            </button>
          </div>

          <!-- Clear button -->
          <button onclick="window.apartmentMapInstance?.clearNearbyPlaces()" 
                  style="
                    background: #6b7280; 
                    color: white; 
                    border: none;
                    padding: 8px 12px; 
                    border-radius: 8px; 
                    font-size: 11px; 
                    font-weight: 500;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.2s;
                  ">
              ✕ ล้างสถานที่ใกล้เคียง
            </button>

          ${property.url ? `
            <a href="${property.url}" target="_blank" rel="noopener noreferrer" 
               style="
                 display: block;
                 background: #1f77b4; 
                 color: white; 
                 text-decoration: none;
                 padding: 8px 12px; 
                 border-radius: 8px; 
                 font-size: 11px; 
                 font-weight: 500;
                 text-align: center;
                 margin-top: 8px;
                 transition: all 0.2s;
               ">
               🔗 ดูรายละเอียดเพิ่มเติม
            </a>
          ` : ''}
        </div>
      </div>
    `;
  };

  // Show nearby places function (same as before)
  const showNearbyPlaces = async (category = 'restaurant') => {
    if (!mapRef.current) return;

    setLoadingNearby(true);
    
    try {
      clearNearbyPlaces();

      let searchCenter;
      if (pinnedMarkerRef.current && pinnedMarkerRef.current.propertyData) {
        const property = pinnedMarkerRef.current.propertyData;
        searchCenter = { lat: property.latitude, lng: property.longitude };
        console.log('Using pinned property coordinates:', searchCenter);
      } else if (selectedApartment && selectedApartment.latitude && selectedApartment.longitude) {
        searchCenter = { lat: selectedApartment.latitude, lng: selectedApartment.longitude };
        console.log('Using selected property coordinates:', searchCenter);
      } else {
        const center = mapRef.current.getCenter();
        searchCenter = { lat: center.lat, lng: center.lng };
        console.warn('Using map center coordinates:', searchCenter);
      }

      const radius = 1000;
      console.log(`Searching for ${category} within ${radius}m of:`, searchCenter);

      // Category-specific queries (same as before)
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
          case 'health':
            return `
              [out:json][timeout:25];
              (
                node["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"](around:${radius},${lat},${lng});
                node["healthcare"](around:${radius},${lat},${lng});
                node["shop"="chemist"](around:${radius},${lat},${lng});
                way["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"](around:${radius},${lat},${lng});
                way["healthcare"](around:${radius},${lat},${lng});
              );
              out geom;
            `;
          case 'transport':
            return `
              [out:json][timeout:25];
              (
                node["public_transport"](around:${radius},${lat},${lng});
                node["highway"="bus_stop"](around:${radius},${lat},${lng});
                node["amenity"="bus_station"](around:${radius},${lat},${lng});
                node["railway"="station"](around:${radius},${lat},${lng});
                way["public_transport"](around:${radius},${lat},${lng});
                way["amenity"="bus_station"](around:${radius},${lat},${lng});
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

            const detailedType = getDetailedPlaceType(place, category);
            const name = place.tags?.name || place.tags?.brand || detailedType;
            
            marker.bindPopup(`
              <div style="
                max-width: 280px; 
                padding: 0; 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
              ">
                <div style="
                  background: linear-gradient(135deg, ${style.color} 0%, ${style.color}dd 100%);
                  padding: 12px 16px;
                  color: white;
                  position: relative;
                  overflow: hidden;
                ">
                  <div style="position: absolute; top: -30%; right: -30%; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                  <div style="position: relative; z-index: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                      <span style="font-size: 20px;">${style.icon}</span>
                      <h3 style="
                        margin: 0; 
                        font-size: 16px; 
                        font-weight: 700; 
                        line-height: 1.3;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                      ">${name}</h3>
                    </div>
                    <div style="
                      background: rgba(255,255,255,0.2); 
                      backdrop-filter: blur(10px);
                      padding: 3px 8px; 
                      border-radius: 12px; 
                      font-size: 11px; 
                      font-weight: 600;
                      border: 1px solid rgba(255,255,255,0.3);
                      display: inline-block;
                    ">${detailedType}</div>
                  </div>
                </div>

                <div style="padding: 12px 16px;">
                  ${place.tags?.cuisine ? `
                    <div style="
                      background: #f8fafc; 
                      padding: 6px 10px; 
                      border-radius: 6px; 
                      margin-bottom: 8px; 
                      border-left: 3px solid ${style.color};
                      font-size: 12px;
                    ">
                      <span style="color: #64748b;">ประเภทอาหาร: </span>
                      <span style="color: #334155; font-weight: 500;">${place.tags.cuisine}</span>
                    </div>
                  ` : ''}
                  
                  ${place.tags?.opening_hours ? `
                    <div style="
                      background: #f8fafc; 
                      padding: 6px 10px; 
                      border-radius: 6px; 
                      margin-bottom: 8px; 
                      border-left: 3px solid ${style.color};
                      font-size: 12px;
                    ">
                      <span style="color: #64748b;">เวลาเปิด: </span>
                      <span style="color: #334155; font-weight: 500;">${place.tags.opening_hours}</span>
                    </div>
                  ` : ''}
                  
                  ${place.tags?.phone ? `
                    <div style="
                      background: #f8fafc; 
                      padding: 6px 10px; 
                      border-radius: 6px; 
                      margin-bottom: 8px; 
                      border-left: 3px solid ${style.color};
                      font-size: 12px;
                    ">
                      <span style="color: #64748b;">📞 </span>
                      <span style="color: #334155; font-weight: 500;">${place.tags.phone}</span>
                    </div>
                  ` : ''}

                  <div style="
                    background: linear-gradient(90deg, rgba(${style.color.replace('#', '')}, 0.1) 0%, rgba(${style.color.replace('#', '')}, 0.05) 100%);
                    border: 1px solid rgba(${style.color.replace('#', '')}, 0.2);
                    border-radius: 6px;
                    padding: 8px 10px;
                    text-align: center;
                    font-size: 11px;
                    color: #6b7280;
                    margin-top: 8px;
                  ">
                    📍 สถานที่ใกล้เคียง
                  </div>
                </div>
              </div>
            `, {
              className: 'poi-popup',
              maxWidth: 300,
              offset: [0, -10]
            });

            marker.on('mouseover', function() {
              this.setStyle({
                radius: place.type === 'way' ? 12 : 10,
                fillOpacity: 1
              });
            });
            
            marker.on('mouseout', function() {
              this.setStyle({
                radius: place.type === 'way' ? 10 : 8,
                fillOpacity: place.type === 'way' ? 0.8 : 0.7
              });
            });

            layerGroup.addLayer(marker);
          }
        });
        
        nearbyLayersRef.current[category] = layerGroup;
        layerGroup.addTo(mapRef.current);
        
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.closePopup();
          }
        }, 100);
        
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
    
    setTimeout(() => {
      setNearbyNotification(null);
    }, 5000);
  };

  // Helper function to get detailed place type classification
  const getDetailedPlaceType = (place, category) => {
    const tags = place.tags || {};
    
    if (category === 'health') {
      if (tags.amenity === 'hospital') return 'โรงพยาบาล';
      if (tags.amenity === 'clinic') return 'คลินิก';
      if (tags.amenity === 'doctors') return 'คลินิกแพทย์';
      if (tags.amenity === 'dentist') return 'คลินิกทันตกรรม';
      if (tags.amenity === 'pharmacy' || tags.shop === 'chemist') return 'ร้านขายยา';
      if (tags.healthcare === 'hospital') return 'โรงพยาบาล';
      if (tags.healthcare === 'clinic') return 'คลินิก';
      return 'สถานพยาบาล';
    }
    
    if (category === 'restaurant') {
      if (tags.amenity === 'restaurant') return 'ร้านอาหาร';
      if (tags.amenity === 'cafe') return 'ร้านกาแฟ';
      if (tags.amenity === 'fast_food') return 'ฟาสต์ฟูด';
      return 'ร้านอาหาร';
    }
    
    if (category === 'convenience') {
      if (tags.shop === 'convenience') return 'ร้านสะดวกซื้อ';
      if (tags.shop === 'supermarket') return 'ซูเปอร์มาร์เก็ต';
      if (tags.brand === '7-Eleven') return 'เซเว่น อีเลฟเว่น';
      if (tags.brand === 'Family Mart') return 'แฟมิลี่มาร์ท';
      return 'ร้านสะดวกซื้อ';
    }
    
    if (category === 'school') {
      if (tags.amenity === 'school') return 'โรงเรียน';
      if (tags.amenity === 'university') return 'มหาวิทยาลัย';
      if (tags.amenity === 'kindergarten') return 'โรงเรียนอนุบาล';
      return 'สถานศึกษา';
    }
    
    if (category === 'transport') {
      if (tags.highway === 'bus_stop') return 'ป้ายรถเมล์';
      if (tags.amenity === 'bus_station') return 'สถานีขนส่ง';
      if (tags.railway === 'station') return 'สถานีรถไฟ';
      return 'ขนส่งสาธารณะ';
    }
    
    return getCategoryName(category);
  };

  // Helper function to get category display name
  const getCategoryName = (category) => {
    const categoryNames = {
      restaurant: 'ร้านอาหาร',
      convenience: 'ร้านสะดวกซื้อ',
      school: 'สถานศึกษา',
      health: 'สถานพยาบาล',
      transport: 'ขนส่งสาธารณะ'
    };
    return categoryNames[category] || category;
  };

  // Update apartment markers when data or filters change - updated for new structure
  useEffect(() => {
    if (!mapRef.current || !apartmentData || !markerClusterRef.current) return;

    console.log('Updating clustered markers, selectedApartment:', selectedApartment?.name);

    if (pinnedMarkerRef.current) {
      console.log('Skipping marker update - pinned marker active');
      return;
    }

    markerClusterRef.current.clearLayers();
    markersRef.current = [];

    apartmentData.forEach(property => {
      if (!property.latitude || !property.longitude) return;

      const isSelected = selectedApartment && selectedApartment.id === property.id;
      const markerOptions = createSimpleMarker(property, isSelected, false);
      
      const marker = L.circleMarker([property.latitude, property.longitude], markerOptions);

      marker.propertyData = property;
      marker.isHovered = false;

      const popupOptions = {
        closeButton: true,
        autoClose: false,
        closeOnEscapeKey: true,
        maxWidth: 340,
        minWidth: 300,
        offset: [0, -8],
        className: 'custom-apartment-popup',
        autoPan: true,
        autoPanPadding: [50, 50],
        keepInView: true,
        maxHeight: 500
      };

      marker.bindPopup(generatePopupContent(property), popupOptions);

      marker.on('click', (e) => {
        console.log('Marker clicked!', property.name);
        
        L.DomEvent.stopPropagation(e);
        
        if (pinnedMarkerRef.current && pinnedMarkerRef.current !== marker) {
          mapRef.current.removeLayer(pinnedMarkerRef.current);
          markerClusterRef.current.addLayer(pinnedMarkerRef.current);
        }
        
        markerClusterRef.current.removeLayer(marker);
        marker.addTo(mapRef.current);
        
        pinnedMarkerRef.current = marker;
        pinnedMarkerRef.current.propertyData = property;
        
        hasZoomedToMarker.current = true;
        
        setTimeout(() => {
          try {
            if (mapRef.current.hasLayer(marker)) {
              console.log('Opening popup for:', property.name);
              marker.openPopup();
              
              setTimeout(() => {
                if (marker.isPopupOpen()) {
                  console.log('Popup successfully opened');
                } else {
                  console.log('Popup failed to open, retrying...');
                  const popup = L.popup(popupOptions)
                    .setLatLng([property.latitude, property.longitude])
                    .setContent(generatePopupContent(property))
                    .openOn(mapRef.current);
                }
              }, 100);
            }
          } catch (error) {
            console.error('Error opening popup:', error);
          }
        }, 10);
        
        setTimeout(() => {
          if (onApartmentSelect) {
            onApartmentSelect(property);
          }
        }, 100);
        
        setTimeout(() => {
          mapRef.current.panTo([property.latitude, property.longitude]);
        }, 200);
      });

      if (!isMobile) {
        marker.on('mouseover', () => {
          marker.isHovered = true;
          const hoverOptions = createSimpleMarker(property, isSelected, true);
          marker.setStyle(hoverOptions);
        });

        marker.on('mouseout', () => {
          marker.isHovered = false;
          const normalOptions = createSimpleMarker(property, isSelected, false);
          marker.setStyle(normalOptions);
        });
      }

      markerClusterRef.current.addLayer(marker);
      markersRef.current.push(marker);
    });

    if (isInitialLoad.current && !selectedApartment && !hasZoomedToMarker.current && markersRef.current.length > 0) {
      console.log('Fitting bounds to clustered markers (initial load)');
      const group = new L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
      isInitialLoad.current = false;
    } else {
      console.log('Skipping fitBounds - selectedApartment:', !!selectedApartment, 'hasZoomedToMarker:', hasZoomedToMarker.current);
    }

  }, [apartmentData, colorScheme, isMobile]);

  // Update marker styles when selection changes
  useEffect(() => {
    if (!mapRef.current || !selectedApartment) return;

    console.log('Updating marker styles for selected property:', selectedApartment.name);

    setTimeout(() => {
      if (pinnedMarkerRef.current && pinnedMarkerRef.current.propertyData) {
        const property = pinnedMarkerRef.current.propertyData;
        const isSelected = property.id === selectedApartment.id;
        const isHovered = pinnedMarkerRef.current.isHovered || false;
        const updatedOptions = createSimpleMarker(property, isSelected, isHovered);
        pinnedMarkerRef.current.setStyle(updatedOptions);
        return;
      }

      markersRef.current.forEach(marker => {
        const property = apartmentData.find(prop => 
          Math.abs(prop.latitude - marker.getLatLng().lat) < 0.0001 && 
          Math.abs(prop.longitude - marker.getLatLng().lng) < 0.0001
        );
        
        if (property) {
          const isSelected = property.id === selectedApartment.id;
          const isHovered = marker.isHovered || false;
          const updatedOptions = createSimpleMarker(property, isSelected, isHovered);
          marker.setStyle(updatedOptions);
        }
      });
    }, 100);

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
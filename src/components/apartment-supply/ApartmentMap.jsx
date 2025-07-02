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

// Fetch nearby count for a specific category
const fetchNearbyCount = async (category, lat, lng, radius = 1000) => {
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
        await new Promise(resolve => setTimeout(resolve, 2000));
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
        return retryData.elements ? retryData.elements.length : 0;
      }
      
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    return data.elements ? data.elements.length : 0;
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    return 0;
  }
};

const buildOverpassQuery = (category, lat, lng, radius) => {
  const timeout = 15; // Increased timeout for better reliability
  switch(category) {
    case 'restaurant':
      return `[out:json][timeout:${timeout}];(node["amenity"~"^(restaurant|cafe|fast_food)$"](around:${radius},${lat},${lng});way["amenity"~"^(restaurant|cafe|fast_food)$"](around:${radius},${lat},${lng}););out geom;`;
    case 'convenience':
      return `[out:json][timeout:${timeout}];(node["shop"~"^(convenience|supermarket)$"](around:${radius},${lat},${lng});way["shop"~"^(convenience|supermarket)$"](around:${radius},${lat},${lng}););out geom;`;
    case 'school':
      return `[out:json][timeout:${timeout}];(node["amenity"~"^(school|university|kindergarten)$"](around:${radius},${lat},${lng});way["amenity"~"^(school|university|kindergarten)$"](around:${radius},${lat},${lng}););out geom;`;
    case 'health':
      return `[out:json][timeout:${timeout}];(node["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"](around:${radius},${lat},${lng});node["healthcare"](around:${radius},${lat},${lng});node["shop"="chemist"](around:${radius},${lat},${lng});way["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"](around:${radius},${lat},${lng});way["healthcare"](around:${radius},${lat},${lng}););out geom;`;
    case 'transport':
      return `[out:json][timeout:${timeout}];(node["public_transport"](around:${radius},${lat},${lng});node["highway"="bus_stop"](around:${radius},${lat},${lng});node["amenity"="bus_station"](around:${radius},${lat},${lng});node["railway"="station"](around:${radius},${lat},${lng});way["public_transport"](around:${radius},${lat},${lng});way["amenity"="bus_station"](around:${radius},${lat},${lng}););out geom;`;
    default:
      return buildOverpassQuery('restaurant', lat, lng, radius);
  }
};

const calculateCategoryScore = (count, category) => {
  const thresholds = {
    restaurant: { excellent: 15, good: 8, fair: 3 },
    convenience: { excellent: 8, good: 4, fair: 2 },
    school: { excellent: 5, good: 3, fair: 1 },
    health: { excellent: 8, good: 4, fair: 2 },
    transport: { excellent: 10, good: 5, fair: 2 }
  };

  const threshold = thresholds[category] || thresholds.restaurant;

  if (count >= threshold.excellent) return 100;
  if (count >= threshold.good) return 80;
  if (count >= threshold.fair) return 60;
  if (count > 0) return 40;
  return 0;
};

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
  const pinnedMarkerRef = useRef(null);
  const nearbyLayersRef = useRef({});
  const isInitialLoad = useRef(true);
  const hasZoomedToMarker = useRef(false);
  const currentPopupMarker = useRef(null);
  
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyNotification, setNearbyNotification] = useState(null);
  const [proximityScores, setProximityScores] = useState({});
  const [calculatingProximity, setCalculatingProximity] = useState(null); // Track which property is being calculated

  // Calculate proximity score on-demand when apartment is clicked
  const calculateProximityForProperty = async (property) => {
    if (proximityScores[property.id]) {
      // Already calculated
      return;
    }

    setCalculatingProximity(property.id);
    
    try {
      console.log(`Starting proximity calculation for ${property.apartment_name || property.name}`);
      
      const categories = ['restaurant', 'convenience', 'school', 'health', 'transport'];
      let totalScore = 0;
      let categoryCount = 0;

      for (const category of categories) {
        try {
          console.log(`Fetching ${category} data...`);
          const nearbyCount = await fetchNearbyCount(category, property.latitude, property.longitude, 1000);
          const categoryScore = calculateCategoryScore(nearbyCount, category);
          totalScore += categoryScore;
          categoryCount++;
          console.log(`${category}: ${nearbyCount} places found, score: ${categoryScore}%`);
          
          // Add delay to respect API limits
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
          console.error(`Error fetching ${category} data:`, error);
          // Continue with other categories even if one fails
        }
      }

      const finalScore = categoryCount > 0 ? Math.round(totalScore / categoryCount) : 0;
      console.log(`Final proximity score: ${finalScore}%`);
      
      // Update the proximity scores state
      setProximityScores(prev => {
        const newScores = {
          ...prev,
          [property.id]: finalScore
        };
        console.log('Updated proximity scores:', newScores);
        return newScores;
      });
      
      setCalculatingProximity(null);
      
    } catch (error) {
      console.error('Error calculating proximity score:', error);
      setCalculatingProximity(null);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.7563, 100.5018], // Bangkok default
      zoom: 10,
      zoomControl: !isMobile,
      attributionControl: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize marker cluster group
    markerClusterRef.current = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 100) size = 'large';
        else if (count > 10) size = 'medium';
        
        return L.divIcon({
          html: '<div><span>' + count + '</span></div>',
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: L.point(40, 40)
        });
      }
    });

    map.addLayer(markerClusterRef.current);
    mapRef.current = map;
    window.apartmentMapInstance = {
      showNearbyPlaces,
      clearNearbyPlaces
    };

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

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
        const amenityScore = calculateFacilityScore ? calculateFacilityScore(property) : 0;
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

  // Score color helper
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    if (score >= 40) return '#ef4444'; // orange
    return '#6b7280'; // gray
  };

  // Enhanced popup content generator with dynamic proximity score
  const generatePopupContent = (property) => {
    const amenityScore = calculateFacilityScore ? calculateFacilityScore(property) : 0;
    const proximityScore = proximityScores[property.id];
    const isCalculating = calculatingProximity === property.id;
    
    console.log(`Generating popup for ${property.apartment_name || property.name}:`, {
      proximityScore,
      isCalculating,
      hasScore: proximityScore !== undefined,
      calculatingProximityState: calculatingProximity,
      proximityScoresKeys: Object.keys(proximityScores),
      propertyId: property.id
    });
    
    // Helper functions
    const formatPriceRange = () => {
      if (property.monthly_min_price && property.monthly_max_price && property.monthly_min_price !== property.monthly_max_price) {
        return `฿${property.monthly_min_price?.toLocaleString()} - ฿${property.monthly_max_price?.toLocaleString()}`;
      } else if (property.monthly_min_price) {
        return `฿${property.monthly_min_price?.toLocaleString()}`;
      }
      return 'ราคาไม่ระบุ';
    };

    const formatSizeRange = () => {
      if (property.room_size_min && property.room_size_max && property.room_size_min !== property.room_size_max) {
        return `${property.room_size_min} - ${property.room_size_max} ตร.ม.`;
      } else if (property.room_size_max || property.room_size_min) {
        return `${property.room_size_max || property.room_size_min} ตร.ม.`;
      }
      return 'ขนาดไม่ระบุ';
    };

    // Amenity icons
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

    return `
      <div style="
        max-width: 340px; 
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
              text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            ">${property.apartment_name || property.name || 'ไม่ระบุชื่อ'}</h3>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 14px; opacity: 0.9;">📍</span>
              <span style="font-size: 13px; opacity: 0.9;">${property.district || 'ไม่ระบุ'}, ${property.province || 'ไม่ระบุ'}</span>
            </div>
            <div style="
              font-size: 16px; 
              font-weight: 600; 
              color: #fff;
              text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            ">${formatPriceRange()}/เดือน</div>
            <div style="
              font-size: 12px; 
              opacity: 0.8;
            ">${formatSizeRange()}</div>
          </div>
        </div>

        <!-- Content Section -->
        <div style="padding: 16px;">
          <!-- Scores Section -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <!-- Facility Score -->
            <div style="
              background: linear-gradient(90deg, rgba(${getScoreColor(amenityScore).slice(1)}, 0.1) 0%, rgba(${getScoreColor(amenityScore).slice(1)}, 0.05) 100%);
              border: 1px solid rgba(${getScoreColor(amenityScore).slice(1)}, 0.2);
              border-radius: 8px;
              padding: 12px;
              text-align: center;
            ">
              <div style="
                font-size: 20px; 
                font-weight: 800; 
                color: ${getScoreColor(amenityScore)};
                margin-bottom: 4px;
              ">${amenityScore}%</div>
              <div style="
                font-size: 10px; 
                color: #6b7280; 
                font-weight: 500;
                line-height: 1.2;
              ">สิ่งอำนวยความสะดวก</div>
            </div>

            <!-- Proximity Score -->
            ${proximityScore !== undefined ? `
              <div style="
                background: linear-gradient(90deg, rgba(${getScoreColor(proximityScore).slice(1)}, 0.1) 0%, rgba(${getScoreColor(proximityScore).slice(1)}, 0.05) 100%);
                border: 1px solid rgba(${getScoreColor(proximityScore).slice(1)}, 0.2);
                border-radius: 8px;
                padding: 12px;
                text-align: center;
              ">
                <div style="
                  font-size: 20px; 
                  font-weight: 800; 
                  color: ${getScoreColor(proximityScore)};
                  margin-bottom: 4px;
                ">${proximityScore}%</div>
                <div style="
                  font-size: 10px; 
                  color: #6b7280; 
                  font-weight: 500;
                  line-height: 1.2;
                ">ความใกล้เคียงสถานที่</div>
              </div>
            ` : `
              <div style="
                background: ${isCalculating ? '#fef3c7' : '#f8fafc'};
                border: 1px solid ${isCalculating ? '#f59e0b' : '#e2e8f0'};
                border-radius: 8px;
                padding: 12px;
                text-align: center;
              ">
                <div style="
                  font-size: 16px; 
                  color: ${isCalculating ? '#f59e0b' : '#94a3b8'};
                  margin-bottom: 4px;
                ">${isCalculating ? '⏳' : '📍'}</div>
                <div style="
                  font-size: 10px; 
                  color: ${isCalculating ? '#92400e' : '#64748b'}; 
                  font-weight: 500;
                  line-height: 1.2;
                ">${isCalculating ? 'กำลังคำนวณ...' : 'รอการคำนวณ'}</div>
              </div>
            `}
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

          <!-- Nearby Places Buttons -->
          <div style="
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 6px;
            margin-bottom: 12px;
          ">
            <button onclick="window.apartmentMapInstance?.showNearbyPlaces('restaurant')" 
                    style="
                      background: #ef4444; 
                      color: white; 
                      border: none;
                      padding: 8px 6px; 
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
                      padding: 8px 6px; 
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
                      padding: 8px 6px; 
                      border-radius: 6px; 
                      font-size: 11px; 
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
                      padding: 8px 6px; 
                      border-radius: 6px; 
                      font-size: 11px; 
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s;
                    ">
              🏥 สถานพยาบาล
            </button>
          </div>

          <!-- Additional Info -->
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
              background: #dcfce7; 
              padding: 8px 10px; 
              border-radius: 6px; 
              border-left: 3px solid #22c55e;
              font-size: 12px;
            ">
              <span style="color: #15803d; font-weight: 500;">✓ ห้องว่าง: ${property.rooms_available} ห้อง</span>
            </div>
          ` : ''}

          <!-- Clear nearby button -->
          <button onclick="window.apartmentMapInstance?.clearNearbyPlaces()" 
                  style="
                    background: #6b7280; 
                    color: white; 
                    border: none;
                    padding: 6px 10px; 
                    border-radius: 6px; 
                    font-size: 11px; 
                    font-weight: 500;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 8px;
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

  // Show nearby places function
  const showNearbyPlaces = async (category = 'restaurant') => {
    if (!mapRef.current) return;

    setLoadingNearby(true);
    
    try {
      clearNearbyPlaces();

      let searchCenter;
      if (pinnedMarkerRef.current && pinnedMarkerRef.current.propertyData) {
        const property = pinnedMarkerRef.current.propertyData;
        searchCenter = { lat: property.latitude, lng: property.longitude };
      } else if (selectedApartment && selectedApartment.latitude && selectedApartment.longitude) {
        searchCenter = { lat: selectedApartment.latitude, lng: selectedApartment.longitude };
      } else {
        const center = mapRef.current.getCenter();
        searchCenter = { lat: center.lat, lng: center.lng };
      }

      const radius = 1000;
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
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
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

            const placeName = place.tags?.name || place.tags?.brand || 'ไม่ระบุชื่อ';
            const placeType = getDetailedPlaceType(place, category);
            
            marker.bindPopup(`
              <div style="font-family: 'Inter', sans-serif; max-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 600;">
                  ${style.icon} ${placeName}
                </h4>
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                  ${placeType}
                </p>
              </div>
            `);

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

  // Update apartment markers when data or filters change
  useEffect(() => {
    if (!mapRef.current || !apartmentData || !markerClusterRef.current) return;

    if (pinnedMarkerRef.current) {
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
        console.log('Marker clicked for property:', property.apartment_name || property.name);
        
        if (onApartmentSelect) {
          onApartmentSelect(property);
        }
        
        // Store reference to current popup marker
        currentPopupMarker.current = marker;
        
        if (pinnedMarkerRef.current) {
          mapRef.current.removeLayer(pinnedMarkerRef.current);
        }
        
        const pinnedMarkerOptions = createSimpleMarker(property, true, false);
        const pinnedMarker = L.circleMarker([property.latitude, property.longitude], pinnedMarkerOptions);
        pinnedMarker.propertyData = property;
        pinnedMarker.bindPopup(generatePopupContent(property), popupOptions);
        pinnedMarker.addTo(mapRef.current);
        pinnedMarker.openPopup();
        
        pinnedMarkerRef.current = pinnedMarker;
        currentPopupMarker.current = pinnedMarker;
        
        // Start calculating proximity score AFTER popup is shown
        if (!proximityScores[property.id] && calculatingProximity !== property.id) {
          console.log('Starting proximity calculation...');
          calculateProximityForProperty(property);
        }
        
        if (!hasZoomedToMarker.current) {
          mapRef.current.setView([property.latitude, property.longitude], 15, {
            animate: true,
            duration: 1
          });
          hasZoomedToMarker.current = true;
        }
      });

      marker.on('mouseover', (e) => {
        marker.isHovered = true;
        const hoveredOptions = createSimpleMarker(property, isSelected, true);
        marker.setStyle(hoveredOptions);
      });

      marker.on('mouseout', (e) => {
        marker.isHovered = false;
        const normalOptions = createSimpleMarker(property, isSelected, false);
        marker.setStyle(normalOptions);
      });

      markersRef.current.push(marker);
      markerClusterRef.current.addLayer(marker);
    });

    if (isInitialLoad.current && apartmentData.length > 0 && !selectedApartment) {
      const bounds = L.latLngBounds(apartmentData.map(item => [item.latitude, item.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      isInitialLoad.current = false;
    }

  }, [apartmentData, colorScheme, isMobile, proximityScores]);

  // Update marker styles when selection changes
  useEffect(() => {
    if (!mapRef.current || !selectedApartment) return;

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

  // Update popup content when proximity scores change
  useEffect(() => {
    if (currentPopupMarker.current && currentPopupMarker.current.isPopupOpen()) {
      const property = currentPopupMarker.current.propertyData;
      const newPopupContent = generatePopupContent(property);
      currentPopupMarker.current.setPopupContent(newPopupContent);
      console.log('Popup updated due to proximity score change');
    }
  }, [proximityScores, calculatingProximity]);

  // Reset zoom flag when filters change
  useEffect(() => {
    hasZoomedToMarker.current = false;
  }, [apartmentData, colorScheme]);

  // Dynamic height calculation
  const getMapHeight = () => {
    if (isMobile) {
      return "60vh";
    } else {
      return "calc(100vh - 150px)";
    }
  };

  return (
    <div className="relative">
      {/* Loading indicator for proximity calculation */}
      {calculatingProximity && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 border">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">
              กำลังคำนวณคะแนนความใกล้เคียง...
            </span>
          </div>
        </div>
      )}

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
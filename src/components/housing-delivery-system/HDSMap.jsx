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

const HDSMap = ({ filters, colorScheme = 'housingSystem', isMobile, onGridSelect, selectedGrid, selectedProvince = 'kkn' }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const hdsLayerRef = useRef(null);
  const legendRef = useRef(null);

  // Province configurations
  const provinceConfigs = {
    'kkn': {
      name: 'ขอนแก่น',
      file: '/data/HDS_GRID_KKN_FeaturesToJSON.geojson',
      center: [16.4419, 102.8359],
      zoom: 10
    },
    'cnx': {
      name: 'เชียงใหม่', 
      file: '/data/HDS_CNX_02GJSON.geojson',
      center: [18.7883, 98.9853],
      zoom: 10
    }
  };

  // Housing Delivery System categories
  const hdsCategories = {
    1: 'ระบบของชุมชนแออัดบนที่ดินรัฐ/เอกชน',
    2: 'ระบบการถือครองที่ดินชั่วคราว',
    3: 'ระบบของกลุ่มประชากรแฝง',
    4: 'ระบบที่อยู่อาศัยของลูกจ้าง',
    5: 'ระบบที่อยู่อาศัยที่รัฐจัดสร้าง',
    6: 'ระบบที่อยู่อาศัยที่รัฐสนับสนุน',
    7: 'ระบบที่อยู่อาศัยเอกชน'
  };

  // Dynamic height calculation based on viewport
  const getMapHeight = () => {
    if (isMobile) {
      return "60vh";
    } else {
      return "calc(100vh - 150px)";
    }
  };

  const generatePopupContent = (feature, colorScheme) => {
    const props = feature.properties;
    const provinceName = provinceConfigs[selectedProvince]?.name || 'ไม่ทราบจังหวัด';
    
    // Handle different field names between provinces
    const gridId = props.FID || props.Grid_CODE || props.OBJECTID_1 || 'N/A';
    const gridPop = props.Grid_POP || 0;
    const gridHouse = props.Grid_House || props.House || 0;
    const gridClass = props.Grid_Class || 'ไม่มีข้อมูล';
    
    // Calculate dominant housing system
    const hdsNumbers = [
      { code: 1, count: props.HDS_C1_num || 0 },
      { code: 2, count: props.HDS_C2_num || 0 },
      { code: 3, count: props.HDS_C3_num || 0 },
      { code: 4, count: props.HDS_C4_num || 0 },
      { code: 5, count: props.HDS_C5_num || 0 },
      { code: 6, count: props.HDS_C6_num || 0 },
      { code: 7, count: props.HDS_C7_num || 0 }
    ];
    
    const totalHousing = hdsNumbers.reduce((sum, item) => sum + item.count, 0);
    const dominantSystem = hdsNumbers.reduce((max, item) => item.count > max.count ? item : max);
    
    return `
      <div class="p-3 min-w-[280px]">
        <div class="bg-gray-50 -m-3 p-3 mb-3 border-b">
          <h3 class="font-bold text-gray-800">พื้นที่กริด ID: ${gridId}</h3>
          <p class="text-sm text-gray-600 mt-1">${provinceName} - ระบบที่อยู่อาศัย</p>
        </div>
        
        <div class="space-y-2">
          <div class="flex justify-between items-baseline text-sm">
            <span class="text-gray-600">ประชากรรวม</span>
            <span class="font-medium text-gray-800">${gridPop ? Math.round(gridPop).toLocaleString() : 'ไม่มีข้อมูล'} คน</span>
          </div>
          
          <div class="flex justify-between items-baseline text-sm">
            <span class="text-gray-600">ที่อยู่อาศัยรวม</span>
            <span class="font-medium text-gray-800">${gridHouse ? Math.round(gridHouse).toLocaleString() : 'ไม่มีข้อมูล'} หน่วย</span>
          </div>
          
          <div class="flex justify-between items-baseline text-sm">
            <span class="text-gray-600">ความหนาแน่น</span>
            <span class="font-medium text-gray-800">ระดับ ${gridClass}</span>
          </div>
          
          ${totalHousing > 0 ? `
          <hr class="my-2">
          <div class="text-xs text-gray-600">
            <div class="font-medium mb-1">ระบบที่อยู่อาศัยหลัก:</div>
            <div class="text-blue-600">${hdsCategories[dominantSystem.code] || 'ไม่ทราบ'}</div>
            <div class="text-gray-500">(${dominantSystem.count.toLocaleString()} หน่วย)</div>
          </div>
          ` : ''}
          
          ${colorScheme === 'housingSystem' && totalHousing > 0 ? `
          <hr class="my-2">
          <div class="text-xs">
            <div class="font-medium text-gray-600 mb-1">รายละเอียดระบบที่อยู่อาศัย:</div>
            ${hdsNumbers.filter(h => h.count > 0).map(h => `
              <div class="flex justify-between text-xs">
                <span class="text-gray-600">${hdsCategories[h.code]}:</span>
                <span class="text-gray-800">${h.count.toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  // Color scheme functions
  const getFeatureColor = (feature) => {
    const schemes = {
      housingSystem: () => {
        const props = feature.properties;
        const hdsNumbers = [
          { code: 1, count: props.HDS_C1_num || 0, color: '#d62728' },
          { code: 2, count: props.HDS_C2_num || 0, color: '#ff7f0e' },
          { code: 3, count: props.HDS_C3_num || 0, color: '#bcbd22' },
          { code: 4, count: props.HDS_C4_num || 0, color: '#9467bd' },
          { code: 5, count: props.HDS_C5_num || 0, color: '#2ca02c' },
          { code: 6, count: props.HDS_C6_num || 0, color: '#17becf' },
          { code: 7, count: props.HDS_C7_num || 0, color: '#1f77b4' }
        ];
        
        const dominantSystem = hdsNumbers.reduce((max, item) => 
          item.count > max.count ? item : max
        );
        
        return dominantSystem.count > 0 ? dominantSystem.color : '#808080';
      },
      
      populationDensity: () => {
        const pop = feature.properties.Grid_POP || 0;
        if (pop < 500) return '#ffffcc';
        if (pop < 1000) return '#c7e9b4';
        if (pop < 2000) return '#7fcdbb';
        if (pop < 3000) return '#41b6c4';
        if (pop < 5000) return '#2c7fb8';
        return '#253494';
      },
      
      housingDensity: () => {
        const housing = feature.properties.Grid_House || feature.properties.House || 0;
        if (housing < 1000) return '#fff5f0';
        if (housing < 2000) return '#fee0d2';
        if (housing < 5000) return '#fcbba1';
        if (housing < 10000) return '#fc9272';
        if (housing < 20000) return '#fb6a4a';
        if (housing < 50000) return '#de2d26';
        return '#a50f15';
      },
      
      gridClass: () => {
        const gridClass = feature.properties.Grid_Class;
        const colorMap = {
          1: '#ffffcc',
          2: '#c7e9b4',
          3: '#7fcdbb',
          4: '#41b6c4',
          5: '#253494',
          6: '#1a237e',
          7: '#0d47a1'
        };
        return colorMap[gridClass] || '#808080';
      }
    };
    
    return schemes[colorScheme] ? schemes[colorScheme]() : schemes.housingSystem();
  };

  // Legend items for each color scheme
  const getLegendItems = () => {
    const items = {
      housingSystem: [
        { color: '#d62728', label: 'ระบบชุมชนแออัดบนที่ดินรัฐ/เอกชน' },
        { color: '#ff7f0e', label: 'ระบบถือครองชั่วคราว' },
        { color: '#bcbd22', label: 'ระบบกลุ่มประชากรแฝง' },
        { color: '#9467bd', label: 'ระบบที่อยู่อาศัยลูกจ้าง' },
        { color: '#2ca02c', label: 'ระบบที่อยู่อาศัยรัฐ' },
        { color: '#17becf', label: 'ระบบที่อยู่อาศัยรัฐสนับสนุน' },
        { color: '#1f77b4', label: 'ระบบที่อยู่อาศัยเอกชน' },
        { color: '#808080', label: 'ไม่มีข้อมูล' }
      ],
      populationDensity: [
        { color: '#ffffcc', label: '< 500 คน' },
        { color: '#c7e9b4', label: '500-1,000 คน' },
        { color: '#7fcdbb', label: '1,000-2,000 คน' },
        { color: '#41b6c4', label: '2,000-3,000 คน' },
        { color: '#2c7fb8', label: '3,000-5,000 คน' },
        { color: '#253494', label: '> 5,000 คน' }
      ],
      housingDensity: [
        { color: '#fff5f0', label: '< 1,000 หน่วย' },
        { color: '#fee0d2', label: '1,000-2,000 หน่วย' },
        { color: '#fcbba1', label: '2,000-5,000 หน่วย' },
        { color: '#fc9272', label: '5,000-10,000 หน่วย' },
        { color: '#fb6a4a', label: '10,000-20,000 หน่วย' },
        { color: '#de2d26', label: '20,000-50,000 หน่วย' },
        { color: '#a50f15', label: '> 50,000 หน่วย' }
      ],
      gridClass: [
        { color: '#ffffcc', label: 'ระดับ 1 (ต่ำสุด)' },
        { color: '#c7e9b4', label: 'ระดับ 2' },
        { color: '#7fcdbb', label: 'ระดับ 3' },
        { color: '#41b6c4', label: 'ระดับ 4' },
        { color: '#253494', label: 'ระดับ 5' },
        { color: '#1a237e', label: 'ระดับ 6' },
        { color: '#0d47a1', label: 'ระดับ 7 (สูงสุด)' }
      ]
    };
    return items[colorScheme] || items.housingSystem;
  };

  // Filter features based on current filters
  const filterFeatures = (features) => {
    return features.filter(feature => {
      const props = feature.properties;
      
      // Housing system filter
      if (filters.housingSystem !== 'all') {
        const dominantSystem = [1,2,3,4,5,6,7].reduce((max, code) => {
          const count = props[`HDS_C${code}_num`] || 0;
          const maxCount = props[`HDS_C${max}_num`] || 0;
          return count > maxCount ? code : max;
        }, 1);
        
        if (dominantSystem.toString() !== filters.housingSystem) {
          return false;
        }
      }
      
      // Density level filter
      if (filters.densityLevel !== 'all') {
        if (props.Grid_Class?.toString() !== filters.densityLevel) {
          return false;
        }
      }
      
      // Population range filter
      if (filters.populationRange !== 'all') {
        const pop = props.Grid_POP || 0;
        const [min, max] = filters.populationRange.split('-').map(Number);
        if (pop < min || (max !== 999999 && pop > max)) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const config = provinceConfigs[selectedProvince];
    if (!config) return;

    // Create Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: config.center,
      zoom: config.zoom,
      maxZoom: 16,
      minZoom: 8,
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
    const legend = L.control({ position: isMobile ? 'topleft' : 'bottomright' });
    
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend');
      
      if (isMobile) {
        div.style.cssText = 'background: white; padding: 6px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); font-size: 9px; max-height: 80px; overflow-y: auto; z-index: 1; max-width: 280px;';
      } else {
        div.style.cssText = 'background: white; padding: 10px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); font-size: 12px; max-height: 400px; overflow-y: auto;';
      }
      
      return div;
    };
    
    legend.addTo(map);
    legendRef.current = legend;

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [isMobile, selectedProvince]); // Re-initialize when province changes

  // Load and update GeoJSON data when province or filters change
  useEffect(() => {
    if (!mapRef.current) return;

    const config = provinceConfigs[selectedProvince];
    if (!config) return;

    // Remove existing HDS layer
    if (hdsLayerRef.current) {
      mapRef.current.removeLayer(hdsLayerRef.current);
    }

    // Load GeoJSON data for selected province
    fetch(config.file)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load HDS GeoJSON data for ${config.name}`);
        return response.json();
      })
      .then(geojsonData => {
        console.log(`GeoJSON data loaded for ${config.name}:`, geojsonData.features.length, 'features');
        console.log('Sample original coordinates:', geojsonData.features[0]?.geometry?.coordinates[0]?.slice(0, 2));
        console.log('CRS:', geojsonData.crs);
        console.log('Selected province:', selectedProvince);
        
        // Special note for Chiang Mai mislabeled CRS
        if (selectedProvince === 'cnx') {
          console.log('Note: Chiang Mai file has incorrect CRS label (EPSG:3857) but contains UTM coordinates');
        }

        // Transform coordinates based on the coordinate system
        const transformedGeoJSON = {
          ...geojsonData,
          features: geojsonData.features.map(feature => {
            if (feature.geometry && feature.geometry.coordinates) {
              const transformedCoordinates = feature.geometry.coordinates.map(ring => 
                ring.map(coord => {
                  const [x, y] = coord;
                  
                  // Validate input coordinates
                  if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
                    console.warn(`Invalid input coordinates: [${x}, ${y}]`);
                    return [0, 0]; // Return valid fallback coordinates
                  }
                  
                  // Force UTM conversion for Chiang Mai province OR detect UTM coordinates
                  // (Ignore CRS label as Chiang Mai file has incorrect EPSG:3857 label but UTM coordinates)
                  if (selectedProvince === 'cnx' || 
                      (x > 400000 && x < 600000 && y > 2000000 && y < 2100000)) {
                    // Simple and reliable UTM Zone 47N to WGS84 conversion for Chiang Mai
                    // Using empirical formula that works for Thailand region
                    
                    // UTM Zone 47N central meridian is 99°E
                    // Simple linear approximation for Thailand area
                    const utmEasting = x;
                    const utmNorthing = y;
                    
                    // Convert using simple degree conversion
                    // 1 degree ≈ 111,320 meters at equator for longitude
                    // 1 degree ≈ 111,000 meters for latitude
                    const lng = 99.0 + (utmEasting - 500000) / 111320;
                    const lat = (utmNorthing / 111000) - 0.3; // Adjust for northern hemisphere offset
                    
                    // Validate output coordinates
                    if (isNaN(lng) || isNaN(lat) || !isFinite(lng) || !isFinite(lat)) {
                      console.warn(`Invalid UTM conversion result: [${lng}, ${lat}] from [${x}, ${y}]`);
                      return [98.9853, 18.7883]; // Fallback to Chiang Mai center
                    }
                    
                    // Ensure coordinates are within reasonable bounds for Thailand
                    const validLng = Math.max(95, Math.min(105, lng));
                    const validLat = Math.max(5, Math.min(25, lat));
                    
                    console.log(`Simple UTM conversion: [${x}, ${y}] -> [${validLng.toFixed(6)}, ${validLat.toFixed(6)}]`);
                    return [validLng, validLat];
                  }
                  // Check if coordinates are in Web Mercator (EPSG:3857) - Khon Kaen
                  else if (Math.abs(x) > 1000000 || Math.abs(y) > 1000000) {
                    // Web Mercator to WGS84 conversion
                    const lng = x / 20037508.342789244 * 180;
                    const lat = Math.atan(Math.sinh(y / 20037508.342789244 * Math.PI)) * 180 / Math.PI;
                    
                    // Validate output coordinates
                    if (isNaN(lng) || isNaN(lat) || !isFinite(lng) || !isFinite(lat)) {
                      console.warn(`Invalid Web Mercator conversion: [${lng}, ${lat}] from [${x}, ${y}]`);
                      return [102.8359, 16.4419]; // Fallback to Khon Kaen center
                    }
                    
                    // Validate coordinates are within Thailand bounds
                    if (lat >= 5 && lat <= 25 && lng >= 95 && lng <= 110) {
                      console.log(`WebMercator->WGS84 conversion: [${x}, ${y}] -> [${lng.toFixed(6)}, ${lat.toFixed(6)}]`);
                      return [lng, lat];
                    } else {
                      console.warn(`Web Mercator result outside Thailand bounds: [${lng}, ${lat}]`);
                      return [102.8359, 16.4419]; // Fallback to Khon Kaen center
                    }
                  }
                  
                  // Already in WGS84 or unknown coordinate system
                  // Validate that these are reasonable lat/lng coordinates
                  if (x >= -180 && x <= 180 && y >= -90 && y <= 90) {
                    console.log(`Using original coordinates (WGS84): [${x}, ${y}]`);
                    return [x, y];
                  } 
                  // Check for swapped coordinates (lat, lng instead of lng, lat)
                  else if (y >= -180 && y <= 180 && x >= -90 && x <= 90) {
                    console.log(`Swapping coordinates from [lat, lng] to [lng, lat]: [${x}, ${y}] -> [${y}, ${x}]`);
                    return [y, x];
                  }
                  else {
                    console.warn(`Unknown coordinate system or invalid coordinates: [${x}, ${y}]`);
                    // Return appropriate fallback based on province
                    return selectedProvince === 'cnx' ? [98.9853, 18.7883] : [102.8359, 16.4419];
                  }
                })
              );
              
              return {
                ...feature,
                geometry: {
                  ...feature.geometry,
                  coordinates: transformedCoordinates
                }
              };
            }
            return feature;
          })
        };

        // Log sample transformed coordinates for debugging
        console.log('Sample transformed coordinates:', transformedGeoJSON.features[0]?.geometry?.coordinates[0]?.slice(0, 2));

        // Filter features based on current filters
        const filteredFeatures = filterFeatures(transformedGeoJSON.features);
        
        // Create filtered GeoJSON
        const filteredGeoJSON = {
          ...transformedGeoJSON,
          features: filteredFeatures
        };

        // Add HDS layer to map
        const hdsLayer = L.geoJSON(filteredGeoJSON, {
          style: (feature) => {
            const gridId = feature.properties.FID || feature.properties.Grid_CODE || feature.properties.OBJECTID_1;
            const selectedId = selectedGrid?.FID || selectedGrid?.Grid_CODE || selectedGrid?.OBJECTID_1;
            const isSelected = selectedGrid && selectedId === gridId;
            
            return {
              fillColor: getFeatureColor(feature),
              weight: isSelected ? 3 : 1,
              opacity: 0.8,
              color: isSelected ? '#ff0000' : '#666666',
              fillOpacity: 0.7
            };
          },
          onEachFeature: (feature, layer) => {
            // Add popup
            layer.bindPopup(generatePopupContent(feature, colorScheme));
            
            // Add click event
            layer.on('click', () => {
              // Handle different ID field names
              const gridData = {
                ...feature.properties,
                FID: feature.properties.FID || feature.properties.Grid_CODE || feature.properties.OBJECTID_1
              };
              onGridSelect(gridData);
            });
            
            // Add hover effects
            layer.on('mouseover', () => {
              layer.setStyle({
                weight: 3,
                color: '#333333',
                fillOpacity: 0.9
              });
            });
            
            layer.on('mouseout', () => {
              const gridId = feature.properties.FID || feature.properties.Grid_CODE || feature.properties.OBJECTID_1;
              const selectedId = selectedGrid?.FID || selectedGrid?.Grid_CODE || selectedGrid?.OBJECTID_1;
              
              if (!selectedGrid || selectedId !== gridId) {
                layer.setStyle({
                  weight: 1,
                  color: '#666666',
                  fillOpacity: 0.7
                });
              }
            });
          }
        }).addTo(mapRef.current);

        hdsLayerRef.current = hdsLayer;

        // Update legend
        if (legendRef.current) {
          const legendContainer = legendRef.current.getContainer();
          const legendItems = getLegendItems();
          
          legendContainer.innerHTML = `
            <div style="font-weight: bold; margin-bottom: ${isMobile ? '4px' : '8px'}; color: #374151;">
              ${config.name} - ${colorScheme === 'housingSystem' ? 'ระบบที่อยู่อาศัย' : 
                colorScheme === 'populationDensity' ? 'ความหนาแน่นประชากร' :
                colorScheme === 'housingDensity' ? 'ความหนาแน่นที่อยู่อาศัย' : 'ระดับความหนาแน่น'}
            </div>
            ${legendItems.map(item => `
              <div style="display: flex; align-items: center; margin-bottom: ${isMobile ? '2px' : '4px'};">
                <div style="width: ${isMobile ? '12px' : '16px'}; height: ${isMobile ? '12px' : '16px'}; background-color: ${item.color}; margin-right: ${isMobile ? '4px' : '6px'}; border: 1px solid #ccc; flex-shrink: 0;"></div>
                <span style="color: #374151; ${isMobile ? 'font-size: 8px;' : ''}">${item.label}</span>
              </div>
            `).join('')}
            <div style="margin-top: ${isMobile ? '4px' : '8px'}; padding-top: ${isMobile ? '4px' : '8px'}; border-top: 1px solid #e5e7eb; font-size: ${isMobile ? '7px' : '10px'}; color: #6b7280;">
              รวม ${filteredFeatures.length.toLocaleString()} กริด
            </div>
          `;
        }

        // Fit map to bounds if this is a province change
        const bounds = L.latLngBounds();
        filteredGeoJSON.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            feature.geometry.coordinates[0].forEach(coord => {
              bounds.extend([coord[1], coord[0]]);
            });
          }
        });
        
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, {
            padding: isMobile ? [20, 20] : [50, 50],
            maxZoom: isMobile ? 12 : 14
          });
        }

      })
      .catch(error => {
        console.error(`Error loading HDS data for ${config.name}:`, error);
        
        // Update legend with error message
        if (legendRef.current) {
          const legendContainer = legendRef.current.getContainer();
          legendContainer.innerHTML = `
            <div style="color: #dc2626; font-weight: bold;">
              ไม่สามารถโหลดข้อมูล ${config.name}
            </div>
            <div style="font-size: 10px; color: #6b7280; margin-top: 4px;">
              ${error.message}
            </div>
          `;
        }
      });

  }, [selectedProvince, filters, colorScheme, selectedGrid]);

  // Update map center when province changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    const config = provinceConfigs[selectedProvince];
    if (config) {
      mapRef.current.setView(config.center, config.zoom);
    }
  }, [selectedProvince]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        height: getMapHeight(),
        width: '100%',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    />
  );
};

export default HDSMap;
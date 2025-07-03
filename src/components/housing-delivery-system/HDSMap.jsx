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

const HDSMap = ({ filters, colorScheme = 'housingSystem', isMobile, onGridSelect, selectedGrid, selectedProvince = 40 }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const hdsLayerRef = useRef(null);
  const legendRef = useRef(null);

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

  // Province configurations with their corresponding GeoJSON files
  const provinceConfigs = {
    40: {
      name: 'ขอนแก่น',
      file: '/data/HDS_KKN01.geojson',
      needsTransformation: false, // New coordinate system, already in WGS84
      center: [16.4419, 102.8359],
      bounds: [[15.5, 101.5], [17.5, 104.0]]
    },
    50: {
      name: 'เชียงใหม่',
      file: '/data/HDS_CNX_02GJSON.geojson',
      needsTransformation: false, // Already in WGS84 format
      center: [18.7883, 98.9817],
      bounds: [[18.0, 98.0], [19.5, 100.0]]
    }
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
    
    // Handle different property structures between provinces
    const gridId = props.FID || props.OBJECTID_1 || props.Grid_Code || props.Grid_CODE;
    const gridPop = props.Grid_POP || 0;
    const gridHouse = props.Grid_House || 0;
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
    
    const currentProvince = provinceConfigs[selectedProvince];
    
    return `
      <div class="p-3 min-w-[280px]">
        <div class="bg-gray-50 -m-3 p-3 mb-3 border-b">
          <h3 class="font-bold text-gray-800">พื้นที่กริด ID: ${gridId}</h3>
          <p class="text-sm text-gray-600 mt-1">${currentProvince?.name || 'ไม่ทราบจังหวัด'} - ระบบที่อยู่อาศัย</p>
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
            <span class="text-gray-600">ระดับความหนาแน่น</span>
            <span class="font-medium text-gray-800">Class ${gridClass}</span>
          </div>
          
          ${totalHousing > 0 ? `
            <div class="border-t pt-2 mt-3">
              <h4 class="text-sm font-medium text-gray-700 mb-2">ระบบที่อยู่อาศัยหลัก</h4>
              <div class="text-xs text-gray-600">
                <div class="font-medium text-blue-600">${hdsCategories[dominantSystem.code]} (${dominantSystem.count.toLocaleString()} หน่วย)</div>
                <div class="mt-1 text-xs">
                  รวม ${totalHousing.toLocaleString()} หน่วย | คิดเป็น ${((dominantSystem.count / totalHousing) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  // Color functions for different schemes
  const getColor = (feature) => {
    const props = feature.properties;
    
    switch (colorScheme) {
      case 'populationDensity':
        const density = (props.Grid_POP || 0) / (props.Shape_Area || 4000000) * 1000000; // per km²
        return density > 1000 ? '#800026' :
               density > 500  ? '#BD0026' :
               density > 200  ? '#E31A1C' :
               density > 100  ? '#FC4E2A' :
               density > 50   ? '#FD8D3C' :
               density > 20   ? '#FEB24C' :
               density > 10   ? '#FED976' :
                               '#FFEDA0';
      
      case 'housingDensity':
        const housingDensity = (props.Grid_House || 0) / (props.Shape_Area || 4000000) * 1000000; // per km²
        return housingDensity > 2000 ? '#800026' :
               housingDensity > 1000 ? '#BD0026' :
               housingDensity > 500  ? '#E31A1C' :
               housingDensity > 200  ? '#FC4E2A' :
               housingDensity > 100  ? '#FD8D3C' :
               housingDensity > 50   ? '#FEB24C' :
               housingDensity > 20   ? '#FED976' :
                                      '#FFEDA0';
      
      case 'gridClass':
        const gridClass = props.Grid_Class;
        switch (gridClass) {
          case 1: return '#ffffcc';
          case 2: return '#fed976';
          case 3: return '#feb24c';
          case 4: return '#fd8d3c';
          case 5: return '#fc4e2a';
          case 6: return '#e31a1c';
          case 7: return '#bd0026';
          default: return '#f0f0f0';
        }
      
      case 'housingSystem':
      default:
        // Find dominant housing system
        const hdsNumbers = [
          { code: 1, count: props.HDS_C1_num || 0, color: '#ff6b6b' },
          { code: 2, count: props.HDS_C2_num || 0, color: '#4ecdc4' },
          { code: 3, count: props.HDS_C3_num || 0, color: '#45b7d1' },
          { code: 4, count: props.HDS_C4_num || 0, color: '#96ceb4' },
          { code: 5, count: props.HDS_C5_num || 0, color: '#feca57' },
          { code: 6, count: props.HDS_C6_num || 0, color: '#ff9ff3' },
          { code: 7, count: props.HDS_C7_num || 0, color: '#a8e6cf' }
        ];
        
        const dominantSystem = hdsNumbers.reduce((max, current) => 
          current.count > max.count ? current : max
        );
        
        return dominantSystem.count > 0 ? dominantSystem.color : '#f0f0f0';
    }
  };

  // Legend items for different color schemes
  const getLegendItems = () => {
    switch (colorScheme) {
      case 'populationDensity':
        return [
          { color: '#800026', label: '> 1,000 คน/ตร.กม.' },
          { color: '#BD0026', label: '500-1,000 คน/ตร.กม.' },
          { color: '#E31A1C', label: '200-500 คน/ตร.กม.' },
          { color: '#FC4E2A', label: '100-200 คน/ตร.กม.' },
          { color: '#FD8D3C', label: '50-100 คน/ตร.กม.' },
          { color: '#FEB24C', label: '20-50 คน/ตร.กม.' },
          { color: '#FED976', label: '10-20 คน/ตร.กม.' },
          { color: '#FFEDA0', label: '< 10 คน/ตร.กม.' }
        ];
      
      case 'housingDensity':
        return [
          { color: '#800026', label: '> 2,000 หน่วย/ตร.กม.' },
          { color: '#BD0026', label: '1,000-2,000 หน่วย/ตร.กม.' },
          { color: '#E31A1C', label: '500-1,000 หน่วย/ตร.กม.' },
          { color: '#FC4E2A', label: '200-500 หน่วย/ตร.กม.' },
          { color: '#FD8D3C', label: '100-200 หน่วย/ตร.กม.' },
          { color: '#FEB24C', label: '50-100 หน่วย/ตร.กม.' },
          { color: '#FED976', label: '20-50 หน่วย/ตร.กม.' },
          { color: '#FFEDA0', label: '< 20 หน่วย/ตร.กม.' }
        ];
      
      case 'gridClass':
        return [
          { color: '#ffffcc', label: 'Class 1 (ต่ำสุด)' },
          { color: '#fed976', label: 'Class 2' },
          { color: '#feb24c', label: 'Class 3' },
          { color: '#fd8d3c', label: 'Class 4' },
          { color: '#fc4e2a', label: 'Class 5' },
          { color: '#e31a1c', label: 'Class 6' },
          { color: '#bd0026', label: 'Class 7 (สูงสุด)' }
        ];
      
      case 'housingSystem':
      default:
        return [
          { color: '#ff6b6b', label: 'ชุมชนแออัดบนที่ดินรัฐ/เอกชน' },
          { color: '#4ecdc4', label: 'การถือครองที่ดินชั่วคราว' },
          { color: '#45b7d1', label: 'กลุ่มประชากรแฝง' },
          { color: '#96ceb4', label: 'ที่อยู่อาศัยของลูกจ้าง' },
          { color: '#feca57', label: 'ที่อยู่อาศัยที่รัฐจัดสร้าง' },
          { color: '#ff9ff3', label: 'ที่อยู่อาศัยที่รัฐสนับสนุน' },
          { color: '#a8e6cf', label: 'ที่อยู่อาศัยเอกชน' }
        ];
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const currentProvince = provinceConfigs[selectedProvince];
    if (!currentProvince) {
      console.error('Unknown province:', selectedProvince);
      return;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: currentProvince.center,
      zoom: isMobile ? 10 : 11,
      zoomControl: !isMobile,
      attributionControl: false
    });

    mapRef.current = map;

    // Add zoom control to bottom right for mobile
    if (isMobile) {
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // Add legend
    const legend = L.control({ 
      position: isMobile ? 'topleft' : 'bottomright' 
    });
    
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

    // Load GeoJSON data for selected province
    fetch(currentProvince.file)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load HDS GeoJSON data for ${currentProvince.name}`);
        return response.json();
      })
      .then(geojsonData => {
        console.log(`${currentProvince.name} GeoJSON data loaded:`, geojsonData.features.length, 'features');
        console.log('Original coordinates sample:', geojsonData.features[0]?.geometry?.coordinates[0]?.slice(0, 2));
        
        let processedGeoJSON = geojsonData;

        // Check if coordinates need transformation
        if (currentProvince.needsTransformation) {
          // Transform coordinates from Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
          processedGeoJSON = {
            ...geojsonData,
            features: geojsonData.features.map(feature => {
              if (feature.geometry && feature.geometry.coordinates) {
                const transformedCoordinates = feature.geometry.coordinates.map(ring => 
                  ring.map(coord => {
                    // Convert from Web Mercator to WGS84 using more precise formula
                    const [x, y] = coord;
                    
                    // More precise Web Mercator to WGS84 conversion
                    const lng = x / 20037508.342789244 * 180;
                    const lat = Math.atan(Math.sinh(y / 20037508.342789244 * Math.PI)) * 180 / Math.PI;
                    
                    // Debug: Check if coordinates are reasonable for Thailand
                    if (lng < 97 || lng > 106 || lat < 5 || lat > 21) {
                      console.warn('Unusual coordinates detected:', { original: coord, transformed: [lng, lat] });
                    }
                    
                    return [lng, lat]; // GeoJSON format: [lng, lat]
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
        } else {
          // Coordinates are already in WGS84, just validate them
          const sampleCoord = geojsonData.features[0]?.geometry?.coordinates[0]?.[0];
          if (sampleCoord) {
            const [lng, lat] = sampleCoord;
            console.log(`${currentProvince.name} coordinates are already in WGS84:`, { lng, lat });
            
            // Validate coordinates are reasonable for Thailand
            if (lng < 97 || lng > 106 || lat < 5 || lat > 21) {
              console.warn(`Unusual coordinates detected for ${currentProvince.name}:`, { lng, lat });
            }
          }
        }

        console.log('Processed GeoJSON:', processedGeoJSON.features.length, 'features');
        console.log('Sample processed coordinates:', processedGeoJSON.features[0]?.geometry?.coordinates[0]?.slice(0, 2));

        // Style function for HDS grids
        const style = (feature) => {
          const isSelected = selectedGrid && (
            selectedGrid.FID === feature.properties.FID ||
            selectedGrid.OBJECTID_1 === feature.properties.OBJECTID_1 ||
            selectedGrid.Grid_Code === feature.properties.Grid_Code ||
            selectedGrid.Grid_CODE === feature.properties.Grid_CODE
          );
          
          return {
            fillColor: getColor(feature),
            weight: isSelected ? 3 : 0.5,
            opacity: 0.8,
            color: isSelected ? '#ff0000' : '#666666',
            fillOpacity: 0.7
          };
        };

        // Add HDS layer
        const hdsLayer = L.geoJSON(processedGeoJSON, {
          style: style,
          onEachFeature: (feature, layer) => {
            // Add click functionality for grid selection
            layer.on('click', (e) => {
              const clickedFeature = feature;
              
              // Call the parent component's callback to update statistics
              if (onGridSelect) {
                onGridSelect(clickedFeature.properties);
              }
              
              // For mobile, show a smaller popup that doesn't interfere with legend
              if (isMobile) {
                const gridId = clickedFeature.properties.FID || 
                             clickedFeature.properties.OBJECTID_1 || 
                             clickedFeature.properties.Grid_Code || 
                             clickedFeature.properties.Grid_CODE;
                const gridPop = clickedFeature.properties.Grid_POP || 0;
                
                const popup = L.popup({
                  maxWidth: 280,
                  className: 'hds-popup mobile-popup',
                  closeButton: true,
                  offset: [0, -10]
                })
                  .setLatLng(e.latlng)
                  .setContent(`
                    <div class="p-2 text-sm">
                      <h3 class="font-bold text-gray-800 mb-1">กริด ID: ${gridId}</h3>
                      <p class="text-xs text-gray-600 mb-2">ประชากร: ${Math.round(gridPop).toLocaleString()} คน</p>
                      <p class="text-xs text-blue-600">ดูรายละเอียดในแผงสถิติด้านล่าง</p>
                    </div>
                  `)
                  .openOn(map);
                
                // Auto-close popup after 3 seconds on mobile
                setTimeout(() => {
                  map.closePopup(popup);
                }, 3000);
              } else {
                // Desktop: show full popup
                const popup = L.popup({
                  maxWidth: 400,
                  className: 'hds-popup',
                  closeButton: true
                })
                  .setLatLng(e.latlng)
                  .setContent(generatePopupContent(clickedFeature, colorScheme))
                  .openOn(map);
              }
            });

            // Add hover effect for desktop only (no popup repositioning)
            if (!isMobile) {
              layer.on('mouseover', (e) => {
                // Just highlight the layer, no popup
                layer.setStyle({
                  weight: 2,
                  color: '#ff0000',
                  fillOpacity: 0.9
                });
              });

              layer.on('mouseout', (e) => {
                // Reset to normal style
                const isSelected = selectedGrid && (
                  selectedGrid.FID === layer.feature.properties.FID ||
                  selectedGrid.OBJECTID_1 === layer.feature.properties.OBJECTID_1 ||
                  selectedGrid.Grid_Code === layer.feature.properties.Grid_Code ||
                  selectedGrid.Grid_CODE === layer.feature.properties.Grid_CODE
                );
                layer.setStyle({
                  fillColor: getColor(layer.feature),
                  weight: isSelected ? 3 : 0.5,
                  opacity: 0.8,
                  color: isSelected ? '#ff0000' : '#666666',
                  fillOpacity: 0.7
                });
              });
            }
          }
        }).addTo(map);

        hdsLayerRef.current = hdsLayer;

        // Calculate bounds from coordinates (for initial view only)
        const bounds = L.latLngBounds();
        processedGeoJSON.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            feature.geometry.coordinates[0].forEach(coord => {
              // Coordinates are already [lng, lat], Leaflet expects [lat, lng]
              bounds.extend([coord[1], coord[0]]);
            });
          }
        });
        
        // Only fit bounds on initial load, don't force it afterwards
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: isMobile ? [20, 20] : [50, 50],
            maxZoom: isMobile ? 14 : 16
          });
        }

        // Update legend initially
        updateLegend();
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
      });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [isMobile, selectedProvince]); // Added selectedProvince to dependencies

  // Update filters when they change
  useEffect(() => {
    if (!mapRef.current || !hdsLayerRef.current) return;

    // Filter the layer based on current filters
    hdsLayerRef.current.eachLayer((layer) => {
      const feature = layer.feature.properties;
      let shouldShow = true;
      
      if (filters.housingSystem !== 'all') {
        const systemNum = parseInt(filters.housingSystem);
        if (systemNum >= 1 && systemNum <= 7) {
          const fieldName = `HDS_C${systemNum}_num`;
          shouldShow = shouldShow && ((feature[fieldName] || 0) > 0);
        }
      }
      
      if (filters.densityLevel !== 'all') {
        shouldShow = shouldShow && (feature.Grid_Class === parseInt(filters.densityLevel));
      }
      
      if (filters.populationRange !== 'all') {
        const [min, max] = filters.populationRange.split('-').map(Number);
        const population = feature.Grid_POP || 0;
        shouldShow = shouldShow && (population >= min);
        if (max) {
          shouldShow = shouldShow && (population <= max);
        }
      }

      // Show/hide layer based on filter
      if (shouldShow) {
        if (!mapRef.current.hasLayer(layer)) {
          layer.addTo(mapRef.current);
        }
      } else {
        if (mapRef.current.hasLayer(layer)) {
          mapRef.current.removeLayer(layer);
        }
      }
    });
  }, [filters]);

  // Update colors and selected grid styling when color scheme or selected grid changes
  useEffect(() => {
    if (!mapRef.current || !hdsLayerRef.current) return;

    // Re-style all layers
    hdsLayerRef.current.eachLayer((layer) => {
      const isSelected = selectedGrid && (
        selectedGrid.FID === layer.feature.properties.FID ||
        selectedGrid.OBJECTID_1 === layer.feature.properties.OBJECTID_1 ||
        selectedGrid.Grid_Code === layer.feature.properties.Grid_Code ||
        selectedGrid.Grid_CODE === layer.feature.properties.Grid_CODE
      );
      
      layer.setStyle({
        fillColor: getColor(layer.feature),
        weight: isSelected ? 3 : 0.5,
        opacity: 0.8,
        color: isSelected ? '#ff0000' : '#666666',
        fillOpacity: 0.7
      });
    });

    updateLegend();
  }, [colorScheme, selectedGrid]); // Combined both effects into one

  // Update legend content
  const updateLegend = () => {
    if (!legendRef.current || !legendRef.current.getContainer()) return;

    const items = getLegendItems();
    const title = {
      housingSystem: 'ระบบที่อยู่อาศัยหลัก',
      populationDensity: 'ความหนาแน่นประชากร',
      housingDensity: 'ความหนาแน่นที่อยู่อาศัย',
      gridClass: 'ระดับความหนาแน่น'
    }[colorScheme] || 'คำอธิบายสัญลักษณ์';
    
    // Different styling for mobile vs desktop
    const fontSize = isMobile ? '8px' : '12px';
    const marginBottom = isMobile ? '1px' : '4px';
    const colorBoxSize = isMobile ? '10px' : '16px';
    
    legendRef.current.getContainer().innerHTML = `
      <h4 style="margin: 0 0 4px 0; font-weight: 600; font-size: ${isMobile ? '9px' : fontSize};">${title}</h4>
      ${items.map(item => `
        <div style="display: flex; align-items: center; margin-bottom: ${marginBottom};">
          <span style="display: inline-block; width: ${colorBoxSize}; height: ${colorBoxSize}; margin-right: 6px; background: ${item.color}; border: 1px solid rgba(0,0,0,0.2);"></span>
          <span style="font-size: ${fontSize}; line-height: 1.2;">${item.label}</span>
        </div>
      `).join('')}
    `;
  };

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

export default HDSMap;
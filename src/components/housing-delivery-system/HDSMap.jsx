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

const HDSMap = ({ filters, colorScheme = 'housingSystem', isMobile, onGridSelect, selectedGrid }) => {
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
          <h3 class="font-bold text-gray-800">พื้นที่กริด ID: ${props.FID}</h3>
          <p class="text-sm text-gray-600 mt-1">ขอนแก่น - ระบบที่อยู่อาศัย</p>
        </div>
        
        <div class="space-y-2">
          <div class="flex justify-between items-baseline text-sm">
            <span class="text-gray-600">ประชากรรวม</span>
            <span class="font-medium text-gray-800">${props.Grid_POP ? Math.round(props.Grid_POP).toLocaleString() : 'ไม่มีข้อมูล'} คน</span>
          </div>
          
          <div class="flex justify-between items-baseline text-sm">
            <span class="text-gray-600">ที่อยู่อาศัยรวม</span>
            <span class="font-medium text-gray-800">${props.Grid_House ? props.Grid_House.toLocaleString() : 'ไม่มีข้อมูล'} หน่วย</span>
          </div>
          
          <div class="flex justify-between items-baseline text-sm">
            <span class="text-gray-600">ระดับความหนาแน่น</span>
            <span class="font-medium text-gray-800">ระดับ ${props.Grid_Class || 'ไม่มีข้อมูล'}</span>
          </div>
          
          ${totalHousing > 0 ? `
            <div class="border-t border-gray-200 mt-3 pt-3">
              <p class="text-xs font-medium text-gray-600 mb-2">ระบบที่อยู่อาศัยหลัก:</p>
              <p class="text-sm font-medium text-blue-600">
                ${hdsCategories[dominantSystem.code]} (${dominantSystem.count.toLocaleString()} หน่วย)
              </p>
              <p class="text-xs text-gray-500">
                คิดเป็น ${((dominantSystem.count / totalHousing) * 100).toFixed(1)}% ของทั้งหมด
              </p>
            </div>
            
            <div class="border-t border-gray-200 mt-3 pt-3">
              <p class="text-xs font-medium text-gray-600 mb-2">รายละเอียดระบบที่อยู่อาศัย:</p>
              ${hdsNumbers.filter(item => item.count > 0).map(item => `
                <div class="flex justify-between text-xs">
                  <span class="text-gray-500">${hdsCategories[item.code]}:</span>
                  <span class="font-medium">${item.count.toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${props.Stability_ && props.Stability_.trim() ? `
            <div class="border-t border-gray-200 mt-3 pt-3">
              <p class="text-xs font-medium text-red-600">ปัญหาด้าน Stability:</p>
              <p class="text-xs text-gray-700">${props.Stability_}</p>
            </div>
          ` : ''}
          
          ${props.Subsidies_ && props.Subsidies_.trim() ? `
            <div class="border-t border-gray-200 mt-3 pt-3">
              <p class="text-xs font-medium text-orange-600">ปัญหาด้าน Subsidies:</p>
              <p class="text-xs text-gray-700">${props.Subsidies_}</p>
            </div>
          ` : ''}
          
          ${props.Supply_Pro && props.Supply_Pro.trim() ? `
            <div class="border-t border-gray-200 mt-3 pt-3">
              <p class="text-xs font-medium text-green-600">ปัญหาด้าน Supply:</p>
              <p class="text-xs text-gray-700">${props.Supply_Pro}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  // Color schemes for different attributes
  const getColor = (feature) => {
    const props = feature.properties;
    
    const schemes = {
      housingSystem: () => {
        // Find the dominant housing system for each grid
        const hdsNumbers = [
          { code: 1, count: props.HDS_C1_num || 0, color: '#d62728' },
          { code: 2, count: props.HDS_C2_num || 0, color: '#ff7f0e' },
          { code: 3, count: props.HDS_C3_num || 0, color: '#bcbd22' },
          { code: 4, count: props.HDS_C4_num || 0, color: '#9467bd' },
          { code: 5, count: props.HDS_C5_num || 0, color: '#2ca02c' },
          { code: 6, count: props.HDS_C6_num || 0, color: '#17becf' },
          { code: 7, count: props.HDS_C7_num || 0, color: '#1f77b4' }
        ];
        
        const dominantSystem = hdsNumbers.reduce((max, item) => item.count > max.count ? item : max);
        return dominantSystem.count > 0 ? dominantSystem.color : '#808080';
      },
      populationDensity: () => {
        const pop = props.Grid_POP || 0;
        if (pop < 500) return '#ffffcc';
        if (pop < 1000) return '#c7e9b4';
        if (pop < 2000) return '#7fcdbb';
        if (pop < 3000) return '#41b6c4';
        if (pop < 5000) return '#2c7fb8';
        return '#253494';
      },
      housingDensity: () => {
        const housing = props.Grid_House || 0;
        if (housing < 1000) return '#fff5f0';
        if (housing < 2000) return '#fee0d2';
        if (housing < 5000) return '#fcbba1';
        if (housing < 10000) return '#fc9272';
        if (housing < 20000) return '#fb6a4a';
        if (housing < 50000) return '#de2d26';
        return '#a50f15';
      },
      gridClass: () => {
        const gridClass = props.Grid_Class;
        const colorMap = {
          1: '#ffffcc',
          2: '#c7e9b4',
          3: '#7fcdbb',
          4: '#41b6c4',
          5: '#253494'
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
        { color: '#253494', label: 'ระดับ 5 (สูงสุด)' }
      ]
    };
    return items[colorScheme] || items.housingSystem;
  };

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [16.4419, 102.8359], // Khon Kaen coordinates
      zoom: 10,
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

    // Load GeoJSON data
    fetch('/data/HDS_GRID_KKN_FeaturesToJSON.geojson')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load HDS GeoJSON data');
        return response.json();
      })
      .then(geojsonData => {
        console.log('GeoJSON data loaded:', geojsonData.features.length, 'features');
        console.log('Original coordinates sample:', geojsonData.features[0]?.geometry?.coordinates[0]?.slice(0, 2));
        
        // Transform coordinates from Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
        const transformedGeoJSON = {
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

        console.log('Transformed GeoJSON:', transformedGeoJSON.features.length, 'features');
        console.log('Sample transformed coordinates:', transformedGeoJSON.features[0]?.geometry?.coordinates[0]?.slice(0, 2));

        // Style function for HDS grids
        const style = (feature) => {
          const isSelected = selectedGrid && selectedGrid.FID === feature.properties.FID;
          
          return {
            fillColor: getColor(feature),
            weight: isSelected ? 3 : 0.5,
            opacity: 0.8,
            color: isSelected ? '#ff0000' : '#666666',
            fillOpacity: 0.7
          };
        };

        // Add HDS layer
        const hdsLayer = L.geoJSON(transformedGeoJSON, {
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
                const popup = L.popup({
                  maxWidth: 280,
                  className: 'hds-popup mobile-popup',
                  closeButton: true,
                  offset: [0, -10]
                })
                  .setLatLng(e.latlng)
                  .setContent(`
                    <div class="p-2 text-sm">
                      <h3 class="font-bold text-gray-800 mb-1">กริด ID: ${clickedFeature.properties.FID}</h3>
                      <p class="text-xs text-gray-600 mb-2">ประชากร: ${Math.round(clickedFeature.properties.Grid_POP || 0).toLocaleString()} คน</p>
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
                const isSelected = selectedGrid && selectedGrid.FID === layer.feature.properties.FID;
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

        // Calculate bounds from transformed coordinates (for initial view only)
        const bounds = L.latLngBounds();
        transformedGeoJSON.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            feature.geometry.coordinates[0].forEach(coord => {
              // Transformed coordinates are already [lng, lat], Leaflet expects [lat, lng]
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
  }, [isMobile]); // REMOVED selectedGrid and colorScheme dependencies

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
      const isSelected = selectedGrid && selectedGrid.FID === layer.feature.properties.FID;
      
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
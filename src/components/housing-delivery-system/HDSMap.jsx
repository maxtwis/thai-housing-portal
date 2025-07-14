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
    },
    90: {
      name: 'สงขลา',
      file: '/data/HDS_HYT.geojson',
      needsTransformation: false, // Already in WGS84 format
      center: [7.0, 100.45], // Based on the coordinates in your GeoJSON data
      bounds: [[6.8, 100.3], [7.2, 100.6]]
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

  // Housing system names mapping for tooltips
  const housingSystemNames = {
    1: 'ระบบของชุมชนแออัดบนที่ดินรัฐ/เอกชน',
    2: 'ระบบการถือครองที่ดินชั่วคราว',
    3: 'ระบบของกลุ่มประชากรแฝง',
    4: 'ระบบที่อยู่อาศัยของลูกจ้าง',
    5: 'ระบบที่อยู่อาศัยที่รัฐจัดสร้าง',
    6: 'ระบบที่อยู่อาศัยที่รัฐสนับสนุน',
    7: 'ระบบที่อยู่อาศัยเอกชน'
  };

  // Detailed popup content with full information
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
            <div class="bg-blue-50 p-2 rounded border-t border-blue-200 mt-3">
              <h4 class="font-semibold text-blue-800 text-sm mb-2">ระบบที่อยู่อาศัยหลัก</h4>
              <div class="text-sm">
                <span class="font-medium text-blue-700">${housingSystemNames[dominantSystem.code]}</span>
                <span class="text-blue-600 block">${dominantSystem.count.toLocaleString()} หน่วย (${((dominantSystem.count / totalHousing) * 100).toFixed(1)}%)</span>
              </div>
            </div>
            
            <div class="space-y-1 text-xs">
              <h5 class="font-medium text-gray-700">รายละเอียดระบบที่อยู่อาศัย:</h5>
              ${hdsNumbers.filter(item => item.count > 0).map(item => `
                <div class="flex justify-between">
                  <span class="text-gray-600">${housingSystemNames[item.code]}:</span>
                  <span class="font-medium">${item.count.toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="bg-gray-50 p-2 rounded text-center text-sm text-gray-500">
              ไม่มีข้อมูลระบบที่อยู่อาศัย
            </div>
          `}
          
          ${props.Subsidies_ ? `
            <div class="bg-yellow-50 p-2 rounded text-xs">
              <strong class="text-yellow-800">เงินอุดหนุน:</strong> ${props.Subsidies_}
            </div>
          ` : ''}
          
          ${props.Stability_ ? `
            <div class="bg-red-50 p-2 rounded text-xs">
              <strong class="text-red-800">ความมั่นคง:</strong> ${props.Stability_}
            </div>
          ` : ''}
          
          ${props.Supply_Pro ? `
            <div class="bg-green-50 p-2 rounded text-xs">
              <strong class="text-green-800">อุปทาน:</strong> ${props.Supply_Pro}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  // Color function for grids based on scheme
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
        // Find dominant housing system - ORIGINAL COLORS (easier to see)
        const hdsNumbers = [
          { code: 1, count: props.HDS_C1_num || 0, color: '#ff6b6b' }, // Light red
          { code: 2, count: props.HDS_C2_num || 0, color: '#4ecdc4' }, // Teal
          { code: 3, count: props.HDS_C3_num || 0, color: '#45b7d1' }, // Light blue
          { code: 4, count: props.HDS_C4_num || 0, color: '#96ceb4' }, // Light green
          { code: 5, count: props.HDS_C5_num || 0, color: '#feca57' }, // Yellow
          { code: 6, count: props.HDS_C6_num || 0, color: '#ff9ff3' }, // Pink
          { code: 7, count: props.HDS_C7_num || 0, color: '#a8e6cf' }  // Mint green
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
    if (!mapContainerRef.current) return;

    // Clean up any existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      hdsLayerRef.current = null;
      legendRef.current = null;
    }

    const currentProvince = provinceConfigs[selectedProvince];
    if (!currentProvince) {
      console.error('Unknown province:', selectedProvince);
      return;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: currentProvince.center,
      zoom: isMobile ? 9 : 10,
      zoomControl: !isMobile,
      attributionControl: false
    });

    mapRef.current = map;
    
    console.log(`Initializing map for ${currentProvince.name} at center:`, currentProvince.center);

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

        // The coordinates are already in WGS84 format [lng, lat]
        // Just validate and log them
        const sampleCoord = geojsonData.features[0]?.geometry?.coordinates[0]?.[0];
        if (sampleCoord) {
          const [lng, lat] = sampleCoord;
          console.log(`${currentProvince.name} coordinates are in WGS84 [lng, lat]:`, { lng, lat });
          
          // Validate coordinates are reasonable for Thailand
          if (lng < 97 || lng > 106 || lat < 5 || lat > 21) {
            console.warn(`Unusual coordinates detected for ${currentProvince.name}:`, { lng, lat });
          }
        }
        
        // No transformation needed - coordinates are already in correct WGS84 format
        processedGeoJSON = geojsonData;

        console.log('Processed GeoJSON:', processedGeoJSON.features.length, 'features');
        console.log('Sample processed coordinates:', processedGeoJSON.features[0]?.geometry?.coordinates[0]?.slice(0, 2));
        console.log('First feature geometry type:', processedGeoJSON.features[0]?.geometry?.type);

        // Style function for HDS grids - LOW OPACITY BORDERS
        const style = (feature) => {
          return {
            fillColor: getColor(feature),
            weight: 1, // Thin border
            opacity: 0.3, // Low opacity border - easy to see grids
            color: '#666666', // Gray border color
            fillOpacity: 0.8
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
                  autoPan: true,
                  keepInView: true
                })
                .setLatLng(e.latlng)
                .setContent(`
                  <div class="p-2">
                    <h4 class="font-bold text-sm">Grid ${gridId}</h4>
                    <p class="text-xs text-gray-600">${Math.round(gridPop).toLocaleString()} คน</p>
                    <button onclick="this.closest('.leaflet-popup').remove()" class="text-xs text-blue-600 mt-1">ปิด</button>
                  </div>
                `)
                .openOn(map);
              } else {
                // Desktop - show full popup
                const popupContent = generatePopupContent(clickedFeature, colorScheme);
                
                const popup = L.popup({
                  maxWidth: 350,
                  className: 'hds-popup',
                  autoPan: true,
                  keepInView: true
                })
                .setLatLng(e.latlng)
                .setContent(popupContent)
                .openOn(map);
              }
            });

            // Hover effects for better interaction
            if (!isMobile) {
              layer.on('mouseover', (e) => {
                layer.setStyle({
                  weight: 2,
                  opacity: 0.8, // Higher opacity on hover
                  color: '#333333', // Darker border on hover
                  fillOpacity: 0.9
                });
              });

              layer.on('mouseout', (e) => {
                // Reset to normal style with subtle borders
                layer.setStyle({
                  fillColor: getColor(layer.feature),
                  weight: 1,
                  opacity: 0.3, // Back to low opacity border
                  color: '#666666',
                  fillOpacity: 0.8
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
            // Handle MultiPolygon geometry
            const coordinates = feature.geometry.coordinates;
            if (coordinates && coordinates.length > 0) {
              // Get the outer ring of the first polygon
              const outerRing = coordinates[0][0];
              if (outerRing && Array.isArray(outerRing)) {
                outerRing.forEach(coord => {
                  // GeoJSON coordinates are [lng, lat], Leaflet expects [lat, lng]
                  if (coord && coord.length >= 2) {
                    bounds.extend([coord[1], coord[0]]); // [lat, lng] for Leaflet
                  }
                });
              }
            }
          }
        });
        
        console.log('Calculated bounds:', bounds.isValid() ? bounds.toString() : 'Invalid bounds');
        
        // Only fit bounds on initial load, don't force it afterwards
        if (bounds.isValid()) {
          console.log('Fitting map to bounds...');
          map.fitBounds(bounds, {
            padding: isMobile ? [20, 20] : [50, 50],
            maxZoom: isMobile ? 14 : 16
          });
        } else {
          console.log('Bounds invalid, using province center');
          map.setView(currentProvince.center, isMobile ? 9 : 10);
        }

        // Update legend initially
        updateLegend();
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
      });

    return () => {
      // Clean up map when component unmounts or province changes
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        hdsLayerRef.current = null;
        legendRef.current = null;
      }
    };
  }, [selectedProvince, isMobile]); // Re-initialize when province or mobile state changes

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

    // Re-style all layers with subtle borders
    hdsLayerRef.current.eachLayer((layer) => {
      layer.setStyle({
        fillColor: getColor(layer.feature),
        weight: 1, // Thin border
        opacity: 0.3, // Low opacity border
        color: '#666666', // Gray border
        fillOpacity: 0.8
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
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const HDSMap = ({ 
  filters, 
  colorScheme, 
  isMobile, 
  onGridSelect, 
  selectedGrid, 
  selectedProvince,
  supplyData // ONLY NEW PROP ADDED
}) => {
  const mapRef = useRef(null);
  const hdsLayerRef = useRef(null);
  const legendRef = useRef(null);

  // Province configurations - FIXED FOR SONGKHLA
  const provinceConfigs = {
    40: {
      name: 'ขอนแก่น',
      file: '/data/HDS_KKN01.geojson',
      center: [16.4419, 102.8359],
      bounds: [[15.5, 101.5], [17.5, 104.0]]
    },
    50: {
      name: 'เชียงใหม่',
      file: '/data/HDS_CNX_02GJSON.geojson',
      center: [18.7883, 98.9817],
      bounds: [[18.0, 98.0], [19.5, 100.0]]
    },
    90: {
      name: 'สงขลา',
      file: '/data/HDS_HYT.geojson',
      center: [7.01, 100.465], // Fixed center
      bounds: [[6.975, 100.425], [7.045, 100.505]] // Tighter bounds
    }
  };

  const currentProvince = provinceConfigs[selectedProvince] || provinceConfigs[40];

  // Color schemes - REVERTED TO ORIGINAL
  const colorSchemes = {
    housingSystem: {
      name: 'ระบบที่อยู่อาศัยหลัก',
      colors: [
        { min: 1, max: 1, color: '#ff6b6b', label: 'ระบบของชุมชนแออัดบนที่ดินรัฐ/เอกชน' },
        { min: 2, max: 2, color: '#4ecdc4', label: 'ระบบการถือครองที่ดินชั่วคราว' },
        { min: 3, max: 3, color: '#45b7d1', label: 'ระบบของกลุ่มประชากรแฝง' },
        { min: 4, max: 4, color: '#96ceb4', label: 'ระบบที่อยู่อาศัยของลูกจ้าง' },
        { min: 5, max: 5, color: '#feca57', label: 'ระบบที่อยู่อาศัยที่รัฐจัดสร้าง' },
        { min: 6, max: 6, color: '#ff9ff3', label: 'ระบบที่อยู่อาศัยที่รัฐสนับสนุน' },
        { min: 7, max: 7, color: '#a8e6cf', label: 'ระบบที่อยู่อาศัยเอกชน' }
      ]
    },
    populationDensity: {
      name: 'ความหนาแน่นประชากร',
      colors: [
        { min: 0, max: 10, color: '#FFEDA0', label: '< 10 คน/ตร.กม.' },
        { min: 10, max: 20, color: '#FED976', label: '10-20 คน/ตร.กม.' },
        { min: 20, max: 50, color: '#FEB24C', label: '20-50 คน/ตร.กม.' },
        { min: 50, max: 100, color: '#FD8D3C', label: '50-100 คน/ตร.กม.' },
        { min: 100, max: 200, color: '#FC4E2A', label: '100-200 คน/ตร.กม.' },
        { min: 200, max: 500, color: '#E31A1C', label: '200-500 คน/ตร.กม.' },
        { min: 500, max: 1000, color: '#BD0026', label: '500-1,000 คน/ตร.กม.' },
        { min: 1000, max: Infinity, color: '#800026', label: '> 1,000 คน/ตร.กม.' }
      ]
    },
    housingDensity: {
      name: 'ความหนาแน่นที่อยู่อาศัย',
      colors: [
        { min: 0, max: 20, color: '#FFEDA0', label: '< 20 หน่วย/ตร.กม.' },
        { min: 20, max: 50, color: '#FED976', label: '20-50 หน่วย/ตร.กม.' },
        { min: 50, max: 100, color: '#FEB24C', label: '50-100 หน่วย/ตร.กม.' },
        { min: 100, max: 200, color: '#FD8D3C', label: '100-200 หน่วย/ตร.กม.' },
        { min: 200, max: 500, color: '#FC4E2A', label: '200-500 หน่วย/ตร.กม.' },
        { min: 500, max: 1000, color: '#E31A1C', label: '500-1,000 หน่วย/ตร.กม.' },
        { min: 1000, max: 2000, color: '#BD0026', label: '1,000-2,000 หน่วย/ตร.กม.' },
        { min: 2000, max: Infinity, color: '#800026', label: '> 2,000 หน่วย/ตร.กม.' }
      ]
    },
    gridClass: {
      name: 'ระดับความหนาแน่น',
      colors: [
        { min: 1, max: 1, color: '#ffffcc', label: 'Class 1' },
        { min: 2, max: 2, color: '#fed976', label: 'Class 2' },
        { min: 3, max: 3, color: '#feb24c', label: 'Class 3' },
        { min: 4, max: 4, color: '#fd8d3c', label: 'Class 4' },
        { min: 5, max: 5, color: '#fc4e2a', label: 'Class 5' },
        { min: 6, max: 6, color: '#e31a1c', label: 'Class 6' },
        { min: 7, max: 7, color: '#bd0026', label: 'Class 7' }
      ]
    }
  };

  // Housing system names - REVERTED TO ORIGINAL
  const housingSystemNames = {
    1: 'ระบบของชุมชนแออัดบนที่ดินรัฐ/เอกชน',
    2: 'ระบบการถือครองที่ดินชั่วคราว',
    3: 'ระบบของกลุ่มประชากรแฝง',
    4: 'ระบบที่อยู่อาศัยของลูกจ้าง',
    5: 'ระบบที่อยู่อาศัยที่รัฐจัดสร้าง',
    6: 'ระบบที่อยู่อาศัยที่รัฐสนับสนุน',
    7: 'ระบบที่อยู่อาศัยเอกชน'
  };

  // ONLY CHANGE: Added supply data to popup content
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
    
    // ONLY NEW ADDITION: Get supply data for this grid
    const gridSupplyData = supplyData ? supplyData[gridId] : null;
    
    // ONLY NEW ADDITION: Format supply data section
    let supplySection = '';
    if (gridSupplyData && gridSupplyData.totalSupply > 0) {
      const { totalSupply, averageSalePrice, averageRentPrice, housingTypes } = gridSupplyData;
      
      supplySection = `
        <div class="border-t border-gray-200 mt-3 pt-3">
          <h4 class="font-semibold text-gray-800 mb-2 text-sm">ข้อมูลอุปทาน (Supply Data)</h4>
          
          <div class="space-y-2">
            <div class="flex justify-between items-baseline text-sm">
              <span class="text-gray-600">จำนวนอุปทานรวม</span>
              <span class="font-medium text-blue-600">${totalSupply.toLocaleString()} หน่วย</span>
            </div>
            
            ${averageSalePrice > 0 ? `
            <div class="flex justify-between items-baseline text-sm">
              <span class="text-gray-600">ราคาขายเฉลี่ย</span>
              <span class="font-medium text-green-600">${averageSalePrice.toLocaleString()} บาท</span>
            </div>
            ` : ''}
            
            ${averageRentPrice > 0 ? `
            <div class="flex justify-between items-baseline text-sm">
              <span class="text-gray-600">ราคาเช่าเฉลี่ย</span>
              <span class="font-medium text-orange-600">${averageRentPrice.toLocaleString()} บาท/เดือน</span>
            </div>
            ` : ''}
          </div>
          
          <div class="mt-3">
            <h5 class="font-medium text-gray-700 text-xs mb-2">ประเภทที่อยู่อาศัย</h5>
            <div class="space-y-1 max-h-24 overflow-y-auto">
              ${Object.entries(housingTypes || {}).slice(0, 5).map(([type, data]) => `
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600 truncate" style="max-width: 120px;" title="${type}">${type}</span>
                  <span class="font-medium text-gray-800">${data.supplyCount || 0}</span>
                </div>
              `).join('')}
              ${Object.keys(housingTypes || {}).length > 5 ? `
                <div class="text-xs text-gray-500 italic">และอีก ${Object.keys(housingTypes).length - 5} ประเภท...</div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    } else if (supplyData) {
      // Show message that no supply data exists for this grid
      supplySection = `
        <div class="border-t border-gray-200 mt-3 pt-3">
          <h4 class="font-semibold text-gray-800 mb-2 text-sm">ข้อมูลอุปทาน (Supply Data)</h4>
          <p class="text-xs text-gray-500 italic">ไม่มีข้อมูลอุปทานสำหรับกริดนี้</p>
        </div>
      `;
    }
    
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
          <div class="border-t border-gray-200 mt-3 pt-3">
            <h4 class="font-semibold text-gray-800 mb-2 text-sm">ระบบที่อยู่อาศัย</h4>
            <div class="flex justify-between items-baseline text-sm mb-2">
              <span class="text-gray-600">ระบบหลัก</span>
              <span class="font-medium text-blue-600">${housingSystemNames[dominantSystem.code] || 'ไม่ทราบ'}</span>
            </div>
            <div class="flex justify-between items-baseline text-sm">
              <span class="text-gray-600">จำนวนหน่วยในระบบหลัก</span>
              <span class="font-medium text-blue-600">${dominantSystem.count.toLocaleString()} หน่วย</span>
            </div>
          </div>
          ` : ''}
        </div>
        
        ${supplySection}
      </div>
    `;
  };

  // Get color function - REVERTED TO ORIGINAL LOGIC
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
        // Find dominant housing system - ORIGINAL COLORS
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

  // Update legend function - UNCHANGED
  const updateLegend = () => {
    if (!legendRef.current) return;

    const legend = legendRef.current;
    const div = legend.getContainer();
    
    const scheme = colorSchemes[colorScheme];
    if (!scheme) return;

    let legendHTML = `<div style="margin-bottom: 8px; font-weight: bold; font-size: ${isMobile ? '10px' : '12px'};">${scheme.name}</div>`;
    
    scheme.colors.forEach(item => {
      legendHTML += `
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
          <div style="width: ${isMobile ? '12px' : '16px'}; height: ${isMobile ? '12px' : '16px'}; background-color: ${item.color}; margin-right: 6px; border: 1px solid #ccc;"></div>
          <span style="font-size: ${isMobile ? '9px' : '11px'}; color: #333;">${item.label}</span>
        </div>
      `;
    });

    div.innerHTML = legendHTML;
  };

  // Initialize map - UNCHANGED EXCEPT FOR supplyData dependency
  useEffect(() => {
    if (!currentProvince) return;

    const container = document.getElementById('hds-map');
    if (!container) return;

    container.innerHTML = '';

    const map = L.map('hds-map', {
      center: currentProvince.center,
      zoom: isMobile ? 9 : 10,
      zoomControl: !isMobile,
      attributionControl: false
    });

    mapRef.current = map;
    
    console.log(`Initializing map for ${currentProvince.name} at center:`, currentProvince.center);

    if (isMobile) {
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

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

        const sampleCoord = geojsonData.features[0]?.geometry?.coordinates[0]?.[0];
        console.log('Sample coordinate after processing:', sampleCoord);

        const hdsLayer = L.geoJSON(processedGeoJSON, {
          style: function(feature) {
            return {
              fillColor: getColor(feature),
              weight: 1,
              opacity: 0.3,
              color: '#666666',
              fillOpacity: 0.8
            };
          },
          onEachFeature: function(feature, layer) {
            layer.on('click', (e) => {
              const clickedFeature = e.target.feature;
              
              if (onGridSelect) {
                onGridSelect(clickedFeature);
              }

              if (isMobile) {
                const gridId = clickedFeature.properties.FID || 
                             clickedFeature.properties.OBJECTID_1 || 
                             clickedFeature.properties.Grid_Code || 
                             clickedFeature.properties.Grid_CODE;
                const gridPop = clickedFeature.properties.Grid_POP || 0;
                
                // Get supply data for mobile popup too
                const gridSupplyData = supplyData ? supplyData[gridId] : null;
                let mobileSupplyInfo = '';
                if (gridSupplyData && gridSupplyData.totalSupply > 0) {
                  mobileSupplyInfo = `<p class="text-xs text-blue-600 mt-1">Supply: ${gridSupplyData.totalSupply} หน่วย</p>`;
                }
                
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
                    ${mobileSupplyInfo}
                    <button onclick="this.closest('.leaflet-popup').remove()" class="text-xs text-blue-600 mt-1">ปิด</button>
                  </div>
                `)
                .openOn(map);
              } else {
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

            if (!isMobile) {
              layer.on('mouseover', (e) => {
                layer.setStyle({
                  weight: 2,
                  opacity: 0.8,
                  color: '#333333',
                  fillOpacity: 0.9
                });
              });

              layer.on('mouseout', (e) => {
                layer.setStyle({
                  fillColor: getColor(layer.feature),
                  weight: 1,
                  opacity: 0.3,
                  color: '#666666',
                  fillOpacity: 0.8
                });
              });
            }
          }
        }).addTo(map);

        hdsLayerRef.current = hdsLayer;

        const bounds = L.latLngBounds();
        processedGeoJSON.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            const coordinates = feature.geometry.coordinates;
            if (coordinates && coordinates.length > 0) {
              const outerRing = coordinates[0][0];
              if (outerRing && Array.isArray(outerRing)) {
                outerRing.forEach(coord => {
                  if (coord && coord.length >= 2) {
                    bounds.extend([coord[1], coord[0]]);
                  }
                });
              }
            }
          }
        });
        
        console.log('Calculated bounds:', bounds.isValid() ? bounds.toString() : 'Invalid bounds');
        
        if (bounds.isValid()) {
          console.log('Fitting map to calculated bounds...');
          map.fitBounds(bounds, {
            padding: isMobile ? [10, 10] : [20, 20],
            maxZoom: isMobile ? 12 : 14
          });
        } else {
          console.log('Bounds invalid, using province bounds');
          const provinceBounds = L.latLngBounds(currentProvince.bounds);
          map.fitBounds(provinceBounds, {
            padding: isMobile ? [10, 10] : [20, 20],
            maxZoom: isMobile ? 12 : 14
          });
        }

        updateLegend();
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
      });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        hdsLayerRef.current = null;
        legendRef.current = null;
      }
    };
  }, [selectedProvince, isMobile]); // REMOVED supplyData from dependencies to prevent re-initialization

  // Update filters when they change - UNCHANGED
  useEffect(() => {
    if (!mapRef.current || !hdsLayerRef.current) return;

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

  // Update colors and selected grid styling - REMOVED BLACK BORDER
  useEffect(() => {
    if (!mapRef.current || !hdsLayerRef.current) return;

    hdsLayerRef.current.eachLayer((layer) => {
      layer.setStyle({
        fillColor: getColor(layer.feature),
        weight: 1, // Thin border always
        opacity: 0.3, // Low opacity border
        color: '#666666', // Gray border - NO BLACK BORDER
        fillOpacity: 0.8
      });
    });

    updateLegend();
  }, [colorScheme, selectedGrid]);

  return <div id="hds-map" style={{ height: '100%', width: '100%' }}></div>;
};

export default HDSMap;
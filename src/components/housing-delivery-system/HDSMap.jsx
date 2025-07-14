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

  // Province configurations - UNCHANGED
  const provinceConfigs = {
    40: {
      name: 'ขอนแก่น',
      center: [16.4322, 102.8236],
      bounds: [[15.5, 101.8], [17.5, 103.8]],
      file: '/data/HDS_KKN01.geojson'
    },
    50: {
      name: 'เชียงใหม่',
      center: [18.7883, 98.9853],
      bounds: [[17.8, 97.9], [19.8, 99.9]],
      file: '/data/HDS_CNX_02GJSON.geojson'
    },
    90: {
      name: 'สงขลา',
      center: [7.0063, 100.4665],
      bounds: [[6.0, 99.5], [8.0, 101.5]],
      file: '/data/HDS_HYT.geojson'
    }
  };

  const currentProvince = provinceConfigs[selectedProvince] || provinceConfigs[40];

  // Color schemes - UNCHANGED
  const colorSchemes = {
    housingSystem: {
      name: 'Housing System Dominance',
      colors: [
        { min: 1, max: 1, color: '#d73027', label: 'C1: ระบบชุมชนบุกรุก' },
        { min: 2, max: 2, color: '#f46d43', label: 'C2: ระบบถือครองชั่วคราว' },
        { min: 3, max: 3, color: '#fdae61', label: 'C3: ระบบกลุ่มประชากรแฝง' },
        { min: 4, max: 4, color: '#fee08b', label: 'C4: ระบบที่อยู่อาศัยลูกจ้าง' },
        { min: 5, max: 5, color: '#e6f598', label: 'C5: ระบบที่อยู่อาศัยรัฐ' },
        { min: 6, max: 6, color: '#abdda4', label: 'C6: ระบบที่อยู่อาศัยรัฐสนับสนุน' },
        { min: 7, max: 7, color: '#66c2a5', label: 'C7: ระบบที่อยู่อาศัยเอกชน' }
      ]
    },
    population: {
      name: 'Population Density',
      colors: [
        { min: 0, max: 100, color: '#ffffcc', label: '0-100 คน' },
        { min: 101, max: 500, color: '#c7e9b4', label: '101-500 คน' },
        { min: 501, max: 1000, color: '#7fcdbb', label: '501-1,000 คน' },
        { min: 1001, max: 2000, color: '#41b6c4', label: '1,001-2,000 คน' },
        { min: 2001, max: 5000, color: '#2c7fb8', label: '2,001-5,000 คน' },
        { min: 5001, max: Infinity, color: '#253494', label: '5,001+ คน' }
      ]
    },
    problems: {
      name: 'Problem Areas',
      colors: [
        { min: 0, max: 0, color: '#d9f0a3', label: 'No Problems' },
        { min: 1, max: 1, color: '#addd8e', label: 'One Problem' },
        { min: 2, max: 2, color: '#78c679', label: 'Two Problems' },
        { min: 3, max: 3, color: '#31a354', label: 'Three Problems' }
      ]
    }
  };

  // Housing system names - UNCHANGED
  const housingSystemNames = {
    1: 'ระบบชุมชนบุกรุก',
    2: 'ระบบถือครองชั่วคราว',
    3: 'ระบบกลุ่มประชากรแฝง',
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
    if (gridSupplyData) {
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
              ${Object.entries(housingTypes).slice(0, 5).map(([type, data]) => `
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600 truncate" style="max-width: 120px;" title="${type}">${type}</span>
                  <span class="font-medium text-gray-800">${data.supplyCount}</span>
                </div>
              `).join('')}
              ${Object.keys(housingTypes).length > 5 ? `
                <div class="text-xs text-gray-500 italic">และอีก ${Object.keys(housingTypes).length - 5} ประเภท...</div>
              ` : ''}
            </div>
          </div>
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

  // Get color function - UNCHANGED
  const getColor = (feature) => {
    const props = feature.properties;
    
    if (colorScheme === 'housingSystem') {
      const hdsNumbers = [
        { code: 1, count: props.HDS_C1_num || 0 },
        { code: 2, count: props.HDS_C2_num || 0 },
        { code: 3, count: props.HDS_C3_num || 0 },
        { code: 4, count: props.HDS_C4_num || 0 },
        { code: 5, count: props.HDS_C5_num || 0 },
        { code: 6, count: props.HDS_C6_num || 0 },
        { code: 7, count: props.HDS_C7_num || 0 }
      ];
      
      const dominantSystem = hdsNumbers.reduce((max, item) => item.count > max.count ? item : max);
      
      if (dominantSystem.count > 0) {
        const colorSchemeItem = colorSchemes.housingSystem.colors.find(c => c.min === dominantSystem.code);
        return colorSchemeItem ? colorSchemeItem.color : '#cccccc';
      }
      return '#cccccc';
    } 
    else if (colorScheme === 'population') {
      const population = props.Grid_POP || 0;
      const colorRange = colorSchemes.population.colors.find(c => population >= c.min && population <= c.max);
      return colorRange ? colorRange.color : '#cccccc';
    }
    else if (colorScheme === 'problems') {
      let problemCount = 0;
      if (props.Supply_Pro) problemCount++;
      if (props.Subsidies_) problemCount++;
      if (props.Stability_) problemCount++;
      
      const colorRange = colorSchemes.problems.colors.find(c => problemCount >= c.min && problemCount <= c.max);
      return colorRange ? colorRange.color : '#cccccc';
    }
    
    return '#cccccc';
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

  // Update colors and selected grid styling - UNCHANGED
  useEffect(() => {
    if (!mapRef.current || !hdsLayerRef.current) return;

    hdsLayerRef.current.eachLayer((layer) => {
      const isSelected = selectedGrid && 
        (layer.feature.properties.FID === selectedGrid.properties.FID ||
         layer.feature.properties.OBJECTID_1 === selectedGrid.properties.OBJECTID_1 ||
         layer.feature.properties.Grid_Code === selectedGrid.properties.Grid_Code ||
         layer.feature.properties.Grid_CODE === selectedGrid.properties.Grid_CODE);

      layer.setStyle({
        fillColor: getColor(layer.feature),
        weight: isSelected ? 3 : 1,
        opacity: isSelected ? 1 : 0.3,
        color: isSelected ? '#000000' : '#666666',
        fillOpacity: isSelected ? 1 : 0.8
      });
    });

    updateLegend();
  }, [colorScheme, selectedGrid]);

  return <div id="hds-map" style={{ height: '100%', width: '100%' }}></div>;
};

export default HDSMap;
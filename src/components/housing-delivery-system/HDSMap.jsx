import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const HDSMap = ({ 
  filters, 
  colorScheme, 
  isMobile, 
  onGridSelect, 
  selectedGrid, 
  selectedProvince 
}) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const hdsLayerRef = useRef(null);
  const legendRef = useRef(null);

  // Province bounds configuration
  const provinceBounds = {
    40: [[15.2, 101.5], [17.5, 104.0]], // ขอนแก่น
    50: [[18.0, 97.5], [20.5, 100.5]], // เชียงใหม่
    90: [[6.5, 100.0], [7.5, 101.0]]   // สงขลา
  };

  // Get current province info
  const getCurrentProvince = () => {
    const provinces = [
      { id: 40, name: 'ขอนแก่น', file: '/data/HDS_KKN01.geojson', bounds: provinceBounds[40] },
      { id: 50, name: 'เชียงใหม่', file: '/data/HDS_CNX_02GJSON.geojson', bounds: provinceBounds[50] },
      { id: 90, name: 'สงขลา', file: '/data/HDS_HYT.geojson', bounds: provinceBounds[90] }
    ];
    return provinces.find(p => p.id === selectedProvince) || provinces[0];
  };

  // Calculate map height based on screen size - optimized for full-size layout
  const getMapHeight = () => {
    if (isMobile) return "60vh";
    return "100%"; // Full height for desktop full-size layout
  };

  // Color functions for different schemes
  const getColor = (feature) => {
    const props = feature.properties;
    
    switch (colorScheme) {
      case 'housingSystem':
        // Find the dominant housing system
        let maxSystem = 0;
        let maxValue = 0;
        for (let i = 1; i <= 7; i++) {
          const value = props[`HDS_C${i}_num`] || 0;
          if (value > maxValue) {
            maxValue = value;
            maxSystem = i;
          }
        }
        const systemColors = {
          1: '#e31a1c', 2: '#ff7f00', 3: '#1f78b4', 4: '#33a02c',
          5: '#6a3d9a', 6: '#b15928', 7: '#a6cee3'
        };
        return systemColors[maxSystem] || '#f0f0f0';
        
      case 'populationDensity':
        const population = props.Grid_POP || 0;
        if (population > 5000) return '#800026';
        if (population > 3000) return '#BD0026';
        if (population > 2000) return '#E31A1C';
        if (population > 1000) return '#FC4E2A';
        if (population > 500) return '#FD8D3C';
        if (population > 200) return '#FEB24C';
        if (population > 100) return '#FED976';
        return '#FFEDA0';
        
      case 'housingDensity':
        const housing = props.Grid_HOU || 0;
        if (housing > 2000) return '#800026';
        if (housing > 1500) return '#BD0026';
        if (housing > 1000) return '#E31A1C';
        if (housing > 500) return '#FC4E2A';
        if (housing > 200) return '#FD8D3C';
        if (housing > 100) return '#FEB24C';
        if (housing > 50) return '#FED976';
        return '#FFEDA0';
        
      case 'gridClass':
        const gridClass = props.Grid_Class || 0;
        const classColors = {
          1: '#ffffcc', 2: '#c7e9b4', 3: '#7fcdbb',
          4: '#41b6c4', 5: '#2c7fb8', 6: '#253494'
        };
        return classColors[gridClass] || '#f0f0f0';
        
      default:
        return '#f0f0f0';
    }
  };

  // Generate legend items based on color scheme
  const getLegendItems = () => {
    switch (colorScheme) {
      case 'housingSystem':
        return [
          { color: '#e31a1c', label: 'ระบบ 1: ชุมชนแออัด' },
          { color: '#ff7f00', label: 'ระบบ 2: ที่ดินชั่วคราว' },
          { color: '#1f78b4', label: 'ระบบ 3: ประชากรแฝง' },
          { color: '#33a02c', label: 'ระบบ 4: ที่อยู่ลูกจ้าง' },
          { color: '#6a3d9a', label: 'ระบบ 5: รัฐจัดสร้าง' },
          { color: '#b15928', label: 'ระบบ 6: เอกชนจัดสร้าง' },
          { color: '#a6cee3', label: 'ระบบ 7: อื่นๆ' }
        ];
      case 'populationDensity':
        return [
          { color: '#800026', label: '> 5,000 คน' },
          { color: '#BD0026', label: '3,001-5,000 คน' },
          { color: '#E31A1C', label: '2,001-3,000 คน' },
          { color: '#FC4E2A', label: '1,001-2,000 คน' },
          { color: '#FD8D3C', label: '501-1,000 คน' },
          { color: '#FEB24C', label: '201-500 คน' },
          { color: '#FED976', label: '101-200 คน' },
          { color: '#FFEDA0', label: '≤ 100 คน' }
        ];
      case 'housingDensity':
        return [
          { color: '#800026', label: '> 2,000 หน่วย' },
          { color: '#BD0026', label: '1,501-2,000 หน่วย' },
          { color: '#E31A1C', label: '1,001-1,500 หน่วย' },
          { color: '#FC4E2A', label: '501-1,000 หน่วย' },
          { color: '#FD8D3C', label: '201-500 หน่วย' },
          { color: '#FEB24C', label: '101-200 หน่วย' },
          { color: '#FED976', label: '51-100 หน่วย' },
          { color: '#FFEDA0', label: '≤ 50 หน่วย' }
        ];
      case 'gridClass':
        return [
          { color: '#253494', label: 'ระดับ 6: สูงที่สุด' },
          { color: '#2c7fb8', label: 'ระดับ 5: สูงมาก' },
          { color: '#41b6c4', label: 'ระดับ 4: สูง' },
          { color: '#7fcdbb', label: 'ระดับ 3: ปานกลาง' },
          { color: '#c7e9b4', label: 'ระดับ 2: ต่ำ' },
          { color: '#ffffcc', label: 'ระดับ 1: ต่ำที่สุด' }
        ];
      default:
        return [];
    }
  };

  // Generate popup content
  const generatePopupContent = (feature, scheme) => {
    const props = feature.properties;
    const gridId = props.FID || props.OBJECTID_1 || props.Grid_Code || props.Grid_CODE || 'N/A';
    const gridPop = props.Grid_POP || 0;
    const gridHou = props.Grid_HOU || 0;
    const gridClass = props.Grid_Class || 0;

    let content = `
      <div class="p-3 min-w-[280px]">
        <h4 class="font-bold text-lg mb-2 text-gray-800">Grid ${gridId}</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">ประชากร:</span>
            <span class="font-medium">${Math.round(gridPop).toLocaleString()} คน</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">ที่อยู่อาศัย:</span>
            <span class="font-medium">${gridHou.toLocaleString()} หน่วย</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">ระดับความหนาแน่น:</span>
            <span class="font-medium">ระดับ ${gridClass}</span>
          </div>
        </div>
    `;

    if (scheme === 'housingSystem') {
      content += `<div class="mt-3 pt-2 border-t border-gray-200">
        <h5 class="font-medium text-sm mb-1 text-gray-700">ระบบที่อยู่อาศัย:</h5>
        <div class="grid grid-cols-2 gap-1 text-xs">`;
      
      for (let i = 1; i <= 7; i++) {
        const value = props[`HDS_C${i}_num`] || 0;
        if (value > 0) {
          content += `<div class="flex justify-between">
            <span>C${i}:</span>
            <span class="font-medium">${value.toLocaleString()}</span>
          </div>`;
        }
      }
      content += `</div></div>`;
    }

    content += `</div>`;
    return content;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
    }

    // Create new map with optimized settings for full-size layout
    const map = L.map(mapContainerRef.current, {
      center: [15.87, 100.99],
      zoom: isMobile ? 8 : 10,
      zoomControl: !isMobile, // Hide zoom controls on mobile to save space
      attributionControl: false, // We'll add custom attribution
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: isMobile,
      doubleClickZoom: true,
      boxZoom: !isMobile,
      keyboard: !isMobile,
      // Optimize for full-size layout
      preferCanvas: true,
      renderer: L.canvas({
        padding: 0.5,
        tolerance: 5
      })
    });

    mapRef.current = map;

    // Add tile layer with optimized settings
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      minZoom: 6,
      // Optimize loading for full-size layout
      keepBuffer: 4,
      updateWhenIdle: true,
      updateWhenZooming: false
    }).addTo(map);

    // Add legend with optimized positioning for full-size layout
    const legend = L.control({ position: isMobile ? 'bottomright' : 'topright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'legend');
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: ${isMobile ? '10px' : '12px'};
        line-height: 1.4;
        max-width: ${isMobile ? '150px' : '200px'};
        border: 1px solid rgba(0,0,0,0.1);
      `;
      return div;
    };
    legend.addTo(map);
    legendRef.current = legend;

    // Load and display HDS data
    const currentProvince = getCurrentProvince();
    fetch(currentProvince.file)
      .then(response => response.json())
      .then(data => {
        // Create the HDS layer with optimized styling
        const hdsLayer = L.geoJSON(data, {
          style: (feature) => ({
            fillColor: getColor(feature),
            weight: 1,
            opacity: 0.4,
            color: '#666666',
            fillOpacity: 0.8,
            // Add smooth transitions
            className: 'hds-feature'
          }),
          onEachFeature: (feature, layer) => {
            // Click handler
            layer.on('click', (e) => {
              // Clear existing selection styling
              if (hdsLayerRef.current) {
                hdsLayerRef.current.eachLayer((l) => {
                  l.setStyle({
                    weight: 1,
                    opacity: 0.4,
                    color: '#666666'
                  });
                });
              }

              // Highlight selected feature
              layer.setStyle({
                weight: 3,
                opacity: 1,
                color: '#000000'
              });

              // Update selected grid
              const clickedFeature = e.target.feature;
              if (onGridSelect) {
                onGridSelect(clickedFeature.properties);
              }

              // Show popup based on device type
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

            // Hover effects for desktop only (better performance on full-size layout)
            if (!isMobile) {
              layer.on('mouseover', function(e) {
                const layer = e.target;
                layer.setStyle({
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.9
                });
              });

              layer.on('mouseout', function(e) {
                const layer = e.target;
                // Reset to default or selected style
                if (selectedGrid && selectedGrid.FID === feature.properties.FID) {
                  layer.setStyle({
                    weight: 3,
                    opacity: 1,
                    color: '#000000',
                    fillOpacity: 0.8
                  });
                } else {
                  layer.setStyle({
                    weight: 1,
                    opacity: 0.4,
                    color: '#666666',
                    fillOpacity: 0.8
                  });
                }
              });
            }
          }
        });

        hdsLayer.addTo(map);
        hdsLayerRef.current = hdsLayer;

        // Fit map to data bounds with optimized padding for full-size layout
        const bounds = hdsLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: isMobile ? [10, 10] : [30, 30], // More padding for full-size layout
            maxZoom: isMobile ? 12 : 14
          });
        } else {
          console.log('Bounds invalid, using province bounds');
          const provinceBounds = L.latLngBounds(currentProvince.bounds);
          map.fitBounds(provinceBounds, {
            padding: isMobile ? [10, 10] : [30, 30],
            maxZoom: isMobile ? 12 : 14
          });
        }

        // Update legend initially
        updateLegend();
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
      });

    // Add custom CSS for better styling
    const style = document.createElement('style');
    style.textContent = `
      .hds-feature {
        transition: all 0.3s ease;
      }
      .hds-popup .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .hds-popup .leaflet-popup-tip {
        background: white;
      }
      .mobile-popup .leaflet-popup-content-wrapper {
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
      }
      .leaflet-container {
        font-family: system-ui, -apple-system, sans-serif;
      }
      .leaflet-control-zoom {
        border: none;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .leaflet-control-zoom a {
        border-radius: 4px;
        border: none;
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Clean up map when component unmounts or province changes
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        hdsLayerRef.current = null;
        legendRef.current = null;
      }
      // Clean up style
      if (style.parentNode) {
        style.parentNode.removeChild(style);
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

      // Show/hide layer based on filter with smooth transitions
      if (shouldShow) {
        if (!mapRef.current.hasLayer(layer)) {
          layer.addTo(mapRef.current);
        }
        layer.setStyle({ fillOpacity: 0.8 });
      } else {
        if (mapRef.current.hasLayer(layer)) {
          layer.setStyle({ fillOpacity: 0.1 });
        }
      }
    });
  }, [filters]);

  // Update colors and selected grid styling when color scheme or selected grid changes
  useEffect(() => {
    if (!mapRef.current || !hdsLayerRef.current) return;

    // Re-style all layers
    hdsLayerRef.current.eachLayer((layer) => {
      const isSelected = selectedGrid && 
        (selectedGrid.FID === layer.feature.properties.FID ||
         selectedGrid.OBJECTID_1 === layer.feature.properties.OBJECTID_1 ||
         selectedGrid.Grid_Code === layer.feature.properties.Grid_Code ||
         selectedGrid.Grid_CODE === layer.feature.properties.Grid_CODE);

      layer.setStyle({
        fillColor: getColor(layer.feature),
        weight: isSelected ? 3 : 1,
        opacity: isSelected ? 1 : 0.4,
        color: isSelected ? '#000000' : '#666666',
        fillOpacity: 0.8
      });
    });

    updateLegend();
  }, [colorScheme, selectedGrid]);

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
    
    // Optimized styling for full-size layout
    const fontSize = isMobile ? '9px' : '11px';
    const marginBottom = isMobile ? '2px' : '4px';
    const colorBoxSize = isMobile ? '12px' : '16px';
    
    legendRef.current.getContainer().innerHTML = `
      <h4 style="margin: 0 0 8px 0; font-weight: 600; font-size: ${isMobile ? '10px' : '12px'}; color: #374151;">${title}</h4>
      ${items.map(item => `
        <div style="display: flex; align-items: center; margin-bottom: ${marginBottom};">
          <span style="
            display: inline-block; 
            width: ${colorBoxSize}; 
            height: ${colorBoxSize}; 
            margin-right: 8px; 
            background: ${item.color}; 
            border: 1px solid rgba(0,0,0,0.2);
            border-radius: 2px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          "></span>
          <span style="font-size: ${fontSize}; line-height: 1.3; color: #374151;">${item.label}</span>
        </div>
      `).join('')}
    `;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden relative" style={{ height: getMapHeight() }}>
      <div 
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ 
          minHeight: "400px"
        }}
      />
      {/* Custom attribution for full-size layout */}
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 backdrop-blur-sm px-2 py-1 text-xs text-gray-600 rounded shadow-sm">
        © OpenStreetMap contributors
      </div>
    </div>
  );
};

export default HDSMap;
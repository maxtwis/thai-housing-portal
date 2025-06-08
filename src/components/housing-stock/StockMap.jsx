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

const StockMap = ({ filters, colorScheme = 'buildingType', isMobile }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const buildingLayerRef = useRef(null);
  const legendRef = useRef(null);

  // Dynamic height calculation based on viewport
  const getMapHeight = () => {
    if (isMobile) {
      return "60vh";
    } else {
      return "calc(100vh - 150px)";
    }
  };

  const generatePopupContent = (feature, colorScheme) => {
    return `
      <div class="p-3 min-w-[240px]">
        <div class="bg-gray-50 -m-3 p-3 mb-3 border-b">
          <h3 class="font-bold text-gray-800">
            ${feature.HOUSENUMBER ? `เลขที่ ${feature.HOUSENUMBER}` : 'ไม่มีข้อมูลเลขที่อาคาร'}
          </h3>
          <p class="text-sm text-gray-600 mt-1">
            ${feature.TP_build || 'ไม่มีข้อมูลประเภทอาคาร'}
          </p>
        </div>
        
        <div class="space-y-2">
          <div class="flex justify-between items-baseline text-sm">
            <span class="text-gray-600">จำนวนชั้น</span>
            <span class="font-medium text-gray-800">${feature.STOREY ? `${feature.STOREY} ชั้น` : '-'}</span>
          </div>

          ${feature.TP_build === 'ที่อยู่อาศัย' ? `
            <div class="flex justify-between items-baseline text-sm">
              <span class="text-gray-600">พื้นที่</span>
              <span class="font-medium text-gray-800">${feature.AREA ? `${feature.AREA.toFixed(1)} ตร.ม.` : '-'}</span>
            </div>

            <div class="flex justify-between items-baseline text-sm">
              <span class="text-gray-600">จำนวนสมาชิก</span>
              <span class="font-medium text-gray-800">${feature.Household_member_total ? `${feature.Household_member_total} คน` : '-'}</span>
            </div>

            <div class="flex justify-between items-baseline text-sm">
              <span class="text-gray-600">ค่าเช่า</span>
              <span class="font-medium text-gray-800">
                ${feature.House_rentcost ? `฿${feature.House_rentcost.toLocaleString()}/เดือน` : '-'}
              </span>
            </div>

            ${colorScheme === 'transportAccess' || colorScheme === 'healthAccess' ? `
              <div class="border-t border-gray-200 mt-3 pt-3">
                ${colorScheme === 'transportAccess' ? `
                  <div class="flex justify-between items-baseline text-sm">
                    <span class="text-gray-600">ระยะทางถึงระบบขนส่ง</span>
                    <span class="font-medium text-gray-800">
                      ${Math.min(
                        feature.Facility_transportation || 999,
                        feature.Facility_metro || 999,
                        feature.Facility_busstop || 999
                      ).toFixed(2)} กม.
                    </span>
                  </div>
                ` : ''}

                ${colorScheme === 'healthAccess' ? `
                  <div class="flex justify-between items-baseline text-sm">
                    <span class="text-gray-600">ระยะทางถึงสถานพยาบาล</span>
                    <span class="font-medium text-gray-800">
                      ${Math.min(
                        feature.Facility_hospital || 999,
                        feature.Facility_healthcenter || 999,
                        feature.Facility_pharmarcy || 999
                      ).toFixed(2)} กม.
                    </span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          ` : ''}
        </div>
      </div>
    `;
  };

  // Color schemes for different attributes
  const getColor = (feature) => {
    const schemes = {
      buildingType: () => {
        const buildingType = feature.TP_build || '';
        const colorMap = {
          'ที่อยู่อาศัย': '#ff7f0e',
          'พาณิชยกรรม': '#1f77b4',
          'ที่อยู่อาศัยกึ่งพาณิชยกรรม': '#2ca02c',
          'อุตสาหกรรม': '#d62728',
          'สาธารณูปโภค สาธารณูปการ': '#9467bd',
          'สถาบันการศึกษา': '#8c564b',
          'สถาบันศาสนา': '#e377c2',
          'สถาบันราชการและการสาธารณสุข': '#7f7f7f',
          'นันทนาการ': '#bcbd22'
        };
        return colorMap[buildingType] || '#808080';
      },
      transportAccess: () => {
        if (feature.TP_build !== 'ที่อยู่อาศัย') return '#808080';
        const distance = Math.min(
          feature.Facility_transportation || 999,
          feature.Facility_metro || 999,
          feature.Facility_busstop || 999
        );
        if (distance <= 0.5) return '#fef0d9';
        if (distance <= 1) return '#fdbb84';
        if (distance <= 1.5) return '#fc8d59';
        if (distance <= 2) return '#ef6548';
        return '#67000d';
      },
      healthAccess: () => {
        if (feature.TP_build !== 'ที่อยู่อาศัย') return '#808080';
        const distance = Math.min(
          feature.Facility_hospital || 999,
          feature.Facility_healthcenter || 999,
          feature.Facility_pharmarcy || 999
        );
        if (distance <= 1) return '#fef0d9';
        if (distance <= 2) return '#fdbb84';
        if (distance <= 3) return '#fc8d59';
        if (distance <= 4) return '#ef6548';
        return '#67000d';
      },
      householdSize: () => {
        if (feature.TP_build !== 'ที่อยู่อาศัย') return '#808080';
        const size = feature.Household_member_total || 0;
        if (size <= 1) return '#f7fbff';
        if (size <= 2) return '#deebf7';
        if (size <= 3) return '#c6dbef';
        if (size <= 4) return '#9ecae1';
        if (size <= 5) return '#6baed6';
        if (size <= 6) return '#4292c6';
        if (size <= 7) return '#2171b5';
        return '#084594';
      },
      rentCost: () => {
        if (feature.TP_build !== 'ที่อยู่อาศัย') return '#808080';
        const cost = feature.House_rentcost || 0;
        if (cost < 5000) return '#ffffd4';
        if (cost < 10000) return '#fee391';
        if (cost < 15000) return '#fec44f';
        if (cost < 20000) return '#fe9929';
        if (cost < 25000) return '#ec7014';
        if (cost < 30000) return '#cc4c02';
        return '#8c2d04';
      }
    };
    
    return schemes[colorScheme] ? schemes[colorScheme]() : schemes.buildingType();
  };

  // Legend items for each color scheme
  const getLegendItems = () => {
    const items = {
      buildingType: [
        { color: '#ff7f0e', label: 'ที่อยู่อาศัย' },
        { color: '#1f77b4', label: 'พาณิชยกรรม' },
        { color: '#2ca02c', label: 'ที่อยู่อาศัยกึ่งพาณิชยกรรม' },
        { color: '#d62728', label: 'อุตสาหกรรม' },
        { color: '#9467bd', label: 'สาธารณูปโภค สาธารณูปการ' },
        { color: '#8c564b', label: 'สถาบันการศึกษา' },
        { color: '#e377c2', label: 'สถาบันศาสนา' },
        { color: '#7f7f7f', label: 'สถาบันราชการและการสาธารณสุข' },
        { color: '#bcbd22', label: 'นันทนาการ' },
        { color: '#808080', label: 'ไม่มีข้อมูล' }
      ],
      transportAccess: [
        { color: '#fef0d9', label: '< 250m (ที่อยู่อาศัย)' },
        { color: '#fdbb84', label: '250-500m (ที่อยู่อาศัย)' },
        { color: '#fc8d59', label: '500m-1km (ที่อยู่อาศัย)' },
        { color: '#ef6548', label: '1-2km (ที่อยู่อาศัย)' },
        { color: '#67000d', label: '> 2km (ที่อยู่อาศัย)' },
        { color: '#808080', label: 'อาคารประเภทอื่นๆ' }
      ],
      healthAccess: [
        { color: '#fef0d9', label: '< 1km (ที่อยู่อาศัย)' },
        { color: '#fdbb84', label: '1-2km (ที่อยู่อาศัย)' },
        { color: '#fc8d59', label: '2-3km (ที่อยู่อาศัย)' },
        { color: '#ef6548', label: '3-4km (ที่อยู่อาศัย)' },
        { color: '#67000d', label: '> 4km (ที่อยู่อาศัย)' },
        { color: '#808080', label: 'อาคารประเภทอื่นๆ' }
      ],
      householdSize: [
        { color: '#f7fbff', label: '1 คน (ที่อยู่อาศัย)' },
        { color: '#deebf7', label: '2 คน (ที่อยู่อาศัย)' },
        { color: '#c6dbef', label: '3 คน (ที่อยู่อาศัย)' },
        { color: '#9ecae1', label: '4 คน (ที่อยู่อาศัย)' },
        { color: '#6baed6', label: '5 คน (ที่อยู่อาศัย)' },
        { color: '#4292c6', label: '6 คน (ที่อยู่อาศัย)' },
        { color: '#2171b5', label: '7 คน (ที่อยู่อาศัย)' },
        { color: '#084594', label: '8+ คน (ที่อยู่อาศัย)' },
        { color: '#808080', label: 'อาคารประเภทอื่นๆ' }
      ],
      rentCost: [
        { color: '#ffffd4', label: '< ฿5,000 (ที่อยู่อาศัย)' },
        { color: '#fee391', label: '฿5,000-10,000 (ที่อยู่อาศัย)' },
        { color: '#fec44f', label: '฿10,000-15,000 (ที่อยู่อาศัย)' },
        { color: '#fe9929', label: '฿15,000-20,000 (ที่อยู่อาศัย)' },
        { color: '#ec7014', label: '฿20,000-25,000 (ที่อยู่อาศัย)' },
        { color: '#cc4c02', label: '฿25,000-30,000 (ที่อยู่อาศัย)' },
        { color: '#8c2d04', label: '> ฿30,000 (ที่อยู่อาศัย)' },
        { color: '#808080', label: 'อาคารประเภทอื่นๆ' }
      ]
    };
    return items[colorScheme] || items.buildingType;
  };

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [13.6688, 100.6147], 
      zoom: 12,
      maxZoom: 18,
      minZoom: 10,
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
    const legend = L.control({ position: isMobile ? 'bottomleft' : 'bottomright' });
    
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend');
      
      if (isMobile) {
        div.style.cssText = 'background: white; padding: 8px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); font-size: 10px; max-height: 100px; overflow-y: auto; max-width: 280px;';
      } else {
        div.style.cssText = 'background: white; padding: 10px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); font-size: 12px; max-height: 400px; overflow-y: auto;';
      }
      
      return div;
    };
    
    legend.addTo(map);
    legendRef.current = legend;

    // Load GeoJSON data
    fetch('/data/bldg_pkn.geojson')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load GeoJSON data');
        return response.json();
      })
      .then(geojsonData => {
        // Style function for buildings
        const style = (feature) => ({
          fillColor: getColor(feature.properties),
          weight: 0.3,
          opacity: 0.4,
          color: '#666666',
          fillOpacity: 0.6
        });

        // Add building layer
        const buildingLayer = L.geoJSON(geojsonData, {
          style: style,
          onEachFeature: (feature, layer) => {
            // Add popup on click (for all devices)
            layer.on('click', (e) => {
              const popup = L.popup({
                maxWidth: isMobile ? 300 : 400,
                className: 'building-popup'
              })
                .setLatLng(e.latlng)
                .setContent(generatePopupContent(feature.properties, colorScheme))
                .openOn(map);
            });

            // Add hover effect for desktop
            if (!isMobile) {
              layer.on('mouseover', (e) => {
                layer.setStyle({
                  weight: 2,
                  color: '#666',
                  fillOpacity: 0.8
                });
              });

              layer.on('mouseout', (e) => {
                buildingLayer.resetStyle(layer);
              });
            }
          }
        }).addTo(map);

        buildingLayerRef.current = buildingLayer;

        // Fit map to data bounds
        map.fitBounds(buildingLayer.getBounds(), {
          padding: isMobile ? [20, 20] : [50, 50],
          maxZoom: isMobile ? 14 : 16
        });

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
  }, [isMobile]);

  // Update filters when they change
  useEffect(() => {
    if (!mapRef.current || !buildingLayerRef.current) return;

    // Filter the layer based on current filters
    buildingLayerRef.current.eachLayer((layer) => {
      const feature = layer.feature.properties;
      let shouldShow = true;
      
      if (filters.buildingType !== 'all') {
        shouldShow = shouldShow && (feature.TP_build === filters.buildingType);
      }
      
      if (filters.stories !== 'all') {
        const [min, max] = filters.stories.split('-').map(Number);
        const stories = feature.STOREY || 0;
        shouldShow = shouldShow && (stories >= min && stories <= max);
      }
      
      if (filters.rentRange !== 'all') {
        const [min, max] = filters.rentRange.split('-').map(Number);
        const rent = feature.House_rentcost || 0;
        shouldShow = shouldShow && (rent >= min && rent <= max);
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

  // Update colors when color scheme changes
  useEffect(() => {
    if (!mapRef.current || !buildingLayerRef.current) return;

    // Re-style all layers
    buildingLayerRef.current.eachLayer((layer) => {
      layer.setStyle({
        fillColor: getColor(layer.feature.properties),
        weight: 0.3,
        opacity: 0.4,
        color: '#666666',
        fillOpacity: 0.6
      });
    });

    updateLegend();
  }, [colorScheme]);

  // Update legend content
  const updateLegend = () => {
    if (!legendRef.current || !legendRef.current.getContainer()) return;

    const items = getLegendItems();
    const title = {
      buildingType: 'ประเภทอาคาร',
      transportAccess: 'การเข้าถึงระบบขนส่ง',
      healthAccess: 'การเข้าถึงสถานพยาบาล',
      householdSize: 'ขนาดครัวเรือน',
      rentCost: 'ค่าเช่า'
    }[colorScheme] || 'คำอธิบายสัญลักษณ์';
    
    // Different styling for mobile vs desktop
    const fontSize = isMobile ? '10px' : '12px';
    const marginBottom = isMobile ? '2px' : '4px';
    const colorBoxSize = isMobile ? '12px' : '16px';
    
    legendRef.current.getContainer().innerHTML = `
      <h4 style="margin: 0 0 8px 0; font-weight: 600; font-size: ${fontSize};">${title}</h4>
      ${items.map(item => `
        <div style="display: flex; align-items: center; margin-bottom: ${marginBottom};">
          <span style="display: inline-block; width: ${colorBoxSize}; height: ${colorBoxSize}; margin-right: 8px; background: ${item.color}; border: 1px solid rgba(0,0,0,0.2);"></span>
          <span style="font-size: ${fontSize};">${item.label}</span>
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

export default StockMap;
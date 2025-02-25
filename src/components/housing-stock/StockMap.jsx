import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibmFwYXR0cnMiLCJhIjoiY203YnFwdmp1MDU0dTJrb3Fvbmhld2Z1cCJ9.rr4TE2vg3iIcpNqv9I2n5Q';

const StockMap = ({ filters, colorScheme = 'buildingType', isMobile }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const legendRef = useRef(null);

  // Dynamic height calculation based on viewport
  const getMapHeight = () => {
    if (isMobile) {
      return "60vh"; // Mobile height
    } else {
      // Desktop: Much taller map
      return "calc(100vh - 150px)"; // Adjust this value as needed
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
  const getColorExpression = () => {
    const schemes = {
      buildingType: [
        'match',
        ['coalesce', ['get', 'TP_build'], ''],
        'ที่อยู่อาศัย', '#ff7f0e',
        'พาณิชยกรรม', '#1f77b4',
        'ที่อยู่อาศัยกึ่งพาณิชยกรรม', '#2ca02c',
        'อุตสาหกรรม', '#d62728',
        'สาธารณูปโภค สาธารณูปการ', '#9467bd',
        'สถาบันการศึกษา', '#8c564b',
        'สถาบันศาสนา', '#e377c2',
        'สถาบันราชการและการสาธารณสุข', '#7f7f7f',
        'นันทนาการ', '#bcbd22',
        '#808080'  // default color for blank or other values
      ],
      transportAccess: [
        'case',
        ['==', ['get', 'TP_build'], 'ที่อยู่อาศัย'],
        ['step',
          ['min', 
            ['coalesce', ['get', 'Facility_transportation'], 999],
            ['coalesce', ['get', 'Facility_metro'], 999],
            ['coalesce', ['get', 'Facility_busstop'], 999]
          ],
          '#67000d',  // >2km - very poor
          0.5, '#ef6548',  // 1-2km - poor
          1, '#fc8d59',  // 0.5-1km - moderate
          1.5, '#fdbb84',  // 0.25-0.5km - good
          2, '#fef0d9'  // <0.25km - excellent
        ],
        '#808080'  // Non-residential buildings
      ],
      healthAccess: [
        'case',
        ['==', ['get', 'TP_build'], 'ที่อยู่อาศัย'],
        ['step',
          ['min',
            ['coalesce', ['get', 'Facility_hospital'], 999],
            ['coalesce', ['get', 'Facility_healthcenter'], 999],
            ['coalesce', ['get', 'Facility_pharmarcy'], 999]
          ],
          '#67000d',  // >2km
          1, '#ef6548',
          2, '#fc8d59',
          3, '#fdbb84',
          4, '#fef0d9'
        ],
        '#808080'  // Non-residential buildings
      ],
      householdSize: [
        'case',
        ['==', ['get', 'TP_build'], 'ที่อยู่อาศัย'],
        ['step',
          ['get', 'Household_member_total'],
          '#f7fbff',  // 0-1 members
          2, '#deebf7',
          3, '#c6dbef',
          4, '#9ecae1',
          5, '#6baed6',
          6, '#4292c6',
          7, '#2171b5',
          8, '#084594'  // 8+ members
        ],
        '#808080'  // Non-residential buildings
      ],
      rentCost: [
        'case',
        ['==', ['get', 'TP_build'], 'ที่อยู่อาศัย'],
        ['step',
          ['get', 'House_rentcost'],
          '#ffffd4',  // <5000
          5000, '#fee391',
          10000, '#fec44f',
          15000, '#fe9929',
          20000, '#ec7014',
          25000, '#cc4c02',
          30000, '#8c2d04'  // >30000
        ],
        '#808080'  // Non-residential buildings
      ]
    };
    return schemes[colorScheme] || schemes.buildingType;
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

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [100.6147, 13.6688], 
      zoom: 12,
      maxZoom: 18,
      minZoom: 10
    });

    const navigationControl = new mapboxgl.NavigationControl({
      showCompass: true,
      visualizePitch: true
    });
    
    // Only add controls if we are not on mobile
    if (!isMobile) {
      map.addControl(navigationControl, 'top-right');
      
      // Add fullscreen control
      map.addControl(
        new mapboxgl.FullscreenControl(), 
        'top-right'
      );
    } else {
      // Add minimal controls for mobile
      map.addControl(
        new mapboxgl.NavigationControl({
          showCompass: false,
          visualizePitch: false
        }),
        'top-right'
      );
    }

    mapRef.current = map;
    
    // Create legend container with responsive styling
    const legend = document.createElement('div');
    legend.className = 'map-legend';
    
    // Mobile-specific styling for legend
    if (isMobile) {
      legend.style.cssText = 'position: absolute; bottom: 40px; left: 10px; right: 10px; background: white; padding: 8px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); font-size: 10px; max-height: 100px; overflow-y: auto; z-index: 1;';
    } else {
      legend.style.cssText = 'position: absolute; bottom: 30px; right: 10px; background: white; padding: 10px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); font-size: 12px; max-height: 400px; overflow-y: auto;';
    }
    
    legendRef.current = legend;
    mapContainerRef.current.appendChild(legend);

    map.on('load', async () => {
      try {
        const response = await fetch('/data/bldg_pkn.geojson');
        if (!response.ok) throw new Error('Failed to load GeoJSON data');
        const geojsonData = await response.json();

        map.addSource('buildings', {
          type: 'geojson',
          data: geojsonData
        });

        // Add building fill layer
        map.addLayer({
          id: 'building-fills',
          type: 'fill',
          source: 'buildings',
          paint: {
            'fill-color': getColorExpression(),
            'fill-opacity': 0.6
          }
        });

        // Add building outline layer
        map.addLayer({
          id: 'building-outlines',
          type: 'line',
          source: 'buildings',
          paint: {
            'line-color': '#666666',
            'line-width': 0.3,
            'line-opacity': 0.4
          }
        });

        const bounds = new mapboxgl.LngLatBounds();
        geojsonData.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            feature.geometry.coordinates[0].forEach(coord => {
              bounds.extend(coord);
            });
          }
        });
        
        map.fitBounds(bounds, {
          padding: isMobile ? 20 : 50,
          maxZoom: isMobile ? 14 : 16
        });

        // Add hover effect
        let hoveredStateId = null;

        map.on('mousemove', 'building-fills', (e) => {
          if (e.features.length > 0) {
            if (popupRef.current) {
              popupRef.current.remove();
            }
        
            if (hoveredStateId !== null) {
              map.setFeatureState(
                { source: 'buildings', id: hoveredStateId },
                { hover: false }
              );
            }
        
            hoveredStateId = e.features[0].id;
            map.setFeatureState(
              { source: 'buildings', id: hoveredStateId },
              { hover: true }
            );
        
            const popup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'building-popup',
              maxWidth: isMobile ? '300px' : '400px',
              offset: isMobile ? 5 : 15
            })
              .setLngLat(e.lngLat)
              .setHTML(generatePopupContent(e.features[0].properties, colorScheme))
              .addTo(map);
        
            popupRef.current = popup;
          }
        });

        // For mobile, add touch support
        if (isMobile) {
          map.on('click', 'building-fills', (e) => {
            if (e.features.length > 0) {
              if (popupRef.current) {
                popupRef.current.remove();
              }
              
              const popup = new mapboxgl.Popup({
                closeButton: true,
                className: 'building-popup',
                maxWidth: '300px'
              })
                .setLngLat(e.lngLat)
                .setHTML(generatePopupContent(e.features[0].properties, colorScheme))
                .addTo(map);
              
              popupRef.current = popup;
            }
          });
        }

        map.on('mouseleave', 'building-fills', () => {
          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: 'buildings', id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = null;

          if (popupRef.current && !isMobile) {
            popupRef.current.remove();
            popupRef.current = null;
          }
        });

        // Update legend initially
        updateLegend();

      } catch (error) {
        console.error('Error loading GeoJSON:', error);
      }
    });

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
      if (legendRef.current) {
        legendRef.current.remove();
      }
    };
  }, [isMobile]);

  // Update filters when they change
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.getLayer('building-fills')) return;

    let filterArray = ['all'];
    
    if (filters.buildingType !== 'all') {
      filterArray.push(['==', ['get', 'TP_build'], filters.buildingType]);
    }
    
    if (filters.stories !== 'all') {
      const [min, max] = filters.stories.split('-').map(Number);
      filterArray.push(
        ['>=', ['get', 'STOREY'], min],
        ['<=', ['get', 'STOREY'], max]
      );
    }
    
    if (filters.rentRange !== 'all') {
      const [min, max] = filters.rentRange.split('-').map(Number);
      filterArray.push(
        ['>=', ['get', 'House_rentcost'], min],
        ['<=', ['get', 'House_rentcost'], max]
      );
    }

    mapRef.current.setFilter('building-fills', filterArray);
    mapRef.current.setFilter('building-outlines', filterArray);
  }, [filters]);

  // Update colors when color scheme changes
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.getLayer('building-fills')) return;

    mapRef.current.setPaintProperty(
      'building-fills',
      'fill-color',
      getColorExpression()
    );

    updateLegend();
  }, [colorScheme]);

  // Update legend content
  const updateLegend = () => {
    if (!legendRef.current) return;

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
    
    legendRef.current.innerHTML = `
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
        © Mapbox © OpenStreetMap
      </div>
    </div>
  );
};

export default StockMap;
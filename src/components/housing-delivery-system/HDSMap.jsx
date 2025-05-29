import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibmFwYXR0cnMiLCJhIjoiY203YnFwdmp1MDU0dTJrb3Fvbmhld2Z1cCJ9.rr4TE2vg3iIcpNqv9I2n5Q';

const HDSMap = ({ filters, colorScheme = 'housingSystem', isMobile, onGridSelect, selectedGrid }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
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
      return "60vh"; // Mobile height
    } else {
      // Desktop: Much taller map
      return "calc(100vh - 150px)"; // Adjust this value as needed
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
  const getColorExpression = () => {
    const schemes = {
      housingSystem: [
        'case',
        // Find the dominant housing system for each grid
        ['>', ['get', 'HDS_C1_num'], 
         ['max', ['get', 'HDS_C2_num'], ['get', 'HDS_C3_num'], ['get', 'HDS_C4_num'], 
          ['get', 'HDS_C5_num'], ['get', 'HDS_C6_num'], ['get', 'HDS_C7_num']]], '#d62728', // Red for informal settlements
        ['>', ['get', 'HDS_C2_num'], 
         ['max', ['get', 'HDS_C3_num'], ['get', 'HDS_C4_num'], 
          ['get', 'HDS_C5_num'], ['get', 'HDS_C6_num'], ['get', 'HDS_C7_num']]], '#ff7f0e', // Orange for temporary tenure
        ['>', ['get', 'HDS_C3_num'], 
         ['max', ['get', 'HDS_C4_num'], ['get', 'HDS_C5_num'], ['get', 'HDS_C6_num'], ['get', 'HDS_C7_num']]], '#bcbd22', // Yellow-green for hidden population
        ['>', ['get', 'HDS_C4_num'], 
         ['max', ['get', 'HDS_C5_num'], ['get', 'HDS_C6_num'], ['get', 'HDS_C7_num']]], '#9467bd', // Purple for employee housing
        ['>', ['get', 'HDS_C5_num'], 
         ['max', ['get', 'HDS_C6_num'], ['get', 'HDS_C7_num']]], '#2ca02c', // Green for public housing
        ['>', ['get', 'HDS_C6_num'], ['get', 'HDS_C7_num']], '#17becf', // Cyan for supported housing
        ['>', ['get', 'HDS_C7_num'], 0], '#1f77b4', // Blue for private housing
        '#808080' // Gray for no data
      ],
      populationDensity: [
        'step',
        ['get', 'Grid_POP'],
        '#ffffcc',  // Very low density
        500, '#c7e9b4',
        1000, '#7fcdbb',
        2000, '#41b6c4',
        3000, '#2c7fb8',
        5000, '#253494'  // Very high density
      ],
      housingDensity: [
        'step',
        ['get', 'Grid_House'],
        '#fff5f0',  // Very low density
        1000, '#fee0d2',
        2000, '#fcbba1',
        5000, '#fc9272',
        10000, '#fb6a4a',
        20000, '#de2d26',
        50000, '#a50f15'  // Very high density
      ],
      gridClass: [
        'match',
        ['get', 'Grid_Class'],
        1, '#ffffcc',
        2, '#c7e9b4',
        3, '#7fcdbb',
        4, '#41b6c4',
        5, '#253494',
        '#808080'  // Default color for unknown classes
      ]
    };
    return schemes[colorScheme] || schemes.housingSystem;
  };

  // Legend items for each color scheme
  const getLegendItems = () => {
    const items = {
      housingSystem: [
        { color: '#d62728', label: 'ระบบของชุมชนแออัดบนที่ดินรัฐ/เอกชน' },
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

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [102.8359, 16.4419], // Khon Kaen coordinates
      zoom: 10,
      maxZoom: 16,
      minZoom: 8
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
      legend.style.cssText = 'position: absolute; bottom: 40px; left: 10px; right: 10px; background: white; padding: 8px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); font-size: 10px; max-height: 120px; overflow-y: auto; z-index: 1;';
    } else {
      legend.style.cssText = 'position: absolute; bottom: 30px; right: 10px; background: white; padding: 10px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); font-size: 12px; max-height: 400px; overflow-y: auto;';
    }
    
    legendRef.current = legend;
    mapContainerRef.current.appendChild(legend);

    map.on('load', async () => {
      try {
        const response = await fetch('/data/HDS_GRID_KKN_FeaturesToJSON.geojson');
        if (!response.ok) throw new Error('Failed to load GeoJSON data');
        const geojsonData = await response.json();

        console.log('Original GeoJSON data:', geojsonData.features.length, 'features');
        
        // Transform coordinates from Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
        const transformedGeoJSON = {
          ...geojsonData,
          features: geojsonData.features.map(feature => {
            if (feature.geometry && feature.geometry.coordinates) {
              const transformedCoordinates = feature.geometry.coordinates.map(ring => 
                ring.map(coord => {
                  // Convert from Web Mercator to WGS84
                  const [x, y] = coord;
                  const lng = (x / 20037508.34) * 180;
                  const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) * 360 / Math.PI) - 90;
                  return [lng, lat];
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
        console.log('Sample coordinates:', transformedGeoJSON.features[0]?.geometry?.coordinates[0]?.slice(0, 2));

        map.addSource('hds-grids', {
          type: 'geojson',
          data: transformedGeoJSON
        });

        // Add grid fill layer
        map.addLayer({
          id: 'hds-grid-fills',
          type: 'fill',
          source: 'hds-grids',
          paint: {
            'fill-color': getColorExpression(),
            'fill-opacity': 0.7
          }
        });

        // Add grid outline layer with click highlighting
        map.addLayer({
          id: 'hds-grid-outlines',
          type: 'line',
          source: 'hds-grids',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'FID'], selectedGrid?.FID || -1],
              '#ff0000', // Red for selected grid
              '#666666'  // Default color
            ],
            'line-width': [
              'case',
              ['==', ['get', 'FID'], selectedGrid?.FID || -1],
              3, // Thicker for selected grid
              0.5 // Default width
            ],
            'line-opacity': 0.8
          }
        });

        // Calculate bounds from transformed coordinates
        const bounds = new mapboxgl.LngLatBounds();
        transformedGeoJSON.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            feature.geometry.coordinates[0].forEach(coord => {
              bounds.extend(coord);
            });
          }
        });
        
        // Fit map to the data bounds
        map.fitBounds(bounds, {
          padding: isMobile ? 20 : 50,
          maxZoom: isMobile ? 14 : 16
        });

        // Add hover effect
        let hoveredStateId = null;

        map.on('mousemove', 'hds-grid-fills', (e) => {
          if (e.features.length > 0) {
            if (popupRef.current) {
              popupRef.current.remove();
            }
        
            if (hoveredStateId !== null) {
              map.setFeatureState(
                { source: 'hds-grids', id: hoveredStateId },
                { hover: false }
              );
            }
        
            hoveredStateId = e.features[0].id;
            map.setFeatureState(
              { source: 'hds-grids', id: hoveredStateId },
              { hover: true }
            );
        
            const popup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'hds-popup',
              maxWidth: isMobile ? '300px' : '400px',
              offset: isMobile ? 5 : 15
            })
              .setLngLat(e.lngLat)
              .setHTML(generatePopupContent(e.features[0], colorScheme))
              .addTo(map);
        
            popupRef.current = popup;
          }
        });

        // Add click functionality for grid selection
        map.on('click', 'hds-grid-fills', (e) => {
          if (e.features.length > 0) {
            const clickedFeature = e.features[0];
            
            // Call the parent component's callback to update statistics
            if (onGridSelect) {
              onGridSelect(clickedFeature.properties);
            }
            
            // Remove existing popup if any
            if (popupRef.current) {
              popupRef.current.remove();
            }
            
            // Show popup for clicked grid
            const popup = new mapboxgl.Popup({
              closeButton: true,
              className: 'hds-popup',
              maxWidth: isMobile ? '300px' : '400px'
            })
              .setLngLat(e.lngLat)
              .setHTML(generatePopupContent(clickedFeature, colorScheme))
              .addTo(map);
            
            popupRef.current = popup;
          }
        });

        map.on('mouseleave', 'hds-grid-fills', () => {
          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: 'hds-grids', id: hoveredStateId },
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
    if (!mapRef.current || !mapRef.current.getLayer('hds-grid-fills')) return;

    let filterArray = ['all'];
    
    if (filters.housingSystem !== 'all') {
      // Filter by dominant housing system
      const systemNum = parseInt(filters.housingSystem);
      if (systemNum >= 1 && systemNum <= 7) {
        const fieldName = `HDS_C${systemNum}_num`;
        filterArray.push(['>', ['get', fieldName], 0]);
      }
    }
    
    if (filters.densityLevel !== 'all') {
      filterArray.push(['==', ['get', 'Grid_Class'], parseInt(filters.densityLevel)]);
    }
    
    if (filters.populationRange !== 'all') {
      const [min, max] = filters.populationRange.split('-').map(Number);
      filterArray.push(['>=', ['get', 'Grid_POP'], min]);
      if (max) {
        filterArray.push(['<=', ['get', 'Grid_POP'], max]);
      }
    }

    mapRef.current.setFilter('hds-grid-fills', filterArray);
    mapRef.current.setFilter('hds-grid-outlines', filterArray);
  }, [filters]);

  // Update colors when color scheme changes
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.getLayer('hds-grid-fills')) return;

    mapRef.current.setPaintProperty(
      'hds-grid-fills',
      'fill-color',
      getColorExpression()
    );

    updateLegend();
  }, [colorScheme]);

  // Update selected grid outline when selectedGrid changes
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.getLayer('hds-grid-outlines')) return;

    // Update the outline paint properties to highlight selected grid
    mapRef.current.setPaintProperty(
      'hds-grid-outlines',
      'line-color',
      [
        'case',
        ['==', ['get', 'FID'], selectedGrid?.FID || -1],
        '#ff0000', // Red for selected grid
        '#666666'  // Default color
      ]
    );

    mapRef.current.setPaintProperty(
      'hds-grid-outlines',
      'line-width',
      [
        'case',
        ['==', ['get', 'FID'], selectedGrid?.FID || -1],
        3, // Thicker for selected grid
        0.5 // Default width
      ]
    );
  }, [selectedGrid]);

  // Update legend content
  const updateLegend = () => {
    if (!legendRef.current) return;

    const items = getLegendItems();
    const title = {
      housingSystem: 'ระบบที่อยู่อาศัยหลัก',
      populationDensity: 'ความหนาแน่นประชากร',
      housingDensity: 'ความหนาแน่นที่อยู่อาศัย',
      gridClass: 'ระดับความหนาแน่น'
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

export default HDSMap;
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const HDSMap = ({ 
  filters, 
  colorScheme, 
  isMobile = false, 
  onGridSelect, 
  selectedGrid,
  selectedProvince 
}) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const hdsLayerRef = useRef(null);
  const legendRef = useRef(null);

  // Province definitions with corrected bounds
  const provinces = {
    40: { 
      name: 'ขอนแก่น', 
      center: [16.4419, 102.8359], 
      file: '/data/HDS_KKN01.geojson',
      bounds: [[15.5, 101.5], [17.5, 104.0]]
    },
    50: { 
      name: 'เชียงใหม่', 
      center: [18.7883, 98.9817], 
      file: '/data/HDS_CNX_02GJSON.geojson',
      bounds: [[17.5, 97.5], [20.5, 100.5]]
    },
    90: { 
      name: 'สงขลา', 
      center: [7.1891, 100.5951], 
      file: '/data/HDS_HYT.geojson',
      bounds: [[6.0, 99.5], [8.5, 101.5]]
    }
  };

  const currentProvince = provinces[selectedProvince] || provinces[40];

  // Color functions for different schemes
  const getColor = (feature) => {
    const props = feature.properties;
    
    switch (colorScheme) {
      case 'housingSystem':
        // Determine dominant housing system
        const systems = {
          HDS_C1: props.HDS_C1_num || 0,
          HDS_C2: props.HDS_C2_num || 0,
          HDS_C3: props.HDS_C3_num || 0,
          HDS_C4: props.HDS_C4_num || 0,
          HDS_C5: props.HDS_C5_num || 0,
          HDS_C6: props.HDS_C6_num || 0,
          HDS_C7: props.HDS_C7_num || 0
        };
        
        const dominantSystem = Object.keys(systems).reduce((a, b) => 
          systems[a] > systems[b] ? a : b
        );
        
        const colors = {
          HDS_C1: '#e31a1c', // Red - ระบบชุมชนบุกรุก
          HDS_C2: '#ff7f00', // Orange - ระบบถือครองชั่วคราว
          HDS_C3: '#fdbf6f', // Light Orange - ระบบกลุ่มประชากรแฝง
          HDS_C4: '#1f78b4', // Blue - ระบบที่อยู่อาศัยลูกจ้าง
          HDS_C5: '#33a02c', // Green - ระบบที่อยู่อาศัยรัฐ
          HDS_C6: '#a6cee3', // Light Blue - ระบบที่อยู่อาศัยรัฐสนับสนุน
          HDS_C7: '#b2df8a'  // Light Green - ระบบที่อยู่อาศัยเอกชน
        };
        
        return systems[dominantSystem] > 0 ? colors[dominantSystem] : '#cccccc';
        
      case 'populationDensity':
        const popDensity = props.Grid_POP || 0;
        if (popDensity > 5000) return '#800026';
        if (popDensity > 3000) return '#bd0026';
        if (popDensity > 2000) return '#e31a1c';
        if (popDensity > 1000) return '#fc4e2a';
        if (popDensity > 500) return '#fd8d3c';
        if (popDensity > 200) return '#feb24c';
        if (popDensity > 50) return '#fed976';
        return '#ffeda0';
        
      case 'housingDensity':
        const housingDensity = props.Grid_House || 0;
        if (housingDensity > 2000) return '#800026';
        if (housingDensity > 1500) return '#bd0026';
        if (housingDensity > 1000) return '#e31a1c';
        if (housingDensity > 500) return '#fc4e2a';
        if (housingDensity > 200) return '#fd8d3c';
        if (housingDensity > 100) return '#feb24c';
        if (housingDensity > 20) return '#fed976';
        return '#ffeda0';
        
      case 'gridClass':
        const gridClass = props.Grid_Class;
        const classColors = {
          1: '#ffffcc',
          2: '#c2e699',
          3: '#78c679',
          4: '#31a354',
          5: '#006837'
        };
        return classColors[gridClass] || '#cccccc';
        
      default:
        return '#cccccc';
    }
  };

  // Update legend
  const updateLegend = () => {
    if (!legendRef.current) return;
    
    const legendDiv = legendRef.current.getContainer();
    
    switch (colorScheme) {
      case 'housingSystem':
        legendDiv.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 5px;">ระบบที่อยู่อาศัยหลัก</div>
          <div><i style="background: #e31a1c; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> C1: ชุมชนบุกรุก</div>
          <div><i style="background: #ff7f00; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> C2: ถือครองชั่วคราว</div>
          <div><i style="background: #fdbf6f; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> C3: กลุ่มประชากรแฝง</div>
          <div><i style="background: #1f78b4; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> C4: ที่อยู่อาศัยลูกจ้าง</div>
          <div><i style="background: #33a02c; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> C5: ที่อยู่อาศัยรัฐ</div>
          <div><i style="background: #a6cee3; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> C6: ที่อยู่อาศัยรัฐสนับสนุน</div>
          <div><i style="background: #b2df8a; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> C7: ที่อยู่อาศัยเอกชน</div>
        `;
        break;
        
      case 'populationDensity':
        legendDiv.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 5px;">ความหนาแน่นประชากร (คน)</div>
          <div><i style="background: #800026; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> > 5,000</div>
          <div><i style="background: #bd0026; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 3,001-5,000</div>
          <div><i style="background: #e31a1c; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 2,001-3,000</div>
          <div><i style="background: #fc4e2a; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 1,001-2,000</div>
          <div><i style="background: #fd8d3c; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 501-1,000</div>
          <div><i style="background: #feb24c; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 201-500</div>
          <div><i style="background: #fed976; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 51-200</div>
          <div><i style="background: #ffeda0; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 0-50</div>
        `;
        break;
        
      case 'housingDensity':
        legendDiv.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 5px;">ความหนาแน่นที่อยู่อาศัย (หน่วย)</div>
          <div><i style="background: #800026; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> > 2,000</div>
          <div><i style="background: #bd0026; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 1,501-2,000</div>
          <div><i style="background: #e31a1c; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 1,001-1,500</div>
          <div><i style="background: #fc4e2a; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 501-1,000</div>
          <div><i style="background: #fd8d3c; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 201-500</div>
          <div><i style="background: #feb24c; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 101-200</div>
          <div><i style="background: #fed976; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 21-100</div>
          <div><i style="background: #ffeda0; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> 0-20</div>
        `;
        break;
        
      case 'gridClass':
        legendDiv.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 5px;">ระดับความหนาแน่น</div>
          <div><i style="background: #006837; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> ระดับ 5 (สูงมาก)</div>
          <div><i style="background: #31a354; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> ระดับ 4 (สูง)</div>
          <div><i style="background: #78c679; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> ระดับ 3 (ปานกลาง)</div>
          <div><i style="background: #c2e699; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> ระดับ 2 (ต่ำ)</div>
          <div><i style="background: #ffffcc; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> ระดับ 1 (ต่ำมาก)</div>
        `;
        break;
    }
  };

  // Initialize map when component mounts or province changes
  useEffect(() => {
    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      hdsLayerRef.current = null;
      legendRef.current = null;
    }

    // Initialize new map
    const map = L.map(mapContainerRef.current, {
      center: currentProvince.center,
      zoom: isMobile ? 9 : 10,
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
        
        let processedGeoJSON = geojsonData;

        // The coordinates are already in WGS84 format [lng, lat]
        // Just validate and log them
        const sampleCoord = geojsonData.features[0]?.geometry?.coordinates[0]?.[0];
        if (sampleCoord) {
          const [lng, lat] = sampleCoord;
          
          // Validate coordinates are reasonable for Thailand
          if (lng < 97 || lng > 106 || lat < 5 || lat > 21) {
            // Unusual coordinates detected
          }
        }
        
        // No transformation needed - coordinates are already in correct WGS84 format
        processedGeoJSON = geojsonData;

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
              
              // Highlight selected grid
              if (hdsLayerRef.current) {
                hdsLayerRef.current.eachLayer((l) => {
                  l.setStyle({
                    fillColor: getColor(l.feature),
                    weight: 1,
                    opacity: 0.3,
                    color: '#666666',
                    fillOpacity: 0.8
                  });
                });
              }
              
              // Highlight the clicked grid
              layer.setStyle({
                fillColor: getColor(layer.feature),
                weight: 3,
                opacity: 1,
                color: '#000000',
                fillOpacity: 0.9
              });
            });

            // Add hover effects
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
        
        // Use calculated bounds if valid, otherwise fall back to province bounds
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: isMobile ? [10, 10] : [20, 20], // Reduced padding for tighter fit
            maxZoom: isMobile ? 12 : 14
          });
        } else {
          // Use the predefined province bounds as fallback
          const provinceBounds = L.latLngBounds(currentProvince.bounds);
          map.fitBounds(provinceBounds, {
            padding: isMobile ? [10, 10] : [20, 20],
            maxZoom: isMobile ? 12 : 14
          });
        }

        // Update legend initially
        updateLegend();
      })
      .catch(error => {
        // Error loading GeoJSON
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

    // Update all layer colors
    hdsLayerRef.current.eachLayer((layer) => {
      const isSelected = selectedGrid && 
        layer.feature.properties.Grid_ID === selectedGrid.Grid_ID;
      
      if (isSelected) {
        // Highlight selected grid
        layer.setStyle({
          fillColor: getColor(layer.feature),
          weight: 3,
          opacity: 1,
          color: '#000000',
          fillOpacity: 0.9
        });
      } else {
        // Normal styling
        layer.setStyle({
          fillColor: getColor(layer.feature),
          weight: 1,
          opacity: 0.3,
          color: '#666666',
          fillOpacity: 0.8
        });
      }
    });

    // Update legend
    updateLegend();
  }, [colorScheme, selectedGrid]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ width: '100%', height: '100%' }}
      className="relative"
    />
  );
};

export default HDSMap;
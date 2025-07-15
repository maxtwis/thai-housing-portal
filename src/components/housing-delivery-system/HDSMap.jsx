import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import GeoJSON data for provinces
import songkhlaGeoJSON from '../data/songkhla_hds.json';
import bangkokGeoJSON from '../data/bangkok_hds.json';
import khonkaenGeoJSON from '../data/khonkaen_hds.json';
import chiangmaiGeoJSON from '../data/chiangmai_hds.json';

// Province configuration
const PROVINCES = {
  'songkhla': {
    name: 'สงขลา',
    bounds: [[6.5, 100.0], [7.8, 101.2]],
    center: [7.1891, 100.5951],
    file: songkhlaGeoJSON
  },
  'bangkok': {
    name: 'กรุงเทพมหานคร',
    bounds: [[13.4, 100.2], [14.0, 100.9]],
    center: [13.7563, 100.5018],
    file: bangkokGeoJSON
  },
  'khonkaen': {
    name: 'ขอนแก่น',
    bounds: [[15.8, 102.2], [17.0, 103.4]],
    center: [16.4419, 102.8359],
    file: khonkaenGeoJSON
  },
  'chiangmai': {
    name: 'เชียงใหม่',
    bounds: [[18.2, 98.2], [19.4, 99.8]],
    center: [18.7883, 98.9817],
    file: chiangmaiGeoJSON
  }
};

const HDSMap = ({ filters, colorScheme, isMobile, onGridSelect, selectedGrid, selectedProvince }) => {
  const mapRef = useRef(null);
  const hdsLayerRef = useRef(null);
  const legendRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Get current province configuration
  const currentProvince = PROVINCES[selectedProvince] || PROVINCES['songkhla'];

  // Color schemes for different visualizations
  const colorSchemes = {
    population: {
      name: 'Population Density',
      colors: ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#99000d'],
      field: 'Grid_POP',
      breaks: [0, 50, 100, 200, 500, 1000, 2000],
      unit: 'people'
    },
    housing: {
      name: 'Housing Systems',
      colors: ['#f0f9ff', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'],
      field: 'HDS_total',
      breaks: [0, 10, 25, 50, 100, 200, 500],
      unit: 'units'
    },
    density: {
      name: 'Grid Classification',
      colors: ['#edf8fb', '#bfd3e6', '#9ebcda', '#8c96c6', '#8856a7', '#810f7c'],
      field: 'Grid_Class',
      breaks: [1, 2, 3, 4, 5, 6],
      unit: 'class'
    }
  };

  // Get color for a feature based on selected scheme
  const getColor = (feature) => {
    const scheme = colorSchemes[colorScheme];
    const value = feature.properties[scheme.field];
    
    if (value === undefined || value === null) return '#f0f0f0';
    
    const { colors, breaks } = scheme;
    
    for (let i = 0; i < breaks.length - 1; i++) {
      if (value >= breaks[i] && value < breaks[i + 1]) {
        return colors[i];
      }
    }
    
    return colors[colors.length - 1];
  };

  // Update legend content
  const updateLegend = () => {
    if (!legendRef.current) return;
    
    const scheme = colorSchemes[colorScheme];
    const legend = legendRef.current;
    const legendDiv = legend.getContainer();
    
    // Clear existing content
    legendDiv.innerHTML = '';
    
    // Add title
    const title = document.createElement('div');
    title.innerHTML = `<strong>${scheme.name}</strong>`;
    title.style.marginBottom = '8px';
    legendDiv.appendChild(title);
    
    // Add color legend
    const { colors, breaks, unit } = scheme;
    
    for (let i = 0; i < colors.length; i++) {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.marginBottom = '4px';
      
      const colorBox = document.createElement('div');
      colorBox.style.width = '20px';
      colorBox.style.height = '15px';
      colorBox.style.backgroundColor = colors[i];
      colorBox.style.marginRight = '8px';
      colorBox.style.border = '1px solid #ccc';
      
      const label = document.createElement('span');
      label.style.fontSize = isMobile ? '10px' : '12px';
      
      if (i < breaks.length - 1) {
        label.textContent = `${breaks[i]} - ${breaks[i + 1] - 1} ${unit}`;
      } else {
        label.textContent = `${breaks[i]}+ ${unit}`;
      }
      
      item.appendChild(colorBox);
      item.appendChild(label);
      legendDiv.appendChild(item);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    setLoading(true);
    
    // Clear existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      hdsLayerRef.current = null;
      legendRef.current = null;
    }

    // Create new map
    const map = L.map(mapRef.current, {
      center: currentProvince.center,
      zoom: isMobile ? 10 : 10,
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
            console.warn(`Unusual coordinates detected for ${currentProvince.name}:`, { lng, lat });
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
              if (selectedGrid && selectedGrid.Grid_ID === clickedFeature.properties.Grid_ID) {
                layer.setStyle({
                  weight: 3,
                  color: '#ff0000',
                  opacity: 1,
                  fillOpacity: 0.7
                });
              }
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
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
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
    if (!hdsLayerRef.current) return;

    hdsLayerRef.current.eachLayer((layer) => {
      const feature = layer.feature;
      const isSelected = selectedGrid && selectedGrid.Grid_ID === feature.properties.Grid_ID;
      
      if (isSelected) {
        // Highlight selected grid
        layer.setStyle({
          fillColor: getColor(feature),
          weight: 3,
          color: '#ff0000',
          opacity: 1,
          fillOpacity: 0.7
        });
      } else {
        // Normal styling
        layer.setStyle({
          fillColor: getColor(feature),
          weight: 1,
          opacity: 0.3,
          color: '#666666',
          fillOpacity: 0.8
        });
      }
    });

    // Update legend when color scheme changes
    updateLegend();
  }, [colorScheme, selectedGrid]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative' 
      }}
    >
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HDSMap;
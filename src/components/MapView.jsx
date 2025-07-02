import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { provinces } from '../utils/dataUtils';

// Fix for default markers in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = ({ activeProvince, onProvinceChange, onProvinceHover }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const allProvincesLayerRef = useRef(null);
  const targetProvincesLayerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingGeoJSON, setUsingGeoJSON] = useState(false);
  
  // Our province IDs
  const wantedProvinceIds = provinces.map(p => p.id);
  
  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Create Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [13.7563, 100.5018], // Bangkok
      zoom: 5, // Match Mapbox initial zoom
      zoomControl: true,
      attributionControl: true
    });
    
    // Add tile layer (OpenStreetMap - free)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);
    
    // Store map reference
    mapRef.current = map;
    
    // Add fallback markers 
    markersRef.current = provinces.map(province => {
      const isActive = province.id === activeProvince;
      
      // Create custom icon
      const customIcon = L.divIcon({
        className: 'province-marker',
        html: `<div style="
          width: ${isActive ? '28px' : '20px'}; 
          height: ${isActive ? '28px' : '20px'}; 
          border-radius: 50%; 
          border: 2px solid #fff; 
          box-shadow: 0 0 10px rgba(0,0,0,0.3); 
          cursor: pointer;
          background-color: ${isActive ? '#3182CE' : '#9AE6B4'};
          z-index: ${isActive ? '10' : '1'};
        "></div>`,
        iconSize: [isActive ? 28 : 20, isActive ? 28 : 20],
        iconAnchor: [isActive ? 14 : 10, isActive ? 14 : 10]
      });
      
      const marker = L.marker([province.lat, province.lon], { icon: customIcon })
        .bindPopup(province.name)
        .addTo(map);
      
      marker.on('click', () => {
        onProvinceChange(province.id);
      });

      // Add hover events if handler provided
      if (onProvinceHover) {
        marker.on('mouseover', () => {
          onProvinceHover(province.id);
        });
      }
      
      return { marker, province };
    });
    
    // Set map bounds to Thailand (like Mapbox maxBounds)
    const bounds = L.latLngBounds(
      [5.6, 97.3], // Southwest
      [20.5, 105.6] // Northeast
    );
    map.setMaxBounds(bounds);
    
    // Now try to load GeoJSON
    fetch('/data/map.geojson')
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load GeoJSON: ${response.status}`);
        return response.json();
      })
      .then(geojsonData => {
        try {
          console.log('GeoJSON loaded, processing...');
          
          // Style function for ALL provinces background (like Mapbox all-provinces layer)
          const backgroundStyle = () => ({
            fillColor: '#F7FAFC',
            weight: 0.5,
            opacity: 0.7,
            color: '#CBD5E0',
            fillOpacity: 0.1
          });
          
          // Add background layer for ALL provinces (equivalent to Mapbox all-provinces-fill)
          allProvincesLayerRef.current = L.geoJSON(geojsonData, {
            style: backgroundStyle,
            interactive: false // Non-interactive background
          }).addTo(map);
          
          // Style function for TARGET provinces (like Mapbox province-fills)
          const targetStyle = (feature) => {
            const provinceId = parseInt(feature.properties.id);
            const isActive = provinceId === activeProvince;
            
            return {
              fillColor: isActive ? '#3182CE' : '#9AE6B4',
              weight: isActive ? 3 : 1,
              opacity: 0.8,
              color: '#2C5282',
              fillOpacity: 0.5
            };
          };
          
          // Add layer for TARGET provinces only (equivalent to Mapbox province-fills + province-borders)
          targetProvincesLayerRef.current = L.geoJSON(geojsonData, {
            style: targetStyle,
            filter: (feature) => {
              // ONLY show our 4 target provinces (like Mapbox filter)
              return wantedProvinceIds.includes(parseInt(feature.properties.id));
            },
            onEachFeature: (feature, layer) => {
              const provinceId = parseInt(feature.properties.id);
              
              // Add click events (like Mapbox click handler)
              layer.on('click', (e) => {
                console.log('Polygon clicked! Province ID:', provinceId);
                onProvinceChange(provinceId);
                L.DomEvent.stopPropagation(e);
              });
              
              // Add hover effects (like Mapbox mouseenter/mouseleave)
              layer.on('mouseover', () => {
                layer.setStyle({
                  weight: 3,
                  color: '#1E40AF',
                  fillOpacity: 0.7
                });
                
                // Call hover handler if provided
                if (onProvinceHover) {
                  onProvinceHover(provinceId);
                }
              });
              
              layer.on('mouseout', () => {
                targetProvincesLayerRef.current.resetStyle(layer);
              });
            }
          }).addTo(map);
          
          // Hide markers since GeoJSON loaded successfully (like Mapbox)
          markersRef.current.forEach(({ marker }) => {
            map.removeLayer(marker);
          });
          
          setUsingGeoJSON(true);
          console.log('GeoJSON setup completed successfully');
        } catch (err) {
          console.error('Error setting up GeoJSON layers:', err);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading GeoJSON:', err);
        setLoading(false);
      });
    
    // Clean up on unmount
    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(({ marker }) => {
          if (map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
        });
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []); // Empty dependency - only run once
  
  // Update active province (like Mapbox setPaintProperty)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    // Update GeoJSON layers if we're using them
    if (usingGeoJSON && targetProvincesLayerRef.current) {
      try {
        // Re-style target provinces layer (equivalent to Mapbox setPaintProperty)
        targetProvincesLayerRef.current.eachLayer((layer) => {
          const feature = layer.feature;
          const provinceId = parseInt(feature.properties.id);
          const isActive = provinceId === activeProvince;
          
          layer.setStyle({
            fillColor: isActive ? '#3182CE' : '#9AE6B4',
            weight: isActive ? 3 : 1,
            opacity: 0.8,
            color: '#2C5282',
            fillOpacity: 0.5
          });
        });
        
        // Fly to selected province using bounds (like Mapbox flyTo but better)
        const selectedProvince = provinces.find(p => p.id === activeProvince);
        if (selectedProvince) {
          // Find the layer for this province
          let targetLayer = null;
          targetProvincesLayerRef.current.eachLayer((layer) => {
            if (parseInt(layer.feature.properties.id) === activeProvince) {
              targetLayer = layer;
            }
          });
          
          if (targetLayer) {
            // Use fitBounds for better framing (better than simple flyTo)
            const bounds = targetLayer.getBounds();
            map.fitBounds(bounds, {
              padding: [40, 40],
              maxZoom: 7,
              animate: true,
              duration: 1.5
            });
          } else {
            // Fallback to coordinates if layer not found
            map.flyTo([selectedProvince.lat, selectedProvince.lon], 7, {
              duration: 1.5
            });
          }
        }
      } catch (err) {
        console.error('Error updating province styles:', err);
      }
    } else if (!usingGeoJSON && markersRef.current && markersRef.current.length > 0) {
      // Update markers if GeoJSON not available (fallback)
      markersRef.current.forEach(({ marker, province }) => {
        const isActive = province.id === activeProvince;
        
        const customIcon = L.divIcon({
          className: 'province-marker',
          html: `<div style="
            width: ${isActive ? '28px' : '20px'}; 
            height: ${isActive ? '28px' : '20px'}; 
            border-radius: 50%; 
            border: 2px solid #fff; 
            box-shadow: 0 0 10px rgba(0,0,0,0.3); 
            cursor: pointer;
            background-color: ${isActive ? '#3182CE' : '#9AE6B4'};
            z-index: ${isActive ? '10' : '1'};
          "></div>`,
          iconSize: [isActive ? 28 : 20, isActive ? 28 : 20],
          iconAnchor: [isActive ? 14 : 10, isActive ? 14 : 10]
        });
        
        marker.setIcon(customIcon);
      });
      
      // Fly to province using coordinates
      const selectedProvince = provinces.find(p => p.id === activeProvince);
      if (selectedProvince) {
        map.flyTo([selectedProvince.lat, selectedProvince.lon], 7, {
          duration: 1.5
        });
      }
    }
  }, [activeProvince, usingGeoJSON]);
  
  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-md">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">กำลังโหลดแผนที่...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-red-600 text-center p-4 max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="mt-2">{error}</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainerRef}
        className="w-full h-full"
      />
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow-md text-sm z-20">
        <p className="font-bold text-gray-800">Thai Housing Profile</p>
        <p className="text-gray-600 text-xs">Click on a province to view data</p>
      </div>
    </div>
  );
};

export default MapView;
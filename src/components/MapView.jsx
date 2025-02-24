import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; // Critical import for styles
import { provinces } from '../utils/dataUtils';

// Public token that can use default styles
mapboxgl.accessToken = 'pk.eyJ1IjoibmFwYXR0cnMiLCJhIjoiY203YnFwdmp1MDU0dTJrb3Fvbmhld2Z1cCJ9.rr4TE2vg3iIcpNqv9I2n5Q';

const MapView = ({ activeProvince, onProvinceChange }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingGeoJSON, setUsingGeoJSON] = useState(false);
  
  // Our province IDs
  const wantedProvinceIds = provinces.map(p => p.id);
  
  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    const initMap = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [100.5018, 13.7563], // Bangkok
      zoom: 5,
      attributionControl: true
    });
    
    // Store map reference
    mapRef.current = initMap;
    
    initMap.on('load', () => {
      console.log('Map loaded successfully');
      
      // Add fallback markers 
      markersRef.current = provinces.map(province => {
        const el = document.createElement('div');
        el.className = 'province-marker';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid #fff';
        el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.backgroundColor = province.id === activeProvince ? '#3182CE' : '#9AE6B4';
        
        el.addEventListener('click', () => {
          onProvinceChange(province.id);
        });
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setText(province.name);
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([province.lon, province.lat])
          .setPopup(popup)
          .addTo(initMap);
          
        return { marker, element: el, province };
      });
      
      // Now try to load GeoJSON
      fetch('/data/map.geojson')
        .then(response => {
          if (!response.ok) throw new Error(`Failed to load GeoJSON: ${response.status}`);
          return response.json();
        })
        .then(geojsonData => {
          try {
            console.log('GeoJSON loaded, processing...');
            
            // Add source with all provinces
            initMap.addSource('all-provinces', {
              type: 'geojson',
              data: geojsonData
            });
            
            // Add background for all Thai provinces
            initMap.addLayer({
              id: 'all-provinces-fill',
              type: 'fill',
              source: 'all-provinces',
              paint: {
                'fill-color': '#F7FAFC',
                'fill-opacity': 0.1
              }
            });
            
            // Add outline for all Thai provinces
            initMap.addLayer({
              id: 'all-provinces-outline',
              type: 'line',
              source: 'all-provinces',
              paint: {
                'line-color': '#CBD5E0',
                'line-width': 0.5,
                'line-opacity': 0.7
              }
            });
            
            // Add fill layer for our selected provinces
            initMap.addLayer({
              id: 'province-fills',
              type: 'fill',
              source: 'all-provinces',
              paint: {
                'fill-color': [
                  'match',
                  ['get', 'id'],
                  activeProvince, '#3182CE', // Active province - blue
                  '#9AE6B4' // Inactive provinces - light green
                ],
                'fill-opacity': 0.5
              },
              filter: ['in', ['get', 'id'], ['literal', wantedProvinceIds]]
            });
            
            // Add outline layer for our selected provinces
            initMap.addLayer({
              id: 'province-borders',
              type: 'line',
              source: 'all-provinces',
              paint: {
                'line-color': '#2C5282',
                'line-width': [
                  'match',
                  ['get', 'id'],
                  activeProvince, 3,
                  1
                ]
              },
              filter: ['in', ['get', 'id'], ['literal', wantedProvinceIds]]
            });
            
            // Add click interaction
            initMap.on('click', 'province-fills', (e) => {
              if (e.features.length > 0) {
                const clickedProvince = e.features[0].properties.id;
                onProvinceChange(clickedProvince);
              }
            });
            
            // Change cursor on hover
            initMap.on('mouseenter', 'province-fills', () => {
              initMap.getCanvas().style.cursor = 'pointer';
            });
            
            initMap.on('mouseleave', 'province-fills', () => {
              initMap.getCanvas().style.cursor = '';
            });
            
            // Hide markers since GeoJSON loaded successfully
            markersRef.current.forEach(({ marker }) => {
              marker.getElement().style.display = 'none';
            });
            
            // Note that we're using GeoJSON now
            setUsingGeoJSON(true);
            console.log('GeoJSON setup completed successfully');
          } catch (err) {
            console.error('Error setting up GeoJSON layers:', err);
            // We'll keep showing markers as fallback
          }
          
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading GeoJSON:', err);
          // Keep using markers as fallback
          setLoading(false);
        });
    });
    
    initMap.on('error', (e) => {
      console.error('Mapbox error:', e);
      setError(`Map error: ${e.error?.message || 'Unknown error'}`);
      setLoading(false);
    });
    
    // Set map bounds to Thailand
    const bounds = [
      [97.3, 5.6], // Southwest coordinates
      [105.6, 20.5] // Northeast coordinates
    ];
    initMap.setMaxBounds(bounds);
    
    // Clean up on unmount
    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(({ marker }) => marker.remove());
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []); // Empty dependency - only run once
  
  // Update active province
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    // Update GeoJSON if we're using it
    if (usingGeoJSON && map.getLayer('province-fills')) {
      try {
        // Update province fill colors
        map.setPaintProperty('province-fills', 'fill-color', [
          'match',
          ['get', 'id'],
          activeProvince, '#3182CE', // Active province
          '#9AE6B4' // Inactive provinces
        ]);
        
        // Update province border widths
        map.setPaintProperty('province-borders', 'line-width', [
          'match',
          ['get', 'id'],
          activeProvince, 3,
          1
        ]);
      } catch (err) {
        console.error('Error updating GeoJSON styles:', err);
      }
    }
    
    // Update markers (if visible)
    if (markersRef.current && markersRef.current.length > 0) {
      markersRef.current.forEach(({ element, province }) => {
        if (element.style.display !== 'none') {
          element.style.backgroundColor = province.id === activeProvince ? '#3182CE' : '#9AE6B4';
          element.style.width = province.id === activeProvince ? '28px' : '20px';
          element.style.height = province.id === activeProvince ? '28px' : '20px';
          element.style.zIndex = province.id === activeProvince ? '10' : '1';
        }
      });
    }
    
    // Fly to selected province
    if (map) {
      const selectedProvince = provinces.find(p => p.id === activeProvince);
      if (selectedProvince) {
        map.flyTo({
          center: [selectedProvince.lon, selectedProvince.lat],
          zoom: 7,
          duration: 1500
        });
      }
    }
  }, [activeProvince, usingGeoJSON]); // Only depend on activeProvince and GeoJSON status
  
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
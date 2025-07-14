import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geoJsonIntegrator } from '../../utils/csvDataIntegration';

// Fix for default markers in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const HDSMap = ({ 
  filters, 
  colorScheme = 'housingSystem', 
  isMobile, 
  onGridSelect, 
  selectedGrid, 
  selectedProvince = 90,
  hdsData,
  csvData,
  hasCSVData = false
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const hdsLayerRef = useRef(null);
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

  // Province configurations
  const provinceConfigs = {
    40: {
      name: 'ขอนแก่น',
      center: [16.4419, 102.8359],
      bounds: [[15.5, 101.5], [17.5, 104.0]]
    },
    50: {
      name: 'เชียงใหม่',
      center: [18.7883, 98.9817],
      bounds: [[18.0, 98.0], [19.5, 100.0]]
    },
    90: {
      name: 'สงขลา',
      center: [7.01, 100.465],
      bounds: [[6.975, 100.425], [7.045, 100.505]]
    }
  };

  // Dynamic height calculation
  const getMapHeight = () => {
    return isMobile ? "60vh" : "calc(100vh - 200px)";
  };

  // Get color based on the current color scheme
  const getColor = (feature) => {
    const props = feature.properties;
    
    // If we have CSV data and it's a CSV-related color scheme, use CSV data colors
    if (hasCSVData && ['csvSupply', 'csvSalePrice', 'csvRentPrice', 'csvHouseType'].includes(colorScheme)) {
      return geoJsonIntegrator.getCSVDataColor(feature, colorScheme.replace('csv', '').toLowerCase());
    }
    
    // Original HDS color schemes
    switch (colorScheme) {
      case 'housingSystem':
        return getHousingSystemColor(props);
      case 'populationDensity':
        return getPopulationDensityColor(props.Grid_POP || 0);
      case 'housingDensity':
        return getHousingDensityColor(props.Grid_House || 0);
      case 'gridClass':
        return getGridClassColor(props.Grid_Class);
      default:
        return '#cccccc';
    }
  };

  // Original color functions
  const getHousingSystemColor = (props) => {
    const systems = [
      { code: 1, count: props.HDS_C1_num || 0, color: '#d62728' },
      { code: 2, count: props.HDS_C2_num || 0, color: '#ff7f0e' },
      { code: 3, count: props.HDS_C3_num || 0, color: '#2ca02c' },
      { code: 4, count: props.HDS_C4_num || 0, color: '#1f77b4' },
      { code: 5, count: props.HDS_C5_num || 0, color: '#9467bd' },
      { code: 6, count: props.HDS_C6_num || 0, color: '#8c564b' },
      { code: 7, count: props.HDS_C7_num || 0, color: '#e377c2' }
    ];
    
    const dominant = systems.reduce((max, system) => 
      system.count > max.count ? system : max, { count: 0, color: '#f0f0f0' });
    
    return dominant.color;
  };

  const getPopulationDensityColor = (population) => {
    if (population === 0) return '#f0f0f0';
    if (population <= 50) return '#fee5d9';
    if (population <= 100) return '#fcae91';
    if (population <= 200) return '#fb6a4a';
    if (population <= 400) return '#de2d26';
    return '#a50f15';
  };

  const getHousingDensityColor = (housing) => {
    if (housing === 0) return '#f0f0f0';
    if (housing <= 20) return '#f7fcb9';
    if (housing <= 50) return '#d9f0a3';
    if (housing <= 100) return '#addd8e';
    if (housing <= 200) return '#78c679';
    if (housing <= 300) return '#41ab5d';
    return '#238443';
  };

  const getGridClassColor = (gridClass) => {
    const colors = {
      1: '#f7fcf0', 2: '#e0f3db', 3: '#ccebc5', 4: '#a8ddb5',
      5: '#7bccc4', 6: '#4eb3d3', 7: '#2b8cbe', 8: '#0868ac', 9: '#084081'
    };
    return colors[gridClass] || '#f0f0f0';
  };

  // Get legend items based on color scheme
  const getLegendItems = () => {
    switch (colorScheme) {
      case 'housingSystem':
        return [
          { label: 'ระบบชุมชนแออัด', color: '#d62728' },
          { label: 'ระบบถือครองชั่วคราว', color: '#ff7f0e' },
          { label: 'ระบบประชากรแฝง', color: '#2ca02c' },
          { label: 'ระบบลูกจ้าง', color: '#1f77b4' },
          { label: 'ระบบรัฐจัดสร้าง', color: '#9467bd' },
          { label: 'ระบบรัฐสนับสนุน', color: '#8c564b' },
          { label: 'ระบบเอกชน', color: '#e377c2' }
        ];
      case 'populationDensity':
        return [
          { label: 'ไม่มีประชากร', color: '#f0f0f0' },
          { label: '1-50 คน', color: '#fee5d9' },
          { label: '51-100 คน', color: '#fcae91' },
          { label: '101-200 คน', color: '#fb6a4a' },
          { label: '201-400 คน', color: '#de2d26' },
          { label: '400+ คน', color: '#a50f15' }
        ];
      case 'housingDensity':
        return [
          { label: 'ไม่มีที่อยู่อาศัย', color: '#f0f0f0' },
          { label: '1-20 หน่วย', color: '#f7fcb9' },
          { label: '21-50 หน่วย', color: '#d9f0a3' },
          { label: '51-100 หน่วย', color: '#addd8e' },
          { label: '101-200 หน่วย', color: '#78c679' },
          { label: '201-300 หน่วย', color: '#41ab5d' },
          { label: '300+ หน่วย', color: '#238443' }
        ];
      case 'gridClass':
        return [
          { label: 'Class 1', color: '#f7fcf0' },
          { label: 'Class 2', color: '#e0f3db' },
          { label: 'Class 3', color: '#ccebc5' },
          { label: 'Class 4', color: '#a8ddb5' },
          { label: 'Class 5', color: '#7bccc4' },
          { label: 'Class 6', color: '#4eb3d3' },
          { label: 'Class 7', color: '#2b8cbe' },
          { label: 'Class 8', color: '#0868ac' },
          { label: 'Class 9', color: '#084081' }
        ];
      case 'csvSupply':
        return [
          { label: 'ไม่มีข้อมูล', color: '#f0f0f0' },
          { label: '1-5 หน่วย', color: '#fee5d9' },
          { label: '6-15 หน่วย', color: '#fcae91' },
          { label: '16-30 หน่วย', color: '#fb6a4a' },
          { label: '31-50 หน่วย', color: '#de2d26' },
          { label: '50+ หน่วย', color: '#a50f15' }
        ];
      case 'csvSalePrice':
        return [
          { label: 'ไม่มีข้อมูล', color: '#f0f0f0' },
          { label: '< 1.5M บาท', color: '#f7fcb9' },
          { label: '1.5-3M บาท', color: '#d9f0a3' },
          { label: '3-5M บาท', color: '#addd8e' },
          { label: '5-8M บาท', color: '#78c679' },
          { label: '8-12M บาท', color: '#41ab5d' },
          { label: '12M+ บาท', color: '#238443' }
        ];
      case 'csvRentPrice':
        return [
          { label: 'ไม่มีข้อมูล', color: '#f0f0f0' },
          { label: '< 2,000 บาท', color: '#f7fcfd' },
          { label: '2,000-3,000 บาท', color: '#e0ecf4' },
          { label: '3,000-4,000 บาท', color: '#bfd3e6' },
          { label: '4,000-5,000 บาท', color: '#9ebcda' },
          { label: '5,000-6,000 บาท', color: '#8c96c6' },
          { label: '6,000+ บาท', color: '#8c6bb1' }
        ];
      case 'csvHouseType':
        return [
          { label: 'บ้านเดี่ยว', color: '#1f77b4' },
          { label: 'ทาวน์เฮ้าส์', color: '#ff7f0e' },
          { label: 'ห้องแถว/ตึกแถว', color: '#2ca02c' },
          { label: 'ตึกแถวพาณิชย์', color: '#d62728' },
          { label: 'คอนโด', color: '#9467bd' },
          { label: 'อพาร์ตเมนต์', color: '#8c564b' },
          { label: 'การเคหะ', color: '#e377c2' },
          { label: 'อื่นๆ', color: '#7f7f7f' }
        ];
      default:
        return [
          { label: 'ไม่มีข้อมูล', color: '#f0f0f0' },
          { label: 'ต่ำ', color: '#fee5d9' },
          { label: 'ปานกลาง', color: '#fb6a4a' },
          { label: 'สูง', color: '#a50f15' }
        ];
    }
  };

  // Generate popup content
  const generatePopupContent = (feature, colorScheme) => {
    const props = feature.properties;
    const currentProvince = provinceConfigs[selectedProvince];
    
    // Get grid ID from various possible fields
    const gridId = props.FID || props.OBJECTID_1 || props.OBJECTID || props.Grid_Code || props.Grid_CODE;
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
    
    // CSV data section
    let csvSection = '';
    if (hasCSVData && (props.csv_totalSupply !== undefined)) {
      const houseTypes = props.csv_houseTypes ? JSON.parse(props.csv_houseTypes) : [];
      
      csvSection = `
        <div class="border-t border-gray-200 mt-3 pt-3">
          <h4 class="font-semibold text-sm text-blue-800 mb-2">ข้อมูลอุปทานที่อยู่อาศัย</h4>
          <div class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">อุปทานรวม</span>
              <span class="font-medium">${props.csv_totalSupply || 0} หน่วย</span>
            </div>
            ${props.csv_averageSalePrice ? `
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">ราคาขายเฉลี่ย</span>
              <span class="font-medium">฿${Math.round(props.csv_averageSalePrice).toLocaleString()}</span>
            </div>` : ''}
            ${props.csv_averageRentPrice ? `
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">ราคาเช่าเฉลี่ย</span>
              <span class="font-medium">฿${Math.round(props.csv_averageRentPrice).toLocaleString()}/เดือน</span>
            </div>` : ''}
            ${props.csv_dominantHouseType ? `
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">ประเภทหลัก</span>
              <span class="font-medium">${props.csv_dominantHouseType}</span>
            </div>` : ''}
            ${houseTypes.length > 0 ? `
            <div class="mt-2">
              <span class="text-xs text-gray-500">รายละเอียดประเภท:</span>
              <div class="text-xs space-y-1 mt-1 max-h-24 overflow-y-auto">
                ${houseTypes.slice(0, 5).map(type => `
                  <div class="flex justify-between">
                    <span>${type.type}</span>
                    <span>${type.supply} หน่วย</span>
                  </div>
                `).join('')}
                ${houseTypes.length > 5 ? '<div class="text-gray-400">...และอื่นๆ</div>' : ''}
              </div>
            </div>` : ''}
          </div>
        </div>
      `;
    }
    
    return `
      <div class="p-3 min-w-[280px] max-w-[350px]">
        <div class="bg-gray-50 -m-3 p-3 mb-3 border-b">
          <h3 class="font-bold text-gray-800">พื้นที่กริด ID: ${gridId}</h3>
          <p class="text-sm text-gray-600 mt-1">${currentProvince?.name || 'ไม่ทราบจังหวัด'}</p>
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
          <div class="border-t border-gray-200 pt-2 mt-2">
            <span class="text-sm text-gray-600">ระบบที่อยู่อาศัยหลัก:</span>
            <div class="font-medium text-sm">${hdsCategories[dominantSystem.code] || 'ไม่ทราบ'}</div>
            <div class="text-xs text-gray-500">${dominantSystem.count} หน่วย</div>
          </div>` : ''}
        </div>
        
        ${csvSection}
      </div>
    `;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !hdsData) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      hdsLayerRef.current = null;
      legendRef.current = null;
    }

    const currentProvince = provinceConfigs[selectedProvince];
    
    // Create map
    const map = L.map(mapContainerRef.current, {
      center: currentProvince.center,
      zoom: isMobile ? 9 : 10,
      zoomControl: !isMobile,
      attributionControl: false
    });

    mapRef.current = map;

    // Add zoom control for mobile
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

    // Process GeoJSON data
    console.log('Processing GeoJSON data:', hdsData.features.length, 'features');

    // Style function
    const style = (feature) => {
      return {
        fillColor: getColor(feature),
        weight: 1,
        opacity: 0.3,
        color: '#666666',
        fillOpacity: 0.8
      };
    };

    // Add HDS layer
    const hdsLayer = L.geoJSON(hdsData, {
      style: style,
      onEachFeature: (feature, layer) => {
        // Click functionality
        layer.on('click', (e) => {
          if (onGridSelect) {
            onGridSelect(feature.properties);
          }
          
          // Show popup
          if (isMobile) {
            const gridId = feature.properties.FID || 
                          feature.properties.OBJECTID_1 || 
                          feature.properties.Grid_Code || 
                          feature.properties.Grid_CODE;
            const gridPop = feature.properties.Grid_POP || 0;
            
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
                ${hasCSVData && feature.properties.csv_totalSupply ? 
                  `<p class="text-xs text-blue-600">อุปทาน: ${feature.properties.csv_totalSupply} หน่วย</p>` : ''}
                <button onclick="this.closest('.leaflet-popup').remove()" class="text-xs text-blue-600 mt-1">ปิด</button>
              </div>
            `)
            .openOn(map);
          } else {
            const popupContent = generatePopupContent(feature, colorScheme);
            
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

        // Hover effects (desktop only)
        if (!isMobile) {
          layer.on('mouseover', () => {
            layer.setStyle({
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.9
            });
          });

          layer.on('mouseout', () => {
            layer.setStyle({
              weight: 1,
              opacity: 0.3,
              fillOpacity: 0.8
            });
          });
        }
      }
    });

    hdsLayer.addTo(map);
    hdsLayerRef.current = hdsLayer;

    // Fit bounds
    if (hdsLayer.getBounds().isValid()) {
      map.fitBounds(hdsLayer.getBounds(), {
        padding: isMobile ? [10, 10] : [20, 20],
        maxZoom: isMobile ? 12 : 14
      });
    } else {
      const provinceBounds = L.latLngBounds(currentProvince.bounds);
      map.fitBounds(provinceBounds, {
        padding: isMobile ? [10, 10] : [20, 20],
        maxZoom: isMobile ? 12 : 14
      });
    }

    // Update legend
    updateLegend();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        hdsLayerRef.current = null;
        legendRef.current = null;
      }
    };
  }, [selectedProvince, isMobile, hdsData]);

  // Update filters
  useEffect(() => {
    if (!mapRef.current || !hdsLayerRef.current) return;

    hdsLayerRef.current.eachLayer((layer) => {
      const feature = layer.feature.properties;
      let shouldShow = true;
      
      // Original HDS filters
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

      // CSV-based filters (only if we have CSV data)
      if (hasCSVData) {
        if (filters.supplyRange !== 'all') {
          const supply = feature.csv_totalSupply || 0;
          const [min, max] = filters.supplyRange.split('-').map(Number);
          shouldShow = shouldShow && (supply >= min);
          if (max) {
            shouldShow = shouldShow && (supply <= max);
          }
        }

        if (filters.houseType !== 'all') {
          const dominantType = feature.csv_dominantHouseType;
          shouldShow = shouldShow && (dominantType === filters.houseType);
        }

        if (filters.priceRange !== 'all') {
          const price = feature.csv_averageSalePrice || 0;
          if (price > 0) {
            const [min, max] = filters.priceRange.split('-').map(Number);
            shouldShow = shouldShow && (price >= min);
            if (max) {
              shouldShow = shouldShow && (price <= max);
            }
          } else {
            shouldShow = false; // Hide grids without price data when price filter is active
          }
        }
      }

      // Show/hide layer
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
  }, [filters, hasCSVData]);

  // Update colors and legend when color scheme changes
  useEffect(() => {
    if (!mapRef.current || !hdsLayerRef.current) return;

    hdsLayerRef.current.eachLayer((layer) => {
      layer.setStyle({
        fillColor: getColor(layer.feature),
        weight: 1,
        opacity: 0.3,
        color: '#666666',
        fillOpacity: 0.8
      });
    });

    updateLegend();
  }, [colorScheme, selectedGrid, hasCSVData]);

  // Update legend content
  const updateLegend = () => {
    if (!legendRef.current || !legendRef.current.getContainer()) return;

    const items = getLegendItems();
    const title = {
      housingSystem: 'ระบบที่อยู่อาศัยหลัก',
      populationDensity: 'ความหนาแน่นประชากร',
      housingDensity: 'ความหนาแน่นที่อยู่อาศัย',
      gridClass: 'ระดับความหนาแน่น',
      csvSupply: 'อุปทานที่อยู่อาศัย',
      csvSalePrice: 'ราคาขายเฉลี่ย',
      csvRentPrice: 'ราคาเช่าเฉลี่ย',
      csvHouseType: 'ประเภทที่อยู่อาศัยหลัก'
    }[colorScheme] || 'คำอธิบายสัญลักษณ์';
    
    const fontSize = isMobile ? '8px' : '12px';
    const marginBottom = isMobile ? '1px' : '4px';
    const colorBoxSize = isMobile ? '10px' : '16px';
    
    legendRef.current.getContainer().innerHTML = `
      <h4 style="margin: 0 0 4px 0; font-weight: 600; font-size: ${isMobile ? '9px' : fontSize};">${title}</h4>
      ${items.map(item => `
        <div style="display: flex; align-items: center; margin-bottom: ${marginBottom};">
          <span style="display: inline-block; width: ${colorBoxSize}; height: ${colorBoxSize}; margin-right: 6px; background: ${item.color}; border: 1px solid rgba(0,0,0,0.2);"></span>
          <span style="font-size: ${fontSize}; line-height: 1.2;">${item.label}</span>
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
      <div className="absolute bottom-0 right-0 bg-white bg-opacity-75 px-2 py-1 text-xs text-gray-600">
        © OpenStreetMap contributors
        {hasCSVData && (
          <span className="ml-2 text-blue-600">+ ข้อมูลอุปทาน</span>
        )}
      </div>
    </div>
  );
};

export default HDSMap;
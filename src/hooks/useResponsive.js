import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile/tablet screen sizes
 * @returns {Object} { isMobile, isTablet, isDesktop }
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      });
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenSize;
};

/**
 * Get responsive chart configuration for ECharts
 * @param {boolean} isMobile - Is mobile screen
 * @param {boolean} rotateLabels - Should rotate x-axis labels
 * @returns {Object} ECharts grid and label configuration
 */
export const getResponsiveChartConfig = (isMobile, rotateLabels = true) => {
  return {
    grid: {
      left: isMobile ? 50 : 80,
      right: isMobile ? 20 : 40,
      top: 40,
      bottom: isMobile && rotateLabels ? 120 : (isMobile ? 80 : 100)
    },
    xAxisLabel: {
      fontSize: isMobile ? 10 : 12,
      rotate: isMobile && rotateLabels ? 45 : 0,
      interval: 0,
      hideOverlap: true
    },
    yAxisLabel: {
      fontSize: isMobile ? 10 : 12
    },
    tooltip: {
      textStyle: {
        fontSize: isMobile ? 12 : 14
      }
    },
    legend: {
      textStyle: {
        fontSize: isMobile ? 10 : 12
      },
      itemWidth: isMobile ? 12 : 14,
      itemHeight: isMobile ? 12 : 14
    }
  };
};

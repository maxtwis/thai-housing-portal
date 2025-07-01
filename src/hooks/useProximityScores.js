// hooks/useProximityScores.js
// React hook for managing proximity scores

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProximityScoreManager, DEFAULT_CONFIG } from '../utils/proximityScoring';

export const useProximityScores = (properties, options = {}) => {
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const managerRef = useRef(null);
  
  const {
    maxProperties = DEFAULT_CONFIG.maxPropertiesPerBatch,
    autoStart = true,
    radius = DEFAULT_CONFIG.radius
  } = options;

  // Initialize proximity score manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new ProximityScoreManager(
        DEFAULT_CONFIG.maxConcurrent,
        DEFAULT_CONFIG.requestDelay
      );
    }
  }, []);

  // Calculate proximity scores
  const calculateScores = useCallback(async (propertiesToProcess = null) => {
    const targetProperties = propertiesToProcess || properties;
    
    if (!targetProperties || targetProperties.length === 0 || !managerRef.current) {
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);
    
    const newScores = { ...scores }; // Keep existing scores
    let completed = 0;
    const totalToProcess = Math.min(targetProperties.length, maxProperties);

    const updateScore = (propertyId, score) => {
      newScores[propertyId] = score;
      completed++;
      const progressPercent = Math.round((completed / totalToProcess) * 100);
      setProgress(progressPercent);
      setScores({ ...newScores });

      if (completed >= totalToProcess) {
        setLoading(false);
        setProgress(100);
      }
    };

    try {
      // Process only valid properties with coordinates
      const validProperties = targetProperties
        .filter(property => property.latitude && property.longitude)
        .slice(0, maxProperties);

      console.log(`Starting proximity score calculation for ${validProperties.length} properties`);

      // Start calculating scores
      validProperties.forEach(property => {
        if (!newScores[property.id]) { // Skip if already calculated
          managerRef.current.calculateScore(property, updateScore);
        } else {
          updateScore(property.id, newScores[property.id]); // Use cached score
        }
      });

      // Handle properties without coordinates
      targetProperties
        .filter(property => !property.latitude || !property.longitude)
        .forEach(property => {
          updateScore(property.id, 0);
        });

    } catch (err) {
      console.error('Error calculating proximity scores:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [properties, scores, maxProperties]);

  // Auto-start calculation when properties change
  useEffect(() => {
    if (autoStart && properties && properties.length > 0) {
      // Only calculate for new properties that don't have scores yet
      const newProperties = properties.filter(p => !scores[p.id]);
      if (newProperties.length > 0) {
        calculateScores(newProperties);
      }
    }
  }, [properties, autoStart, calculateScores]);

  // Get proximity score for a specific property
  const getScore = useCallback((propertyId) => {
    return scores[propertyId] || null;
  }, [scores]);

  // Check if a property has a calculated score
  const hasScore = useCallback((propertyId) => {
    return scores[propertyId] !== undefined;
  }, [scores]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return managerRef.current ? managerRef.current.getCacheStats() : null;
  }, []);

  // Clear expired cache entries
  const clearExpiredCache = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.clearExpiredCache();
    }
  }, []);

  // Reset scores
  const resetScores = useCallback(() => {
    setScores({});
    setProgress(0);
    setError(null);
  }, []);

  // Get statistics about calculated scores
  const getScoreStatistics = useCallback(() => {
    const scoreValues = Object.values(scores).filter(score => score > 0);
    
    if (scoreValues.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        distribution: {}
      };
    }

    const average = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
    const min = Math.min(...scoreValues);
    const max = Math.max(...scoreValues);

    // Score distribution
    const distribution = {
      'excellent': scoreValues.filter(s => s >= 80).length,
      'good': scoreValues.filter(s => s >= 60 && s < 80).length,
      'fair': scoreValues.filter(s => s >= 40 && s < 60).length,
      'poor': scoreValues.filter(s => s < 40).length
    };

    return {
      count: scoreValues.length,
      average: Math.round(average),
      min,
      max,
      distribution
    };
  }, [scores]);

  return {
    scores,
    loading,
    progress,
    error,
    calculateScores,
    getScore,
    hasScore,
    getCacheStats,
    clearExpiredCache,
    resetScores,
    getScoreStatistics
  };
};

// Hook for detailed proximity scores with breakdown
export const useDetailedProximityScores = (properties, options = {}) => {
  const [detailedScores, setDetailedScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    maxProperties = 5, // Fewer for detailed scores due to more API calls
    radius = DEFAULT_CONFIG.radius
  } = options;

  const calculateDetailedScores = useCallback(async () => {
    if (!properties || properties.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const { calculateDetailedProximityScore } = await import('../utils/proximityScoring');
      const validProperties = properties
        .filter(property => property.latitude && property.longitude)
        .slice(0, maxProperties);

      const newDetailedScores = {};

      for (const property of validProperties) {
        try {
          const detailedScore = await calculateDetailedProximityScore(property, radius);
          newDetailedScores[property.id] = detailedScore;
          
          // Add delay between calculations
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`Error calculating detailed score for property ${property.id}:`, err);
          newDetailedScores[property.id] = {
            overall: 0,
            breakdown: {},
            counts: {}
          };
        }
      }

      setDetailedScores(newDetailedScores);
    } catch (err) {
      console.error('Error calculating detailed proximity scores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [properties, maxProperties, radius]);

  const getDetailedScore = useCallback((propertyId) => {
    return detailedScores[propertyId] || null;
  }, [detailedScores]);

  return {
    detailedScores,
    loading,
    error,
    calculateDetailedScores,
    getDetailedScore
  };
};

// Hook for managing proximity score filters
export const useProximityScoreFilter = (properties, proximityScores) => {
  const [proximityFilter, setProximityFilter] = useState('all');

  const filteredProperties = useMemo(() => {
    if (!properties || proximityFilter === 'all') {
      return properties;
    }

    return properties.filter(property => {
      const score = proximityScores[property.id] || 0;
      const [minScore, maxScore] = proximityFilter.split('-').map(Number);
      
      if (maxScore) {
        return score >= minScore && score <= maxScore;
      } else {
        return score >= minScore;
      }
    });
  }, [properties, proximityScores, proximityFilter]);

  const getFilterOptions = useCallback(() => {
    return [
      { value: 'all', label: 'ทุกระดับ' },
      { value: '80-100', label: 'ใกล้มาก (80-100%)' },
      { value: '60-79', label: 'ใกล้ (60-79%)' },
      { value: '40-59', label: 'ปานกลาง (40-59%)' },
      { value: '20-39', label: 'ไกล (20-39%)' },
      { value: '0-19', label: 'ไกลมาก (0-19%)' }
    ];
  }, []);

  const getFilterStatistics = useCallback(() => {
    if (!properties || !proximityScores) return {};

    const stats = {};
    const options = getFilterOptions();

    options.forEach(option => {
      if (option.value === 'all') {
        stats[option.value] = properties.length;
      } else {
        const [minScore, maxScore] = option.value.split('-').map(Number);
        stats[option.value] = properties.filter(property => {
          const score = proximityScores[property.id] || 0;
          if (maxScore) {
            return score >= minScore && score <= maxScore;
          } else {
            return score >= minScore;
          }
        }).length;
      }
    });

    return stats;
  }, [properties, proximityScores, getFilterOptions]);

  return {
    proximityFilter,
    setProximityFilter,
    filteredProperties,
    getFilterOptions,
    getFilterStatistics
  };
};

export default useProximityScores;
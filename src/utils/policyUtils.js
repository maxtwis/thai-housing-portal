// utils/policyUtils.js
import { getCkanData } from './ckanClient';

// Policy data resource ID
const POLICY_RESOURCE_ID = 'fec3b798-5907-419c-8e75-d69717dcc4ef';

// Cache for fetched policy data
const policyCache = {};

export const getPolicyData = async (geoId = null) => {
  const cacheKey = `policy_${geoId || 'all'}`;
  
  if (policyCache[cacheKey]) {
    return policyCache[cacheKey];
  }
  
  try {
    let filters = {};
    
    if (geoId) {
      // Include both province-specific policies and nationwide policies (geo_id = 99)
      // Note: CKAN might not support OR operations in filters directly, so we might need to fetch each separately
      filters.geo_id = geoId;
    }
    
    const result = await getCkanData(POLICY_RESOURCE_ID, {
      filters: JSON.stringify(filters),
      limit: 1000
    });
    
    let formattedData = (result.records || []).map(item => ({
      geo_id: item.geo_id,
      'Ministry (if applicable)': item.ministry,
      'Department(s)': item.department,
      'Joint Org. (If applicable)': item.joint_org,
      'Plan': item.plan,
      'Strategy / Initiative': item.strategy,
      'Initiative Period (B.E)': item.initiative_period,
      'Project': item.project,
      'BKK Specific': item.bkk_specific,
      'Year': item.year,
      '3S Model': item.policy_type,
      'Status': item.status,
      'Annual Budget': item.annual_budget,
      'Synopsis': item.synopsis,
      'KPI': item.kpi
    }));
    
    // If we filtered for a specific province, also get nationwide policies
    if (geoId) {
      try {
        const nationalResult = await getCkanData(POLICY_RESOURCE_ID, {
          filters: JSON.stringify({ geo_id: 99 }),
          limit: 1000
        });
        
        const nationalPolicies = (nationalResult.records || []).map(item => ({
          geo_id: item.geo_id,
          'Ministry (if applicable)': item.ministry,
          'Department(s)': item.department,
          'Joint Org. (If applicable)': item.joint_org,
          'Plan': item.plan,
          'Strategy / Initiative': item.strategy,
          'Initiative Period (B.E)': item.initiative_period,
          'Project': item.project,
          'BKK Specific': item.bkk_specific,
          'Year': item.year,
          '3S Model': item.policy_type,
          'Status': item.status,
          'Annual Budget': item.annual_budget,
          'Synopsis': item.synopsis,
          'KPI': item.kpi
        }));
        
        // Combine province and national policies
        formattedData = [...formattedData, ...nationalPolicies];
      } catch (error) {
        console.error('Error fetching national policies:', error);
      }
    }
    
    policyCache[cacheKey] = formattedData;
    return formattedData;
  } catch (err) {
    console.error('Error fetching policy data:', err);
    return [];
  }
};

// Function to group policies by type (3S Model)
export const getPoliciesByType = (policies) => {
  if (!policies || policies.length === 0) return {};
  
  const grouped = {};
  
  policies.forEach(policy => {
    const type = policy['3S Model'] || 'Unknown';
    
    // Handle multiple types (if separated by commas)
    const types = type.split(',').map(t => t.trim());
    
    types.forEach(t => {
      if (!grouped[t]) {
        grouped[t] = [];
      }
      
      // Only add the policy if it's not already in the array
      if (!grouped[t].some(p => p.Project === policy.Project)) {
        grouped[t].push(policy);
      }
    });
  });
  
  return grouped;
};

// Function to count policies by status
export const countPoliciesByStatus = (policies) => {
  if (!policies || policies.length === 0) {
    return { Active: 0, Pending: 0, Inactive: 0 };
  }
  
  const counts = { Active: 0, Pending: 0, Inactive: 0 };
  
  policies.forEach(policy => {
    const status = policy.Status || 'Unknown';
    if (counts[status] !== undefined) {
      counts[status] += 1;
    }
  });
  
  return counts;
};
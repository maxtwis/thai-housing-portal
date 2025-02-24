import { supabase } from './supabaseClient';

// Cache for fetched policy data
const policyCache = {};

export const getPolicyData = async (geoId = null) => {
  const cacheKey = `policy_${geoId || 'all'}`;
  
  if (policyCache[cacheKey]) {
    return policyCache[cacheKey];
  }
  
  try {
    // Fetch from Supabase
    let query = supabase.from('policy_data').select('*');
    
    if (geoId) {
      // Include both province-specific policies and nationwide policies (geo_id = 99)
      query = query.or(`geo_id.eq.${geoId},geo_id.eq.99`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching policy data:', error);
      return [];
    }
    
    // Format data to match expected structure
    const formattedData = data.map(item => ({
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
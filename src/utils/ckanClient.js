// utils/ckanClient.js

/**
 * Make a request to the CKAN API via proxy
 * @param {string} action - The CKAN API action
 * @param {object} params - Parameters to send
 * @returns {Promise} - Promise resolving to response data
 */
const ckanApiRequest = async (action, params = {}) => {
  try {
    const response = await fetch(`/api/ckan-proxy?action=${action}`, {
      method: 'POST',  // Always use POST
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Unknown CKAN API error');
    }
    
    return data.result;
  } catch (error) {
    console.error(`Error in CKAN API (${action}):`, error);
    throw error;
  }
};
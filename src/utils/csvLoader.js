import Papa from 'papaparse';

/**
 * Generic CSV loader utility
 * @param {string} filePath - Path to CSV file relative to public folder
 * @returns {Promise<Array>} Parsed CSV data as array of objects
 */
export const loadCSV = async (filePath) => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${filePath}`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error loading CSV:', error);
    throw error;
  }
};

/**
 * Load and create lookup map from CSV
 * @param {string} filePath - Path to CSV file
 * @param {string} keyField - Field to use as key
 * @param {string} valueField - Field to use as value
 * @returns {Promise<Object>} Lookup map
 */
export const loadLookupMap = async (filePath, keyField, valueField) => {
  const data = await loadCSV(filePath);
  const lookupMap = {};

  data.forEach(row => {
    if (row[keyField] !== undefined && row[keyField] !== null) {
      lookupMap[row[keyField]] = row[valueField];
    }
  });

  return lookupMap;
};

/**
 * Load multiple CSV files in parallel
 * @param {Array<string>} filePaths - Array of file paths
 * @returns {Promise<Array>} Array of parsed CSV data
 */
export const loadMultipleCSVs = async (filePaths) => {
  return Promise.all(filePaths.map(path => loadCSV(path)));
};

import React, { useState } from 'react';

const ExportButton = ({ data, filename = 'export', format = 'csv' }) => {
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }
    
    setIsExporting(true);
    
    try {
      let exportData, mimeType, extension;
      
      // Format data according to export type
      if (format === 'csv') {
        // Convert data to CSV
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(','));
        exportData = [headers, ...rows].join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      } else if (format === 'json') {
        // Convert data to JSON
        exportData = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Create and download the file
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${extension}`;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      setIsExporting(false);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
      setIsExporting(false);
    }
  };
  
  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {isExporting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export {format.toUpperCase()}
        </>
      )}
    </button>
  );
};

export default ExportButton;
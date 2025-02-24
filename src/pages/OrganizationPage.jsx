import React, { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink, Database, Clock, MapPin, Building, Users } from 'lucide-react';
import Papa from 'papaparse';

// Example organizations data structure
const organizationsData = {
  'aamgroup': {
    name: "AAMGroup",
    description: "AAM is a geospatial service company offering geospatial services and data including land surveying, aerial mapping, and the integration and implementation of Geographic...",
    type: "private",
    datasets: [
      {
        id: 1,
        title: "3D Building Models",
        description: "Three-dimensional, spatially accurate representation of buildings from various locations across Australia and New Zealand.",
        format: "CSV",
        tags: ["3D Building Model", "Buildings", "National"],
        updatedAt: "2024-02-24"
      }
    ]
  },
  'act-government': {
    name: "ACT Government",
    description: "Australian Capital Territory Government datasets",
    type: "government",
    datasets: [
      {
        id: 1,
        title: "Housing Policy Initiatives",
        description: "Current and planned housing policy initiatives in the ACT region.",
        format: "CSV",
        tags: ["Policy", "Housing", "ACT"],
        updatedAt: "2024-02-20"
      },
      {
        id: 2,
        title: "Residential Land Release",
        description: "Details of residential land releases in the ACT.",
        format: "CSV",
        tags: ["Land", "Housing", "Development"],
        updatedAt: "2024-02-22"
      },
      {
        id: 3,
        title: "Building Approvals",
        description: "Building approval data for residential developments.",
        format: "CSV",
        tags: ["Buildings", "Approvals", "Development"],
        updatedAt: "2024-02-23"
      },
      {
        id: 4,
        title: "Housing Strategy Outcomes",
        description: "Monitoring and reporting of housing strategy outcomes.",
        format: "CSV",
        tags: ["Housing", "Policy", "Outcomes"],
        updatedAt: "2024-02-24"
      }
    ]
  },
  'abs': {
    name: "Australian Bureau of Statistics",
    description: "National statistics and data collection agency of Australia",
    type: "government",
    datasets: [
      {
        id: 1,
        title: "Population Statistics",
        description: "Demographic data and population statistics.",
        format: "CSV",
        tags: ["Demographics", "Population", "National"],
        updatedAt: "2024-02-24"
      },
      {
        id: 2,
        title: "Housing Occupancy",
        description: "Housing occupancy and utilization statistics.",
        format: "CSV",
        tags: ["Housing", "Occupancy", "National"],
        updatedAt: "2024-02-23"
      }
    ]
  }
};

const OrganizationPage = ({ orgId }) => {
  const [activeTab, setActiveTab] = useState('datasets');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('relevance');

  // Get organization data
  const organization = organizationsData[orgId] || organizationsData['aamgroup'];

  // Get organization icon based on type
  const getOrganizationIcon = (type) => {
    switch (type) {
      case 'government':
        return Building;
      case 'private':
        return Database;
      default:
        return Building;
    }
  };

  const handleDatasetPreview = async (dataset) => {
    setSelectedDataset(dataset);
    setLoading(true);

    try {
      const response = await window.fs.readFile(`${dataset.title.toLowerCase().replace(/\s+/g, '-')}.csv`, { encoding: 'utf8' });
      
      Papa.parse(response, {
        header: true,
        complete: (results) => {
          setPreviewData({
            headers: results.meta.fields,
            rows: results.data.slice(0, 10)
          });
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    } catch (error) {
      console.error('Error reading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (dataset) => {
    try {
      const response = await window.fs.readFile(`${dataset.title.toLowerCase().replace(/\s+/g, '-')}.csv`, { encoding: 'utf8' });
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset.title}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Filter and sort datasets
  const filteredDatasets = organization.datasets
    .filter(dataset => 
      dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'latest':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        default:
          return 0;
      }
    });

  const OrganizationIcon = getOrganizationIcon(organization.type);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Organization Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
              <OrganizationIcon size={32} className="text-gray-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{organization.name}</h1>
              <p className="text-gray-600 mt-2">{organization.description}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <div className="flex items-center mr-4">
                  <Database size={16} className="mr-1" />
                  {organization.datasets.length} Datasets
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="mr-1" />
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-6">
            <button 
              className={`px-4 py-4 font-medium ${activeTab === 'datasets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('datasets')}
            >
              Datasets ({organization.datasets.length})
            </button>
            <button 
              className={`px-4 py-4 font-medium ${activeTab === 'activity' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity Stream
            </button>
            <button 
              className={`px-4 py-4 font-medium ${activeTab === 'about' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'datasets' && (
          <div>
            {/* Search and Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search datasets..."
                  className="px-4 py-2 border rounded-lg w-full max-w-lg"
                />
                <select 
                  className="px-4 py-2 border rounded-lg ml-4"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="latest">Last Modified</option>
                </select>
              </div>
            </div>

            {/* Dataset List */}
            <div className="space-y-6">
              {filteredDatasets.map((dataset) => (
                <div key={dataset.id} className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{dataset.title}</h3>
                    <p className="text-gray-600 mb-4">{dataset.description}</p>
                    
                    {/* Dataset Metadata */}
                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FileText size={16} className="mr-1" />
                        <span>{dataset.format}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={16} className="mr-1" />
                        <span>Updated {dataset.updatedAt}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {dataset.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleDatasetPreview(dataset)}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink size={16} className="mr-1" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownload(dataset)}
                        className="flex items-center text-green-600 hover:text-green-800"
                      >
                        <Download size={16} className="mr-1" />
                        Download
                      </button>
                    </div>
                  </div>

                  {/* Preview Panel */}
                  {selectedDataset?.id === dataset.id && previewData && (
                    <div className="border-t p-6">
                      <h4 className="font-semibold mb-4">Data Preview</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {previewData.headers.map((header) => (
                                <th
                                  key={header}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {previewData.rows.map((row, index) => (
                              <tr key={index}>
                                {previewData.headers.map((header) => (
                                  <td
                                    key={header}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                  >
                                    {row[header]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <p className="text-gray-600">Activity stream will be displayed here</p>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">About {organization.name}</h2>
            <div className="prose max-w-none">
              <p>{organization.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationPage;
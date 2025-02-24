import React, { useState } from 'react';
import ExportButton from '../ExportButton';

const PolicyTable = ({ policies, provinceName }) => {
  const [expandedPolicy, setExpandedPolicy] = useState(null);
  
  if (!policies || policies.length === 0) {
    return (
      <div className="bg-white p-0 rounded-lg shadow">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-800">Housing Policies</h2>
            <ExportButton data={[]} filename={`policies_${provinceName}`} />
          </div>
        </div>
        <div className="px-4 py-8 flex items-center justify-center">
          <p className="text-gray-500">No policy data available for this province</p>
        </div>
      </div>
    );
  }
  
  // Status badge color mapping
  const statusColors = {
    'Active': 'bg-green-100 text-green-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Inactive': 'bg-gray-100 text-gray-800'
  };
  
  // Policy type (3S Model) color mapping
  const policyTypeColors = {
    'S1: Supply': 'bg-blue-100 text-blue-800',
    'S2: Subsidy': 'bg-purple-100 text-purple-800',
    'S3: Stability': 'bg-indigo-100 text-indigo-800',
    'SC: Social Capital': 'bg-pink-100 text-pink-800'
  };
  
  // Handle rendering policy types that might have multiple values
  const renderPolicyType = (policyType) => {
    if (!policyType) return null;
    
    // If there are multiple policy types separated by commas
    const types = policyType.split(',').map(type => type.trim());
    
    return (
      <div className="flex flex-wrap gap-1">
        {types.map((type, index) => {
          // Find the base type (S1, S2, S3, SC)
          const baseType = type.split(':')[0].trim();
          const colorClass = policyTypeColors[type] || 
                           policyTypeColors[`${baseType}: ${baseType === 'S1' ? 'Supply' : 
                                            baseType === 'S2' ? 'Subsidy' : 
                                            baseType === 'S3' ? 'Stability' : 'Social Capital'}`] || 
                           'bg-gray-100 text-gray-800';
          
          return (
            <span 
              key={index} 
              className={`px-2 py-1 rounded-md text-xs font-medium ${colorClass}`}
            >
              {baseType}
            </span>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="bg-white p-0 rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">Housing Policies</h2>
          <ExportButton data={policies} filename={`policies_${provinceName}`} />
        </div>
      </div>
      
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Project</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Ministry/Dept.</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.map((policy, index) => (
                <React.Fragment key={index}>
                  <tr 
                    className={`hover:bg-gray-50 cursor-pointer ${expandedPolicy === index ? 'bg-blue-50' : ''}`}
                    onClick={() => setExpandedPolicy(expandedPolicy === index ? null : index)}
                  >
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">
                      <div className="flex">
                        <span className={`mr-2 flex-shrink-0 ${expandedPolicy === index ? 'transform rotate-90' : ''} transition-transform duration-200`}>
                          ▶
                        </span>
                        <div className="break-words break-all">
                          {policy.Project || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500 max-w-[150px]">
                      <div className="truncate">{policy["Ministry (if applicable)"] || "N/A"}</div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {renderPolicyType(policy["3S Model"])}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {policy.Status ? (
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[policy.Status] || 'bg-gray-100'}`}>
                          {policy.Status}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded policy details */}
                  {expandedPolicy === index && (
                    <tr className="bg-gray-50">
                      <td colSpan="4" className="px-4 py-3 text-sm text-gray-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-500">Ministry</p>
                              <p className="text-sm">{policy["Ministry (if applicable)"] || "N/A"}</p>
                            </div>
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-500">Department(s)</p>
                              <p className="text-sm whitespace-pre-line">{policy["Department(s)"] || "N/A"}</p>
                            </div>
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-500">Joint Organization</p>
                              <p className="text-sm">{policy["Joint Org. (If applicable)"] || "N/A"}</p>
                            </div>
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-500">Year</p>
                              <p className="text-sm">{policy.Year || "N/A"}</p>
                            </div>
                          </div>
                          <div>
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-500">Annual Budget</p>
                              <p className="text-sm">{policy["Annual Budget"] || "N/A"}</p>
                            </div>
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-500">Synopsis</p>
                              <p className="text-sm whitespace-pre-line">{policy.Synopsis || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">KPI</p>
                              <p className="text-sm">{policy.KPI || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-200">
        <p>Source: National Housing Authority of Thailand</p>
      </div>
    </div>
  );
};

export default PolicyTable;
import React, { useState } from 'react';
import { Search, Database } from 'lucide-react';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/housing-profile?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Organizations with their dataset counts
  const organizations = [
    {
      name: "ACT Government",
      nameEn: "ACT Government",
      datasets: 4,
      description: "Australian Capital Territory Government datasets"
    },
    {
      name: "AHDAP",
      nameEn: "Australian Housing Data Analytics Platform",
      datasets: 5,
      description: "Australian Housing Data Analytics Platform datasets"
    },
    {
      name: "Australian Bureau of Statistics",
      nameEn: "Australian Bureau of Statistics",
      datasets: 11,
      description: "National statistics and data"
    },
    {
      name: "AAMGroup",
      nameEn: "AAM Group",
      datasets: 1,
      description: "AAM is a geospatial service company offering geospatial services and data"
    },
    {
      name: "City of Melbourne",
      nameEn: "City of Melbourne",
      datasets: 5,
      description: "Local government for the City of Melbourne"
    }
  ];

  // Function to generate organization URL
  const getOrgUrl = (org) => {
    const urlName = org.nameEn || org.name;
    return `/organisations/${urlName.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const handleOrgClick = (org) => {
    window.location.href = getOrgUrl(org);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">
            Thailand Housing Data Portal
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            แพลตฟอร์มข้อมูลและการวิเคราะห์ที่อยู่อาศัยเชิงพื้นที่
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาข้อมูล หรือ องค์กร..."
                className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 p-1 rounded-md bg-blue-600 text-white"
              >
                <Search size={24} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Organizations Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">องค์กรที่ร่วมให้ข้อมูล</h2>
            <span className="text-gray-600">{organizations.length} องค์กร</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleOrgClick(org.name)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{org.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{org.description}</p>
                    <div className="flex items-center text-sm text-blue-600">
                      <Database size={16} className="mr-2" />
                      <span>{org.datasets} {org.datasets === 1 ? 'Dataset' : 'Datasets'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-blue-800">24</h3>
            <p className="text-gray-600">องค์กรที่ร่วมให้ข้อมูล</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-green-800">103</h3>
            <p className="text-gray-600">ชุดข้อมูล</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-purple-800">4</h3>
            <p className="text-gray-600">จังหวัดหลัก</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-gray-600">
          <p className="mb-2">
            แพลตฟอร์มนี้ได้รับการสนับสนุนทุนวิจัยจากหน่วยบริหารและจัดการทุนด้านการพัฒนาระดับพื้นที่ (บพท.)
          </p>
          <p className="text-sm">
            กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม (อว.)
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
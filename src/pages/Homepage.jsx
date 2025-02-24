import React, { useState } from 'react';
import { Search, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const Homepage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/housing-profile?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Updated organizations with Thai data providers and datasets
  const organizations = [
    {
      name: "สำนักงานสถิติแห่งชาติ",
      nameEn: "National Statistical Office",
      datasets: 8,
      logoSrc: "/images/logos/nso-logo.png",
      dataFiles: [
        { name: "ข้อมูลประชากรรายจังหวัด (CSV)", file: "population-by-province-2023.csv" },
        { name: "ข้อมูลครัวเรือนรายจังหวัด (CSV)", file: "households-by-province-2023.csv" },
        { name: "การสำรวจที่อยู่อาศัย (CSV)", file: "housing-survey-2023.csv" }
      ]
    },
    {
      name: "การเคหะแห่งชาติ",
      nameEn: "National Housing Authority",
      datasets: 6,
      logoSrc: "/images/logos/nha-logo.png",
      dataFiles: [
        { name: "โครงการที่อยู่อาศัยรายจังหวัด (CSV)", file: "housing-projects-by-province-2023.csv" },
        { name: "ราคาที่อยู่อาศัยเฉลี่ย (CSV)", file: "average-housing-prices-2023.csv" }
      ]
    },
    {
      name: "กรมที่ดิน",
      nameEn: "Land Department",
      datasets: 5,
      logoSrc: "/images/logos/dol-logo.png",
      dataFiles: [
        { name: "การจดทะเบียนที่ดินรายเดือน (CSV)", file: "land-registration-monthly-2023.csv" },
        { name: "การโอนกรรมสิทธิ์ (CSV)", file: "property-transfers-2023.csv" }
      ]
    },
    {
      name: "กรมธนารักษ์",
      nameEn: "Treasury Department",
      datasets: 4,
      logoSrc: "/images/logos/treasury-logo.png",
      dataFiles: [
        { name: "ราคาประเมินที่ดินรายจังหวัด (CSV)", file: "land-appraisal-by-province-2023.csv" },
        { name: "ข้อมูลการเช่าที่ดินราชพัสดุ (CSV)", file: "state-property-rental-2023.csv" }
      ]
    },
    {
      name: "ธนาคารแห่งประเทศไทย",
      nameEn: "Bank of Thailand",
      datasets: 5,
      logoSrc: "/images/logos/bot-logo.png",
      dataFiles: [
        { name: "สินเชื่อที่อยู่อาศัย (CSV)", file: "housing-loans-2023.csv" },
        { name: "ดัชนีราคาที่อยู่อาศัย (CSV)", file: "housing-price-index-2023.csv" }
      ]
    },
    {
      name: "สำนักงานพัฒนารัฐบาลดิจิทัล",
      nameEn: "Digital Government Development Agency",
      datasets: 3,
      logoSrc: "/images/logos/dga-logo.png",
      dataFiles: [
        { name: "งบประมาณด้านที่อยู่อาศัย (CSV)", file: "housing-budget-allocation-2023.csv" },
        { name: "โครงการภาครัฐด้านที่อยู่อาศัย (CSV)", file: "government-housing-projects-2023.csv" }
      ]
    }
  ];

  // Featured provinces
  const featuredProvinces = [
    { id: 10, name: "กรุงเทพมหานคร", population: "5.52 ล้านคน", housing: "2.34 ล้านหน่วย" },
    { id: 50, name: "เชียงใหม่", population: "1.78 ล้านคน", housing: "682,000 หน่วย" },
    { id: 40, name: "ขอนแก่น", population: "1.8 ล้านคน", housing: "634,000 หน่วย" },
    { id: 90, name: "สงขลา", population: "1.43 ล้านคน", housing: "512,000 หน่วย" }
  ];

  const handleProvinceClick = (provinceId) => {
    window.location.href = `/housing-profile?province=${provinceId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative text-white"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.75)), url("/images/home-header.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">
            Thai Housing Data Portal
          </h1>
          <p className="text-xl mb-8 text-gray-200">
            แพลตฟอร์มข้อมูลและการวิเคราะห์ที่อยู่อาศัยเชิงพื้นที่
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาข้อมูล จังหวัด หรือ นโยบาย..."
                className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 p-1 rounded-md bg-gray-700 text-white"
              >
                <Search size={24} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Data Providers */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">หน่วยงานที่ให้ข้อมูล</h2>
            <span className="text-gray-600">{organizations.length} หน่วยงาน</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                onClick={() => window.location.href = `/organization/${org.nameEn.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <img 
                      src={org.logoSrc} 
                      alt={`${org.name} logo`}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{org.name}</h3>
                    <p className="text-xs text-gray-500 mb-1">{org.nameEn}</p>
                    <div className="flex items-center text-sm text-blue-600">
                      <Database size={16} className="mr-2" />
                      <span>{org.datasets} ชุดข้อมูล</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-2xl font-bold text-blue-600">6</h3>
            <p className="text-gray-700 font-medium">หน่วยงานที่ร่วมให้ข้อมูล</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-2xl font-bold text-blue-600">28</h3>
            <p className="text-gray-700 font-medium">ชุดข้อมูล</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-2xl font-bold text-blue-600">4</h3>
            <p className="text-gray-700 font-medium">จังหวัดหลัก</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-gray-600">
          <p className="mb-2">
            
          </p>
          <p className="text-sm">
            
          </p>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
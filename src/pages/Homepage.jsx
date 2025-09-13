import React, { useState } from 'react';
import { Search, TrendingUp, BarChart3, MapPin, ArrowRight, Home, Building, Truck, Database, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { provinces } from '../utils/dataUtils';

const Homepage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const trimmedQuery = searchQuery.trim();

      // Try to match the search query with province names (exact match first, then partial)
      const exactMatch = provinces.find(province =>
        province.name === trimmedQuery
      );

      const partialMatch = provinces.find(province =>
        province.name.includes(trimmedQuery) ||
        trimmedQuery.includes(province.name)
      );

      const matchedProvince = exactMatch || partialMatch;

      if (matchedProvince) {
        // If we found a matching province, navigate with the province ID
        window.location.href = `/housing-profile?province=${matchedProvince.id}&search=${encodeURIComponent(searchQuery)}`;
      } else {
        // If no province match, use default search
        window.location.href = `/housing-profile?search=${encodeURIComponent(searchQuery)}`;
      }
    }
  };

  // Main dashboard functions
  const mainFunctions = [
    {
      icon: Home,
      title: "Housing Profile",
      titleTh: "โปรไฟล์ที่อยู่อาศัย",
      description: "Comprehensive housing data analysis and provincial insights",
      descriptionTh: "วิเคราะห์ข้อมูลที่อยู่อาศัยและข้อมูลเชิงลึกระดับจังหวัด",
      link: "/housing-profile",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Building,
      title: "Housing Stock",
      titleTh: "สต็อกที่อยู่อาศัย",
      description: "Housing supply analysis and apartment market data",
      descriptionTh: "วิเคราะห์อุปทานที่อยู่อาศัยและข้อมูลตลาดอพาร์ตเมนต์",
      link: "/apartment-supply",
      color: "from-teal-500 to-teal-600"
    },
    {
      icon: Truck,
      title: "Housing Delivery System",
      titleTh: "ระบบการจัดการที่อยู่อาศัย",
      description: "Housing development and delivery system analytics",
      descriptionTh: "วิเคราะห์การพัฒนาและระบบการจัดการที่อยู่อาศัย",
      link: "/housing-delivery-system",
      color: "from-purple-500 to-purple-600"
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Unified Premium Hero & CKAN Section */}
      <div
        className="relative text-white overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.85) 30%, rgba(51, 65, 85, 0.8) 60%, rgba(71, 85, 105, 0.75) 100%), url("/images/home-header.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Advanced Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/15 to-teal-600/20 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/30"></div>

        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-teal-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-purple-500/25 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12 animate-fade-in-up">
              <h1 className="text-5xl lg:text-7xl font-black mb-6 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent leading-relaxed py-4 px-2">
                Thai Housing Data Portal
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-teal-500 mx-auto rounded-full mb-8 shadow-lg shadow-blue-500/50"></div>
              <p className="text-xl lg:text-2xl text-blue-100 font-light leading-relaxed">
                แพลตฟอร์มข้อมูลและการวิเคราะห์ที่อยู่อาศัยเชิงพื้นที่
              </p>
            </div>

            {/* Premium Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-teal-500/30 rounded-2xl blur-xl group-hover:blur-2xl group-hover:from-blue-500/40 group-hover:to-teal-500/40 transition-all duration-500"></div>
                <div className="relative bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-2 shadow-2xl">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาข้อมูลในจังหวัด"
                    className="w-full px-6 py-4 bg-transparent text-white placeholder-blue-200 text-lg focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    <Search size={24} />
                  </button>
                </div>
              </div>
            </form>

            {/* Main Function Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              {mainFunctions.map((func, index) => {
                const Icon = func.icon;
                return (
                  <Link
                    key={index}
                    to={func.link}
                    className="group p-8 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center text-center shadow-2xl hover:shadow-blue-500/25"
                  >
                    <div className={`mb-6 p-4 bg-gradient-to-r ${func.color} rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon size={28} className="text-white" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">{func.title}</h3>
                    <p className="text-blue-200 text-base mb-4">{func.titleTh}</p>
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform opacity-70 group-hover:opacity-100" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Premium Divider with Animation */}
          <div className="relative max-w-4xl mx-auto mb-16 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent blur-sm"></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full shadow-lg shadow-blue-400/50"></div>
          </div>

          {/* CKAN Database Connection - Integrated Design */}
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up" style={{animationDelay: '0.8s'}}>
            <div className="relative group">
              {/* Premium Background with Glass Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-teal-500/10 rounded-3xl"></div>

              {/* Animated Border Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-teal-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>

              <div className="relative z-10 p-12">
                {/* Enhanced Header */}
                <div className="flex items-center justify-center gap-6 mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl blur-lg opacity-75"></div>
                    <div className="relative p-4 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl shadow-xl">
                      <Database size={32} className="text-white" />
                    </div>
                  </div>
                  <div className="text-left">
                    <h2 className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      CKAN Data Portal
                    </h2>
                    <p className="text-blue-200 text-lg font-medium">
                      ระบบฐานข้อมูลเปิดด้านที่อยู่อาศัย
                    </p>
                  </div>
                </div>

                <p className="text-lg text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
                  ข้อมูลทั้งหมดในระบบเชื่อมโยงกับฐานข้อมูล CKAN<br />
                  ภายใต้การสนับสนุนของ สำนักงานพัฒนารัฐบาลดิจิทัล (DGA)
                </p>

                {/* Premium CTA Button */}
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-all duration-300"></div>
                  <a
                    href="http://147.50.228.205/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold text-lg rounded-2xl hover:from-blue-700 hover:to-teal-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl hover:shadow-blue-500/50 group"
                  >
                    <span>เข้าสู่ระบบฐานข้อมูล CKAN</span>
                    <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Floating Elements */}
        <div className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-br from-blue-400/30 to-teal-400/30 rounded-full blur-xl animate-bounce shadow-2xl shadow-blue-400/20" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute bottom-32 right-10 w-20 h-20 bg-gradient-to-br from-purple-400/25 to-pink-400/25 rounded-full blur-xl animate-bounce shadow-2xl shadow-purple-400/20" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        <div className="absolute top-1/3 right-20 w-16 h-16 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-full blur-xl animate-bounce shadow-2xl shadow-teal-400/20" style={{animationDelay: '3s', animationDuration: '6s'}}></div>

        {/* Bottom Fade Effect */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </div>
    </div>
  );
};

export default Homepage;
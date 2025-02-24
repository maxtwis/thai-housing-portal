import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileBarChart, Users, Home, MapPin } from 'lucide-react';
import { provinces } from '../utils/dataUtils';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/housing-profile?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Feature cards with real data
  const featureCards = [
    {
      title: "ข้อมูลประชากรและที่อยู่อาศัย",
      description: "ข้อมูลแนวโน้มประชากร ครัวเรือน และรายได้ในระดับจังหวัด",
      icon: Users,
      stats: "4 จังหวัดหลัก",
      color: "bg-blue-50 text-blue-700"
    },
    {
      title: "วิเคราะห์นโยบายที่อยู่อาศัย",
      description: "การวิเคราะห์นโยบายตามกรอบแนวคิดโมเดล 3S",
      icon: FileBarChart,
      stats: "103 นโยบาย",
      color: "bg-green-50 text-green-700"
    },
    {
      title: "สถานการณ์อาคารและสิ่งปลูกสร้าง",
      description: "ข้อมูลอาคารและสิ่งปลูกสร้างรายแปลง",
      icon: Home,
      stats: "30,009 อาคาร",
      color: "bg-purple-50 text-purple-700"
    }
  ];

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
                placeholder="ค้นหาข้อมูล (เช่น ประชากร, ที่อยู่อาศัย)"
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
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {featureCards.map((card, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className={`inline-block p-3 rounded-lg ${card.color} mb-4`}>
                <card.icon size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
              <p className="text-gray-600 mb-4">{card.description}</p>
              <div className="text-2xl font-bold text-blue-600">{card.stats}</div>
            </div>
          ))}
        </div>

        {/* Provinces Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">พื้นที่ศึกษา</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {provinces.map(province => (
              <div 
                key={province.id} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/housing-profile?province=${province.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{province.name}</h3>
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin size={16} className="mr-1" />
                      <span>Lat: {province.lat.toFixed(4)}, Lon: {province.lon.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">การวิเคราะห์เชิงพื้นที่</h3>
            <p className="text-gray-600 mb-4">
              สำรวจและวิเคราะห์ข้อมูลอาคารและสิ่งปลูกสร้างในระดับพื้นที่ ทั้งด้านการใช้ประโยชน์ 
              การเข้าถึงสาธารณูปการ และความหนาแน่น
            </p>
            <button 
              onClick={() => navigate('/housing-stock')}
              className="text-blue-600 font-medium hover:text-blue-800"
            >
              เริ่มต้นวิเคราะห์ →
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">สถานการณ์ที่อยู่อาศัย</h3>
            <p className="text-gray-600 mb-4">
              ติดตามสถานการณ์ที่อยู่อาศัยผ่านตัวชี้วัดสำคัญ ทั้งด้านประชากร ครัวเรือน 
              รายได้ และอุปทานที่อยู่อาศัย
            </p>
            <button 
              onClick={() => navigate('/housing-profile')}
              className="text-blue-600 font-medium hover:text-blue-800"
            >
              ดูรายละเอียด →
            </button>
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
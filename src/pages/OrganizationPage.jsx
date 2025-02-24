import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Download, ExternalLink, Database, Clock, MapPin } from 'lucide-react';

const OrganizationPage = () => {
  const { orgId } = useParams();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real app, this would be fetched from an API
    const fetchOrganization = () => {
      setLoading(true);
      
      try {
        // This is mock data - in a real app, you'd fetch from an API or Supabase
        const organizations = [
          {
            id: "national-statistical-office",
            name: "สำนักงานสถิติแห่งชาติ",
            nameEn: "National Statistical Office",
            description: "หน่วยงานด้านสถิติของประเทศไทย ให้บริการข้อมูลสถิติพื้นฐานระดับประเทศและจังหวัด",
            logoSrc: "/images/logos/nso-logo.png",
            datasets: [
              {
                id: 1,
                title: "ข้อมูลประชากรรายจังหวัด",
                description: "ข้อมูลสถิติประชากรรายจังหวัดทั่วประเทศ ปี 2566",
                format: "CSV",
                lastUpdated: "2023-12-15",
                fileName: "population-by-province-2023.csv",
                fileSize: "2.3 MB"
              },
              {
                id: 2,
                title: "ข้อมูลครัวเรือนรายจังหวัด",
                description: "ข้อมูลจำนวนครัวเรือนรายจังหวัดทั่วประเทศ ปี 2566",
                format: "CSV",
                lastUpdated: "2023-12-15",
                fileName: "households-by-province-2023.csv",
                fileSize: "1.8 MB"
              },
              {
                id: 3,
                title: "การสำรวจที่อยู่อาศัย",
                description: "ข้อมูลการสำรวจภาวะเศรษฐกิจและสังคมของครัวเรือน ด้านที่อยู่อาศัย ปี 2566",
                format: "CSV",
                lastUpdated: "2023-11-30",
                fileName: "housing-survey-2023.csv",
                fileSize: "3.5 MB"
              }
            ]
          },
          {
            id: "national-housing-authority",
            name: "การเคหะแห่งชาติ",
            nameEn: "National Housing Authority",
            description: "หน่วยงานรัฐวิสาหกิจด้านการพัฒนาที่อยู่อาศัยของประเทศไทย",
            logoSrc: "/images/logos/nha-logo.png",
            datasets: [
              {
                id: 1,
                title: "โครงการที่อยู่อาศัยรายจังหวัด",
                description: "ข้อมูลโครงการที่อยู่อาศัยของการเคหะแห่งชาติรายจังหวัด",
                format: "CSV",
                lastUpdated: "2023-12-10",
                fileName: "housing-projects-by-province-2023.csv",
                fileSize: "1.2 MB"
              },
              {
                id: 2,
                title: "ราคาที่อยู่อาศัยเฉลี่ย",
                description: "ข้อมูลราคาที่อยู่อาศัยเฉลี่ยรายจังหวัด ปี 2566",
                format: "CSV",
                lastUpdated: "2023-12-01",
                fileName: "average-housing-prices-2023.csv",
                fileSize: "950 KB"
              }
            ]
          },
          {
            id: "land-department",
            name: "กรมที่ดิน",
            nameEn: "Land Department",
            description: "หน่วยงานรัฐที่ดูแลด้านการออกเอกสารสิทธิ์และทะเบียนที่ดิน",
            logoSrc: "/images/logos/dol-logo.png",
            datasets: [
              {
                id: 1,
                title: "การจดทะเบียนที่ดินรายเดือน",
                description: "ข้อมูลการจดทะเบียนที่ดินประเภทต่างๆ รายเดือน ปี 2566",
                format: "CSV",
                lastUpdated: "2023-12-05",
                fileName: "land-registration-monthly-2023.csv",
                fileSize: "1.5 MB"
              },
              {
                id: 2,
                title: "การโอนกรรมสิทธิ์",
                description: "ข้อมูลการโอนกรรมสิทธิ์ที่ดินและอสังหาริมทรัพย์ ปี 2566",
                format: "CSV",
                lastUpdated: "2023-11-25",
                fileName: "property-transfers-2023.csv",
                fileSize: "2.1 MB"
              }
            ]
          },
          {
            id: "treasury-department",
            name: "กรมธนารักษ์",
            nameEn: "Treasury Department",
            description: "หน่วยงานที่ดูแลทรัพย์สินของรัฐและประเมินราคาที่ดิน",
            logoSrc: "/images/logos/treasury-logo.png",
            datasets: [
              {
                id: 1,
                title: "ราคาประเมินที่ดินรายจังหวัด",
                description: "ข้อมูลราคาประเมินที่ดินรายจังหวัด ปี 2566-2570",
                format: "CSV",
                lastUpdated: "2023-11-20",
                fileName: "land-appraisal-by-province-2023.csv",
                fileSize: "3.2 MB"
              },
              {
                id: 2,
                title: "ข้อมูลการเช่าที่ดินราชพัสดุ",
                description: "ข้อมูลการเช่าที่ดินราชพัสดุเพื่อที่อยู่อาศัย ปี 2566",
                format: "CSV",
                lastUpdated: "2023-11-15",
                fileName: "state-property-rental-2023.csv",
                fileSize: "1.1 MB"
              }
            ]
          },
          {
            id: "bank-of-thailand",
            name: "ธนาคารแห่งประเทศไทย",
            nameEn: "Bank of Thailand",
            description: "ธนาคารกลางของประเทศไทย ผู้ให้ข้อมูลด้านสินเชื่อและราคาอสังหาริมทรัพย์",
            logoSrc: "/images/logos/bot-logo.png",
            datasets: [
              {
                id: 1,
                title: "สินเชื่อที่อยู่อาศัย",
                description: "ข้อมูลสินเชื่อที่อยู่อาศัยส่วนบุคคลทั่วประเทศ ปี 2566",
                format: "CSV",
                lastUpdated: "2023-12-10",
                fileName: "housing-loans-2023.csv",
                fileSize: "1.7 MB"
              },
              {
                id: 2,
                title: "ดัชนีราคาที่อยู่อาศัย",
                description: "ดัชนีราคาที่อยู่อาศัยรายไตรมาส ปี 2566",
                format: "CSV",
                lastUpdated: "2023-12-05",
                fileName: "housing-price-index-2023.csv",
                fileSize: "850 KB"
              }
            ]
          },
          {
            id: "digital-government-development-agency",
            name: "สำนักงานพัฒนารัฐบาลดิจิทัล",
            nameEn: "Digital Government Development Agency",
            description: "หน่วยงานที่ให้ข้อมูลการใช้จ่ายงบประมาณที่เกี่ยวข้องกับที่อยู่อาศัย",
            logoSrc: "/images/logos/dga-logo.png",
            datasets: [
              {
                id: 1,
                title: "งบประมาณด้านที่อยู่อาศัย",
                description: "ข้อมูลการจัดสรรงบประมาณด้านที่อยู่อาศัยของรัฐบาล ปีงบประมาณ 2566",
                format: "CSV",
                lastUpdated: "2023-11-10",
                fileName: "housing-budget-allocation-2023.csv",
                fileSize: "1.3 MB"
              },
              {
                id: 2,
                title: "โครงการภาครัฐด้านที่อยู่อาศัย",
                description: "ข้อมูลโครงการภาครัฐด้านที่อยู่อาศัยทั่วประเทศ ปี 2566",
                format: "CSV",
                lastUpdated: "2023-11-05",
                fileName: "government-housing-projects-2023.csv",
                fileSize: "1.9 MB"
              }
            ]
          }
        ];
        
        const foundOrg = organizations.find(org => org.id === orgId);
        
        if (foundOrg) {
          setOrganization(foundOrg);
        } else {
          setError('ไม่พบข้อมูลหน่วยงาน');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganization();
  }, [orgId]);

  const handleDownload = (fileName) => {
    // In a real app, this would download the actual file
    alert(`กำลังดาวน์โหลดไฟล์: ${fileName}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white p-8 rounded-lg shadow-md flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-lg">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-500 mb-4">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-700">{error || 'ไม่พบข้อมูลหน่วยงาน'}</p>
            <Link to="/" className="mt-6 inline-block text-blue-600 hover:text-blue-800">
              กลับไปยังหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Organization Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-24 h-24 flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <img 
                src={organization.logoSrc} 
                alt={`${organization.name} logo`} 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">{organization.name}</h1>
              <p className="text-gray-500 mb-4">{organization.nameEn}</p>
              <p className="text-gray-700">{organization.description}</p>
            </div>
          </div>
        </div>

        {/* Datasets */}
        <h2 className="text-2xl font-bold mb-4">ชุดข้อมูลที่เปิดเผย</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {organization.datasets.map(dataset => (
            <div key={dataset.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{dataset.title}</h3>
                <p className="text-gray-600 mb-4">{dataset.description}</p>
                
                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FileText size={16} className="mr-1" />
                    <span>{dataset.format}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-1" />
                    <span>อัปเดตล่าสุด {dataset.lastUpdated}</span>
                  </div>
                  <div className="flex items-center">
                    <Database size={16} className="mr-1" />
                    <span>{dataset.fileSize}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={() => handleDownload(dataset.fileName)}
                    className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
                  >
                    <Download size={16} className="mr-2" />
                    ดาวน์โหลด
                  </button>
                  
                  <button
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={16} className="mr-1" />
                    รายละเอียด
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            กลับไปยังหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrganizationPage;
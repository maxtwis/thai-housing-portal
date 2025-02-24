import React from 'react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-800">เกี่ยวกับ Thai Housing Data Portal</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="mb-4">
            Thai Housing Data Portal เป็นแพลตฟอร์มที่พัฒนาขึ้นภายใต้ โครงการการพัฒนาระบบการจัดการที่อยู่อาศัยสำหรับทุกคน 
            กรณีศึกษา เมืองมหานครและเมืองศูนย์กลางเศรษฐกิจ ประเทศไทย สนับสนุนโดยทุนวิจัยจากหน่วยบริหารและจัดการทุนด้านการพัฒนาระดับพื้นที่ (บพท.) กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม (อว.) เพื่อรวบรวมและแสดงข้อมูลด้านที่อยู่อาศัยในประเทศไทย 
            ครอบคลุม 4 พื้นที่ต้นแบบ ได้แก่ กรุงเทพมหานคร เชียงใหม่ ขอนแก่น และสงขลา
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">วัตถุประสงค์</h2>
          <p className="mb-4">
            แพลตฟอร์มนี้มีวัตถุประสงค์เพื่อ:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>รวบรวมและแสดงข้อมูลด้านที่อยู่อาศัยในรูปแบบที่เข้าใจง่าย</li>
            <li>เปรียบเทียบสถานการณ์ที่อยู่อาศัยระหว่างจังหวัดต่างๆ</li>
            <li>ติดตามการเปลี่ยนแปลงด้านประชากร ครัวเรือน และที่อยู่อาศัยตามช่วงเวลา</li>
            <li>วิเคราะห์ความสัมพันธ์ระหว่างรายได้และค่าใช้จ่ายด้านที่อยู่อาศัย</li>
            <li>สนับสนุนการวางแผนและกำหนดนโยบายด้านที่อยู่อาศัย</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">องค์ประกอบของแพลตฟอร์ม</h2>
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">1. Housing Profile</h3>
            <p className="mb-2">
              เครื่องมือสำหรับการวิเคราะห์และแสดงผลข้อมูลด้านที่อยู่อาศัยในระดับจังหวัด ประกอบด้วย:
            </p>
            <ul className="list-disc pl-6 mb-3">
              <li>ข้อมูลประชากรและครัวเรือน</li>
              <li>รายได้ครัวเรือนและค่าใช้จ่ายด้านที่อยู่อาศัย</li>
              <li>ข้อมูลอุปทานที่อยู่อาศัยจำแนกตามประเภท</li>
              <li>นโยบายและโครงการด้านที่อยู่อาศัยของภาครัฐ</li>
              <li>การวิเคราะห์ตามกรอบแนวคิดโมเดล 3S (Supply, Subsidy, Stability)</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">2. Housing Stock</h3>
            <p className="mb-2">
              เครื่องมือสำหรับการวิเคราะห์ข้อมูลสต็อกที่อยู่อาศัยในระดับพื้นที่ย่อย โดยมีคุณสมบัติดังนี้:
            </p>
            <ul className="list-disc pl-6 mb-3">
              <li>แผนที่แสดงตำแหน่งที่ตั้งของอาคารและที่อยู่อาศัย</li>
              <li>การวิเคราะห์ตามประเภทอาคาร จำนวนชั้น และการใช้ประโยชน์</li>
              <li>การวิเคราะห์การเข้าถึงบริการพื้นฐาน เช่น ระบบขนส่งและสถานพยาบาล</li>
              <li>ข้อมูลค่าเช่าและภาระค่าใช้จ่ายด้านที่อยู่อาศัย</li>
              <li>สถิติเชิงพื้นที่เกี่ยวกับอาคารและครัวเรือน</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">3. รายงานและการวิเคราะห์</h3>
            <p className="mb-2">
              ระบบสามารถสร้างรายงานเชิงวิเคราะห์จากข้อมูลที่มี ได้แก่:
            </p>
            <ul className="list-disc pl-6 mb-3">
              <li>รายงานสถานการณ์ที่อยู่อาศัยรายจังหวัด</li>
              <li>การวิเคราะห์แนวโน้มด้านประชากรและที่อยู่อาศัย</li>
              <li>การวิเคราะห์การเข้าถึงที่อยู่อาศัยตามกลุ่มรายได้</li>
              <li>การประเมินประสิทธิภาพของนโยบายด้านที่อยู่อาศัย</li>
            </ul>
          </div>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">ข้อมูลที่นำเสนอ</h2>
          <p className="mb-4">
            Thai Housing Data Portal นำเสนอข้อมูลครอบคลุมหัวข้อต่างๆ ดังนี้:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>จำนวนประชากร</strong> - แสดงการเปลี่ยนแปลงจำนวนประชากรตามช่วงเวลาและกลุ่มอายุ</li>
            <li><strong>จำนวนครัวเรือน</strong> - แสดงการเปลี่ยนแปลงจำนวนครัวเรือนตามช่วงเวลา</li>
            <li><strong>รายได้ครัวเรือน</strong> - แสดงรายได้มัธยฐานของครัวเรือนตามช่วงเวลา</li>
            <li><strong>ที่อยู่อาศัย</strong> - แสดงจำนวนที่อยู่อาศัยตามประเภท เช่น บ้านเดี่ยว ทาวน์เฮ้าส์ อาคารชุด</li>
            <li><strong>ค่าใช้จ่าย</strong> - แสดงค่าใช้จ่ายด้านที่อยู่อาศัยและสาธารณูปโภคตามกลุ่มรายได้</li>
            <li><strong>การเข้าถึงบริการ</strong> - แสดงระยะทางและการเข้าถึงบริการพื้นฐานจากที่อยู่อาศัย</li>
            <li><strong>นโยบาย</strong> - แสดงนโยบายด้านที่อยู่อาศัยและการดำเนินการตามกรอบแนวคิดโมเดล 3S</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">แหล่งข้อมูล</h2>
          <p className="mb-4">
            ข้อมูลที่นำเสนอในแพลตฟอร์มนี้รวบรวมจากแหล่งข้อมูลที่เชื่อถือได้ ได้แก่:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>สำนักงานสถิติแห่งชาติ</li>
            <li>กรมการปกครอง กระทรวงมหาดไทย</li>
            <li>สำนักงานคณะกรรมการพัฒนาการเศรษฐกิจและสังคมแห่งชาติ</li>
            <li>ธนาคารแห่งประเทศไทย</li>
            <li>กรมที่ดิน</li>
            <li>การเคหะแห่งชาติ</li>
            <li>สำนักงานพัฒนารัฐบาลดิจิทัล</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">การพัฒนาแพลตฟอร์ม</h2>
          <p className="mb-4">
            Thai Housing Data Portal พัฒนาโดยทีมนักวิจัยและนักพัฒนาจาก Urban Studies Lab:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Frontend: React, TailwindCSS, Recharts</li>
            <li>Mapping: Mapbox GL</li>
            <li>ฐานข้อมูล: Supabase (API)</li>
            <li>การวิเคราะห์: PapaParse, Lodash</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">การใช้งาน</h2>
          <p className="mb-4">
            ผู้ใช้สามารถ:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>เลือกดูข้อมูลจังหวัดที่สนใจจากเมนูด้านบนหรือแผนที่</li>
            <li>ดูข้อมูลในรูปแบบแผนภูมิที่เข้าใจง่าย</li>
            <li>เปรียบเทียบข้อมูลระหว่างช่วงเวลา</li>
            <li>ดูรายละเอียดเพิ่มเติมโดยชี้ที่แผนภูมิ</li>
            <li>กรองข้อมูลในแผนที่ Housing Stock ตามหลากหลายเงื่อนไข</li>
            <li>สร้างและดาวน์โหลดรายงานสรุปสำหรับแต่ละจังหวัด</li>
            <li>ดาวน์โหลดข้อมูลในรูปแบบ CSV สำหรับการวิเคราะห์เพิ่มเติม</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">ความเป็นส่วนตัวและสิทธิ์ในข้อมูล</h2>
          <p className="mb-4">
            Thai Housing Data Portal นำเสนอข้อมูลเชิงสถิติที่ไม่ระบุตัวตนบุคคล โดยดำเนินการตามแนวทางการคุ้มครองข้อมูลส่วนบุคคลและลิขสิทธิ์ทางปัญญา 
            ผู้ใช้งานสามารถนำข้อมูลไปใช้เพื่อการศึกษาและวิจัยโดยอ้างอิงถึงแหล่งที่มา สำหรับการนำไปใช้ในเชิงพาณิชย์ควรติดต่อเจ้าของข้อมูลต้นฉบับโดยตรง
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">การติดต่อ</h2>
          <p className="mb-4">
            หากมีข้อสงสัยหรือต้องการข้อมูลเพิ่มเติม สามารถติดต่อได้ที่:
          </p>
          <div className="bg-gray-50 p-4 rounded-md">
            <p>E-Mail: t.napat@uslbangkok.com</p>
            <p>โทรศัพท์: +66-2-XXX-XXXX</p>
            <p>ที่อยู่: Urban Studies Lab, กรุงเทพมหานคร ประเทศไทย 10100</p>
            <p className="mt-2">เว็บไซต์: <a href="https://www.uslbangkok.com" className="text-blue-600 hover:underline">www.uslbangkok.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
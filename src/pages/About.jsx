import React from 'react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-800">เกี่ยวกับ Thai Housing Profile</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="mb-4">
            Thai Housing Data Portal เป็นแพลตฟอร์มที่พัฒนาขึ้นเพื่อรวบรวมและแสดงข้อมูลด้านที่อยู่อาศัยในประเทศไทย 
            ครอบคลุม 4 จังหวัดสำคัญ ได้แก่ กรุงเทพมหานคร เชียงใหม่ ขอนแก่น และสงขลา
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
          
          <h2 className="text-xl font-semibold mt-6 mb-3">ข้อมูลที่นำเสนอ</h2>
          <p className="mb-4">
            Thai Housing Profile นำเสนอข้อมูลครอบคลุมหัวข้อต่างๆ ดังนี้:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>จำนวนประชากร</strong> - แสดงการเปลี่ยนแปลงจำนวนประชากรตามช่วงเวลา</li>
            <li><strong>จำนวนครัวเรือน</strong> - แสดงการเปลี่ยนแปลงจำนวนครัวเรือนตามช่วงเวลา</li>
            <li><strong>รายได้ครัวเรือน</strong> - แสดงรายได้มัธยฐานของครัวเรือนตามช่วงเวลา</li>
            <li><strong>ที่อยู่อาศัย</strong> - แสดงจำนวนที่อยู่อาศัยตามประเภท เช่น บ้านเดี่ยว ทาวน์เฮ้าส์ อาคารชุด</li>
            <li><strong>ค่าใช้จ่าย</strong> - แสดงค่าใช้จ่ายด้านที่อยู่อาศัยและสาธารณูปโภคตามกลุ่มรายได้</li>
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
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">การติดต่อ</h2>
          <p className="mb-4">
            หากมีข้อสงสัยหรือต้องการข้อมูลเพิ่มเติม สามารถติดต่อได้ที่:
          </p>
          <div className="bg-gray-50 p-4 rounded-md">
            <p>E-Mail: t.napat@uslbangkok.com</p>
            <p>โทรศัพท์: </p>
            <p>ที่อยู่: กรุงเทพมหานคร ประเทศไทย 10900</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
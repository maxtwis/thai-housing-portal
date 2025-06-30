import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">เกี่ยวกับ Thai Housing Data Portal</h1>
          
          <p className="text-lg text-gray-700 mb-6">
            Thai Housing Data Portal เป็นแพลตฟอร์มข้อมูลที่อยู่อาศัยแบบครบวงจรสำหรับประเทศไทย 
            ที่รวบรวมและนำเสนอข้อมูลสำคัญด้านที่อยู่อาศัย ประชากร และครัวเรือน 
            เพื่อสนับสนุนการวางแผนและการตัดสินใจด้านนโยบายที่อยู่อาศัยในระดับชาติและระดับท้องถิ่น
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">คุณสมบัติของระบบ</h2>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">1. Housing Profile Dashboard</h3>
            <p className="mb-2">
              แดชบอร์ดหลักที่แสดงข้อมูลภาพรวมด้านที่อยู่อาศัยในระดับจังหวัด ประกอบด้วย:
            </p>
            <ul className="list-disc pl-6 mb-3">
              <li>ข้อมูลประชากรและการเปลี่ยนแปลงเชิงพื้นที่</li>
              <li>จำนวนครัวเรือนและแนวโน้มการเพิ่มขึ้น</li>
              <li>รายได้ครัวเรือนและความสามารถในการเข้าถึงที่อยู่อาศัย</li>
              <li>อุปทานที่อยู่อาศัยตามประเภทและช่วงราคา</li>
              <li>ค่าใช้จ่ายด้านที่อยู่อาศัยตามกลุ่มรายได้</li>
              <li>นโยบายและมาตรการด้านที่อยู่อาศัย</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">2. Apartment Supply Analysis</h3>
            <p className="mb-2">
              เครื่องมือสำหรับการวิเคราะห์ข้อมูลอพาร์ตเมนต์และที่อยู่อาศัยประเภทอาคารชุด โดยมีคุณสมบัติดังนี้:
            </p>
            <ul className="list-disc pl-6 mb-3">
              <li>แผนที่แสดงตำแหน่งและรายละเอียดอพาร์ตเมนต์</li>
              <li>การกรองข้อมูลตามราคา ขนาด และสิ่งอำนวยความสะดวก</li>
              <li>การวิเคราะห์การกระจายตัวของอพาร์ตเมนต์ในเขตเมือง</li>
              <li>ข้อมูลสิ่งอำนวยความสะดวกและคะแนนการประเมิน</li>
              <li>สถิติเชิงพื้นที่เกี่ยวกับตลาดอพาร์ตเมนต์</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">3. Housing Delivery System</h3>
            <p className="mb-2">
              ระบบวิเคราะห์การส่งมอบที่อยู่อาศัยและประสิทธิภาพของระบบที่อยู่อาศัย ประกอบด้วย:
            </p>
            <ul className="list-disc pl-6 mb-3">
              <li>การวิเคราะห์ระบบการส่งมอบที่อยู่อาศัยตามพื้นที่</li>
              <li>การประเมินความหนาแน่นและการพัฒนา</li>
              <li>การระบุพื้นที่ที่มีปัญหาด้านอุปทานที่อยู่อาศัย</li>
              <li>การวิเคราะห์ประสิทธิภาพของนโยบายและเงินอุดหนุน</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">4. รายงานและการวิเคราะห์</h3>
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
            <li><strong>นโยบาย</strong> - แสดงนโยบายด้านที่อยู่อาศัยและมาตรการสนับสนุนต่างๆ</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">วิธีการใช้งาน</h2>
          <p className="mb-4">
            ผู้ใช้งานสามารถโต้ตอบกับข้อมูลได้หลากหลายรูปแบบ:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>เลือกดูข้อมูลตามจังหวัดที่สนใจ</li>
            <li>เปรียบเทียบข้อมูลระหว่างช่วงเวลา</li>
            <li>ดูรายละเอียดเพิ่มเติมโดยชี้ที่แผนภูมิ</li>
            <li>กรองข้อมูลในแผนที่อพาร์ตเมนต์ตามหลากหลายเงื่อนไข</li>
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
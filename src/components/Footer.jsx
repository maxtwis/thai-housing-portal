import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-200 text-gray-700 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Copyright section */}
          <div className="mb-4 md:mb-0">
            <p>© 2025 Thailand Housing Data Portal</p>
            <p className="text-xs text-gray-700 mt-1">
              แพลตฟอร์มนี้ได้รับการสนับสนุนทุนวิจัยจากหน่วยบริหารและจัดการทุนด้านการพัฒนาระดับพื้นที่ (บพท.) กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม (อว.)
            </p>
            <p className="text-xs text-gray-700 mt-1">
              *แพลตฟอร์มนี้อยู่ในขั้นตอนพัฒนาและทดสอบ
            </p>
          </div>
          {/* Organizations logo */}
          <div className="flex justify-center">
            <div className="mx-4 my-2">
              <img 
                src="/images/organizations-logo.png" 
                alt="Participating Organizations" 
                className="h-12 md:h-16 w-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
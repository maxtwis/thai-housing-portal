import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Copyright section */}
          <div className="mb-4 md:mb-0">
            <p>© 2025 Thailand Housing Data Portal</p>
            <p className="text-xs text-gray-400 mt-1">
                แพลตฟอร์มนี้ได้รับการสนับสนุนทุนวิจัยจากหน่วยบริหารและจัดการทุนด้านการพัฒนาระดับพื้นที่ (บพท.) กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม (อว.)
            </p>
          </div>
          
          {/* Organizations logo */}
          <div className="flex justify-center">
            <div className="bg-white p-2 rounded">
              <img 
                src="/images/organizations-logo.png" 
                alt="Participating Organizations" 
                className="h-10 md:h-12 w-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
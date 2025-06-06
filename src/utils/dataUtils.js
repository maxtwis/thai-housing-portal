export const expenditureCategories = [
  { id: 1, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย' },
  { id: 2, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย (เช่า)' },
  { id: 3, name: 'ภาระค่าใช้จ่ายด้านที่อยู่อาศัย (ผ่อน)' },
  { id: 4, name: 'ภาระค่าใช้จ่ายด้านอุปโภคบริโภค' },
  { id: 5, name: 'ค่าใช้จ่ายด้านไฟฟ้า' },
  { id: 6, name: 'ค่าใช้จ่ายด้านน้ำประปา' },
  { id: 7, name: 'ค่าใช้จ่ายด้านค่าส่วนกลาง' },
  { id: 8, name: 'ค่าใช้จ่ายด้านการเดินทาง' },
  { id: 9, name: 'ค่าใช้จ่ายด้านพลังงาน (เชื้อเพลิง)' },
  { id: 10, name: 'ค่าใช้จ่ายด้านพลังงาน (แก๊ส)' },
  { id: 11, name: 'ค่าใช้จ่ายด้านการรักษาพยาบาล' },
  { id: 12, name: 'ค่าใช้จ่ายด้านอาหาร' }
];

export const housingCategories = [
  { id: 1, name: 'บ้านเดี่ยว' },
  { id: 2, name: 'บ้านแฝด' },
  { id: 3, name: 'ทาวน์เฮ้าส์' },
  { id: 4, name: 'อาคารชุด' },
  { id: 5, name: 'ตึกแถวและห้องแถว' },
  { id: 6, name: 'พาณิชยกรรม' },
  { id: 7, name: 'ตึก' },
  { id: 8, name: 'โฮมออฟฟิศ' }
];

export const quintiles = [
  { id: 1, name: 'Quintile 1 (Lowest 20%)' },
  { id: 2, name: 'Quintile 2' },
  { id: 3, name: 'Quintile 3' },
  { id: 4, name: 'Quintile 4' },
  { id: 5, name: 'Quintile 5 (Highest 20%)' }
];

// Provinces data - still needed for map and province selection
export const provinces = [
  { id: 10, name: 'กรุงเทพมหานคร', lat: 13.7563, lon: 100.5018 },
  { id: 40, name: 'ขอนแก่น', lat: 16.4419, lon: 102.8359 },
  { id: 50, name: 'เชียงใหม่', lat: 18.7883, lon: 98.9817 },
  { id: 90, name: 'สงขลา', lat: 7.1891, lon: 100.5951 }
];

// Get chart colors - utility function still used
export const getChartColor = (index) => {
  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
  ];
  return colors[index % colors.length];
};
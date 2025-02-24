import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { 
  provinces, getPopulationData, getHouseholdData, getIncomeData,
  getExpenditureData, getHousingSupplyByYear, expenditureCategories,
  housingCategories, quintiles
} from '../utils/dataUtils';
import { getPolicyData } from '../utils/policyUtils';

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show labels for segments that are large enough
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
const shortNames = {
  "บ้านเดี่ยว": "บ้านเดี่ยว",
  "บ้านแฝด": "บ้านแฝด",
  "ทาวน์เฮ้าส์": "ทาวน์เฮ้าส์",
  "อาคารชุด": "คอนโด",
  "ตึกแถวและห้องแถว": "ตึกแถว",
  "พาณิชยกรรม": "พาณิชย์",
  "ตึก": "ตึก",
  "โฮมออฟฟิศ": "ออฟฟิศ"
};

const Report = () => {
  const { provinceId } = useParams();
  const [activeProvince, setActiveProvince] = useState(parseInt(provinceId) || 10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [populationData, setPopulationData] = useState([]);
  const [householdData, setHouseholdData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [housingSupplyData, setHousingSupplyData] = useState([]);
  const [expenditureData, setExpenditureData] = useState({});
  const [policyData, setPolicyData] = useState([]);
  
  // Current province name
  const provinceName = provinces.find(p => p.id === activeProvince)?.name || '';
  
  // Format date for report
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('th-TH', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(currentDate);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch all data in parallel
        const [
          populationResult,
          householdResult,
          incomeResult,
          housingSupplyResult,
          policyResult
        ] = await Promise.all([
          getPopulationData(activeProvince),
          getHouseholdData(activeProvince),
          getIncomeData(activeProvince),
          getHousingSupplyByYear(activeProvince),
          getPolicyData(activeProvince)
        ]);
        
        // Fetch expenditure data for each quintile
        const expenditureResults = {};
        for (let i = 1; i <= 5; i++) {
          expenditureResults[i] = await getExpenditureData(activeProvince, i);
        }
        
        // Update state with all fetched data
        setPopulationData(populationResult);
        setHouseholdData(householdResult);
        setIncomeData(incomeResult);
        setHousingSupplyData(housingSupplyResult);
        setExpenditureData(expenditureResults);
        setPolicyData(policyResult);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('ระบบไม่สามารถดึงข้อมูลได้ในขณะนี้');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeProvince]);
  
  // Generate population trend description
  const getPopulationTrend = () => {
    if (!populationData || populationData.length < 2) return 'ไม่พบข้อมูลประชากร';
    
    const firstYear = populationData[0];
    const latestYear = populationData[populationData.length - 1];
    
    const startYear = firstYear.year;
    const endYear = latestYear.year;
    const startPop = firstYear.population;
    const endPop = latestYear.population;
    
    const growthPercent = ((endPop / startPop) - 1) * 100;
    const growthDescription = growthPercent >= 0 ? 'มีจำนวนเพิ่มขึ้น' : 'มีจำนวนลดลง';
    
    return `ในช่วงปี พ.ศ. ${startYear + 543} ถึง พ.ศ. ${endYear + 543} ประชากรใน${provinceName}${growthDescription}ร้อยละ ${Math.abs(growthPercent).toFixed(1)} 
            จากจำนวน ${new Intl.NumberFormat('th-TH').format(startPop)} คน เป็น ${new Intl.NumberFormat('th-TH').format(endPop)} คน`;
  };
  
  // Generate household trend description
  const getHouseholdTrend = () => {
    if (!householdData || householdData.length < 2) return 'ไม่พบข้อมูลครัวเรือน';
    
    const firstYear = householdData[0];
    const latestYear = householdData[householdData.length - 1];
    
    const startYear = firstYear.year;
    const endYear = latestYear.year;
    const startHouseholds = parseInt(firstYear.household);
    const endHouseholds = parseInt(latestYear.household);
    
    const growthPercent = ((endHouseholds / startHouseholds) - 1) * 100;
    const growthDescription = growthPercent >= 0 ? 'มีจำนวนเพิ่มขึ้น' : 'มีจำนวนลดลง';
    
    // Calculate average household size if population data is available
    let householdSizeText = '';
    if (populationData && populationData.length > 0) {
      const latestPopulation = populationData[populationData.length - 1].population;
      const avgHouseholdSize = (latestPopulation / endHouseholds).toFixed(1);
      householdSizeText = ` โดยมีขนาดครัวเรือนเฉลี่ยอยู่ที่ ${avgHouseholdSize} คนต่อครัวเรือน`;
    }
    
    return `ในช่วงปี พ.ศ. ${startYear + 543} ถึง พ.ศ. ${endYear + 543} จำนวนครัวเรือนใน${provinceName}${growthDescription}ร้อยละ ${Math.abs(growthPercent).toFixed(1)} 
            จาก ${new Intl.NumberFormat('th-TH').format(startHouseholds)} ครัวเรือน เป็น ${new Intl.NumberFormat('th-TH').format(endHouseholds)} ครัวเรือน${householdSizeText}`;
  };
  
  // Generate income trend description
  const getIncomeTrend = () => {
    if (!incomeData || incomeData.length < 2) return 'ไม่พบข้อมูลรายได้';
    
    const firstYear = incomeData[0];
    const latestYear = incomeData[incomeData.length - 1];
    
    const startYear = firstYear.year;
    const endYear = latestYear.year;
    const startIncome = parseInt(firstYear.income);
    const endIncome = parseInt(latestYear.income);
    
    const growthPercent = ((endIncome / startIncome) - 1) * 100;
    const growthDescription = growthPercent >= 0 ? 'เพิ่มขึ้น' : 'ลดลง';
    
    return `ในช่วงปี พ.ศ. ${startYear + 543} ถึง พ.ศ. ${endYear + 543} รายได้ครัวเรือนมัธยฐานใน${provinceName}${growthDescription}ร้อยละ ${Math.abs(growthPercent).toFixed(1)} 
            จาก ${new Intl.NumberFormat('th-TH').format(startIncome)} บาท เป็น ${new Intl.NumberFormat('th-TH').format(endIncome)} บาทต่อเดือน`;
  };
  
  // Generate housing supply trend description
  const getHousingTrend = () => {
    if (!housingSupplyData || housingSupplyData.length < 2) return 'ไม่พบข้อมูลที่อยู่อาศัย';
    
    const firstYear = housingSupplyData[0];
    const latestYear = housingSupplyData[housingSupplyData.length - 1];
    
    const startYear = firstYear.year;
    const endYear = latestYear.year;
    
    // Calculate total units for first and last year
    const startTotal = housingCategories.reduce((sum, category) => sum + (firstYear[category.name] || 0), 0);
    const endTotal = housingCategories.reduce((sum, category) => sum + (latestYear[category.name] || 0), 0);
    
    const growthPercent = ((endTotal / startTotal) - 1) * 100;
    const growthDescription = growthPercent >= 0 ? 'เพิ่มขึ้น' : 'ลดลง';
    
    // Find the dominant housing type
    const housingTypeCounts = {};
    housingCategories.forEach(category => {
      housingTypeCounts[category.name] = latestYear[category.name] || 0;
    });
    
    const dominantType = Object.entries(housingTypeCounts)
      .sort((a, b) => b[1] - a[1])[0];
    const dominantPercentage = ((dominantType[1] / endTotal) * 100).toFixed(1);
    
    return `ในช่วงปี พ.ศ. ${startYear + 543} ถึง พ.ศ. ${endYear + 543} จำนวนที่อยู่อาศัยทั้งหมดใน${provinceName}${growthDescription}ร้อยละ ${Math.abs(growthPercent).toFixed(1)} 
            จาก ${new Intl.NumberFormat('th-TH').format(startTotal)} หน่วย เป็น ${new Intl.NumberFormat('th-TH').format(endTotal)} หน่วย 
            โดยประเภทที่อยู่อาศัยส่วนใหญ่เป็น${dominantType[0]} คิดเป็นร้อยละ ${dominantPercentage} ของจำนวนที่อยู่อาศัยทั้งหมด`;
  };
  
  // Generate expenditure description
  const getExpenditureTrend = () => {
    if (!expenditureData || Object.keys(expenditureData).length === 0) return 'ไม่พบข้อมูลค่าใช้จ่าย';
    
    // Look for housing expenditure (usually expenditure_id 1, 2, or 3)
    const housingExpIds = [1, 2, 3]; // Housing, Rent, Mortgage
    let housingExpText = '';
    
    try {
      // Get data for the lowest and highest quintiles
      const lowestQuintile = expenditureData[1] || [];
      const highestQuintile = expenditureData[5] || [];
      
      // Find housing expenditures
      const lowestHousingExps = lowestQuintile.filter(exp => housingExpIds.includes(exp.expenditure_id));
      const highestHousingExps = highestQuintile.filter(exp => housingExpIds.includes(exp.expenditure_id));
      
      if (lowestHousingExps.length && highestHousingExps.length) {
        // Calculate total housing expenditure percentage for each quintile
        const lowestTotal = lowestHousingExps.reduce((sum, exp) => sum + exp.amount, 0);
        const highestTotal = highestHousingExps.reduce((sum, exp) => sum + exp.amount, 0);
        
        housingExpText = `จากการวิเคราะห์พบว่า ครัวเรือนที่มีรายได้น้อย (กลุ่มรายได้ต่ำสุดร้อยละ 20) 
                          มีภาระค่าใช้จ่ายด้านที่อยู่อาศัยสูงถึงร้อยละ ${lowestTotal.toFixed(1)} ของรายได้ 
                          ในขณะที่ครัวเรือนที่มีรายได้สูง (กลุ่มรายได้สูงสุดร้อยละ 20) 
                          มีภาระค่าใช้จ่ายเพียงร้อยละ ${highestTotal.toFixed(1)} ของรายได้`;
      }
    } catch (err) {
      housingExpText = 'ไม่สามารถวิเคราะห์รายละเอียดข้อมูลค่าใช้จ่ายได้';
    }
    
    return `การวิเคราะห์ภาระค่าใช้จ่ายด้านที่อยู่อาศัยใน${provinceName}แสดงให้เห็นถึงความแตกต่างของภาระค่าใช้จ่ายระหว่างกลุ่มรายได้ต่างๆ อย่างมีนัยสำคัญ ${housingExpText}`;
  };
  
  // Generate policy description
  const getPolicyOverview = () => {
    if (!policyData || policyData.length === 0) return 'ไม่พบข้อมูลนโยบาย';
    
    const activePolicies = policyData.filter(p => p.Status === 'Active').length;
    const pendingPolicies = policyData.filter(p => p.Status === 'Pending').length;
    const inactivePolicies = policyData.filter(p => p.Status === 'Inactive').length;
    
    // Count policies by type using the 3S model
    const supplyPolicies = policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S1')).length;
    const subsidyPolicies = policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S2')).length;
    const stabilityPolicies = policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S3')).length;
    
    return `จากการศึกษาพบว่า ${provinceName}มีนโยบายที่เกี่ยวข้องกับที่อยู่อาศัยทั้งสิ้น ${policyData.length} นโยบาย 
            โดยเป็นนโยบายที่อยู่ระหว่างดำเนินการจำนวน ${activePolicies} นโยบาย 
            นโยบายที่อยู่ระหว่างเตรียมการจำนวน ${pendingPolicies} นโยบาย 
            และนโยบายที่ไม่ได้ดำเนินการแล้วจำนวน ${inactivePolicies} นโยบาย 
            เมื่อพิจารณาตามกรอบแนวคิดโมเดล 3S พบว่ามีนโยบายด้านอุปทาน (Supply) จำนวน ${supplyPolicies} นโยบาย 
            นโยบายด้านการอุดหนุน (Subsidy) จำนวน ${subsidyPolicies} นโยบาย 
            และนโยบายด้านเสถียรภาพ (Stability) จำนวน ${stabilityPolicies} นโยบาย`;
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">กำลังจัดทำรายงาน</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800">กลับสู่หน้าหลัก</Link>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">กรุณารอสักครู่...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">พบข้อผิดพลาด</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800">กลับสู่หน้าหลัก</Link>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <p className="mt-2">กรุณาลองใหม่อีกครั้งในภายหลัง หรือติดต่อผู้ดูแลระบบ</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Report Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">รายงานสถานการณ์ที่อยู่อาศัย</h1>
        <Link to="/" className="text-blue-600 hover:text-blue-800">กลับสู่หน้าหลัก</Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="bg-blue-800 text-white px-6 py-4">
          <h2 className="text-xl font-bold">สถานการณ์ที่อยู่อาศัยจังหวัด{provinceName}</h2>
          <p className="text-sm mt-1">จัดทำเมื่อวันที่ {formattedDate}</p>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            เพื่อประเมินความต้องการที่อยู่อาศัยในปัจจุบันและอนาคตของจังหวัด{provinceName} 
            จำเป็นต้องศึกษาแนวโน้มด้านประชากร การเปลี่ยนแปลงด้านจำนวนประชากร 
            ขนาดครัวเรือน และโครงสร้างช่วงอายุล้วนส่งผลต่อความต้องการด้านที่อยู่อาศัยทั้งเชิงปริมาณและประเภทที่อยู่อาศัย
            นอกจากนี้ ความเข้าใจในมิติความแตกต่างทางเศรษฐกิจและสังคมในพื้นที่จะช่วยระบุกลุ่มเปราะบางที่อาจประสบปัญหา
            การเข้าถึงที่อยู่อาศัยที่มีคุณภาพและราคาเหมาะสมได้
          </p>
          
          {/* Population Trends Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">สถานการณ์ด้านประชากร</h3>
            <p className="text-gray-700 mb-4">{getPopulationTrend()}</p>
            
            {/* Population Chart */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">การเปลี่ยนแปลงจำนวนประชากร</h4>
              </div>
              <div className="p-4" style={{ height: "250px" }}>
                {populationData.length > 0 ? (
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={populationData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }} // Reduced margins
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="year" 
                          tick={{ fontSize: 12 }}  // Smaller font
                          tickSize={5}
                          height={30}  // Reduced height
                        />
                        <YAxis 
                          tickFormatter={(value) => new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(value)}
                          tick={{ fontSize: 12 }}  // Smaller font
                          tickSize={5}
                          width={35}  // Reduced width
                        />
                        <Tooltip 
                          contentStyle={{ fontSize: 12 }}  // Smaller tooltip
                          formatter={(value) => new Intl.NumberFormat('th-TH').format(value)}
                          labelFormatter={(value) => `ปี พ.ศ. ${value + 543}`}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: 12, paddingTop: 0 }}  // Smaller legend
                          height={15}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="population" 
                          stroke="#1e40af" 
                          strokeWidth={1.5}  // Thinner line
                          activeDot={{ r: 4 }}  // Smaller dots
                          name="จำนวนประชากร"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">ไม่พบข้อมูลประชากร</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                ที่มา: สำนักงานสถิติแห่งชาติ
              </div>
            </div>

            <div className="border-l-4 border-red-200 pl-4 bg-red-50 p-3 rounded-r-md">
              <p className="text-sm text-red-800 font-medium">ข้อค้นพบสำคัญ:</p>
              <p className="text-sm text-gray-700">
                {populationData.length > 0 && 
                  `${provinceName}มีประชากรในปัจจุบันจำนวน ${new Intl.NumberFormat('th-TH').format(populationData[populationData.length - 1].population)} คน 
                  ซึ่งเป็นหนึ่งในศูนย์กลางความเจริญของประเทศไทย`}
              </p>
            </div>
          </div>
          
          {/* Household Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">สถานการณ์ด้านครัวเรือน</h3>
            <p className="text-gray-700 mb-4">{getHouseholdTrend()}</p>
            
            {/* Household Chart */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">การเปลี่ยนแปลงจำนวนครัวเรือน</h4>
              </div>
              <div className="p-4" style={{ height: "250px" }}>
                {householdData.length > 0 ? (
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={householdData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="year" 
                          tick={{ fontSize: 12 }}  // Smaller font
                          tickSize={5}
                          height={30}  // Reduced height
                        />
                        <YAxis 
                          tickFormatter={(value) => new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(value)}
                          tick={{ fontSize: 12 }}  // Smaller font
                          tickSize={5}
                          width={35}  // Reduced width
                        />
                        <Tooltip 
                          contentStyle={{ fontSize: 12 }}  // Smaller tooltip
                          formatter={(value) => new Intl.NumberFormat('th-TH').format(value)}
                          labelFormatter={(value) => `ปี พ.ศ. ${value + 543}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="household" 
                          stroke="#15803d" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                          name="จำนวนครัวเรือน"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">ไม่พบข้อมูลครัวเรือน</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                ที่มา: สำนักงานสถิติแห่งชาติ
              </div>
            </div>
            
            <div className="border-l-4 border-red-200 pl-4 bg-red-50 p-3 rounded-r-md">
              <p className="text-sm text-red-800 font-medium">ข้อค้นพบสำคัญ:</p>
              <p className="text-sm text-gray-700">
                {householdData.length > 0 && populationData.length > 0 && 
                  `อัตราการเพิ่มของครัวเรือนใน${provinceName} ${
                    householdData[householdData.length - 1].household / householdData[0].household > 
                    populationData[populationData.length - 1].population / populationData[0].population 
                    ? 'สูงกว่าอัตราการเพิ่มของประชากร แสดงให้เห็นถึงแนวโน้มการเปลี่ยนแปลงเป็นครัวเรือนขนาดเล็ก' 
                    : 'ต่ำกว่าอัตราการเพิ่มของประชากร สะท้อนแนวโน้มครัวเรือนที่มีขนาดใหญ่ขึ้น'
                  }`}
              </p>
            </div>
          </div>
          
          {/* Income Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">สถานการณ์ด้านรายได้</h3>
            <p className="text-gray-700 mb-4">{getIncomeTrend()}</p>
            
            {/* Income Chart */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">การเปลี่ยนแปลงรายได้ครัวเรือนมัธยฐาน</h4>
              </div>
              <div className="p-4" style={{ height: "250px" }}>
                {incomeData.length > 0 ? (
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={incomeData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="year" 
                          tick={{ fontSize: 12 }}  // Smaller font
                          tickSize={5}
                          height={30}  // Reduced height
                        />
                        <YAxis 
                          tickFormatter={(value) => new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(value)}
                          tick={{ fontSize: 12 }}  // Smaller font
                          tickSize={5}
                          width={35}  // Reduced width
                        /> 
                          <Tooltip 
                          contentStyle={{ fontSize: 12 }}  // Smaller tooltip
                          formatter={(value) => new Intl.NumberFormat('th-TH').format(value)}
                          labelFormatter={(value) => `ปี พ.ศ. ${value + 543}`}
                        />
                      <Line 
                          type="monotone" 
                          dataKey="income" 
                          stroke="#7e22ce" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                          name="รายได้มัธยฐาน"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">ไม่พบข้อมูลรายได้</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                ที่มา: สำนักงานสถิติแห่งชาติ
              </div>
            </div>
            
            <div className="border-l-4 border-red-200 pl-4 bg-red-50 p-3 rounded-r-md">
              <p className="text-sm text-red-800 font-medium">ข้อค้นพบสำคัญ:</p>
              <p className="text-sm text-gray-700">
                {incomeData.length > 0 && 
                  `เมื่อพิจารณาค่าเงินที่แท้จริง (ปรับด้วยอัตราเงินเฟ้อ) พบว่ารายได้ที่แท้จริงของครัวเรือนใน${provinceName} 
                  ${((incomeData[incomeData.length - 1].income / incomeData[0].income) - 1) * 100 > 0 
                    ? 'มีแนวโน้มเพิ่มขึ้น ซึ่งอาจช่วยให้ความสามารถในการจับจ่ายด้านที่อยู่อาศัยของครัวเรือนส่วนใหญ่ปรับตัวดีขึ้น' 
                    : 'มีแนวโน้มลดลง ซึ่งส่งผลให้ความสามารถในการจับจ่ายด้านที่อยู่อาศัยของครัวเรือนส่วนใหญ่ถดถอยลง'
                  }`}
              </p>
            </div>
          </div>
          
          {/* Housing Supply Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">สถานการณ์ด้านอุปทานที่อยู่อาศัย</h3>
            <p className="text-gray-700 mb-4">{getHousingTrend()}</p>
            
            {/* Housing Supply Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Housing Supply by Type - Area Chart */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700">แนวโน้มอุปทานที่อยู่อาศัย</h4>
                </div>
                <div className="p-4" style={{ height: "250px" }}>
                  {housingSupplyData.length > 0 ? (
                    <div className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={housingSupplyData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="year" 
                          tick={{ fontSize: 12 }}
                          tickSize={5}
                          height={30}
                        />
                        <YAxis 
                          tickFormatter={(value) => new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(value)}
                          tick={{ fontSize: 12 }}
                          tickSize={5}
                          width={35}
                        />
                        <Tooltip 
                          contentStyle={{ fontSize: 12 }}
                          formatter={(value) => new Intl.NumberFormat('th-TH').format(value) + ' หน่วย'}
                          labelFormatter={(value) => `ปี พ.ศ. ${value + 543}`}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: 12, paddingTop: 0 }}
                          height={15}
                        />
                        {housingCategories.slice(0, 4).map((category, index) => {
                          const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];
                          return (
                            <Area 
                              key={category.name}
                              type="monotone" 
                              dataKey={category.name} 
                              stackId="1"
                              stroke={colors[index % colors.length]}
                              fill={colors[index % colors.length]}
                              fillOpacity={0.6}
                            />
                          );
                        })}
                      </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">ไม่พบข้อมูลที่อยู่อาศัย</p>
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                  ที่มา: กรมที่ดิน และการเคหะแห่งชาติ
                </div>
              </div>
              
              {/* Housing Distribution - Pie Chart */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700">สัดส่วนประเภทที่อยู่อาศัย</h4>
                </div>
                <div className="p-4" style={{ height: "250px" }}>
                  {housingSupplyData.length > 0 ? (
                    <div className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={housingCategories
                              .map(category => ({
                                name: category.name,
                                value: housingSupplyData[housingSupplyData.length - 1][category.name] || 0
                              }))
                              .filter(item => item.value > 0)
                            }
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={renderCustomizedLabel}
                            >
                            {housingCategories.map((category, index) => {
                              const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'];
                              return (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                              );
                            })}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => new Intl.NumberFormat('th-TH').format(value) + ' หน่วย'} 
                            contentStyle={{ fontSize: 12 }}
                          />
                                      <Legend 
                                        verticalAlign="bottom" 
                                        layout="horizontal"
                                        align="center"
                                        formatter={(value) => shortNames[value] || value}
                                        wrapperStyle={{ fontSize: 10, paddingTop: 0 }}
                                      />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">ไม่พบข้อมูลที่อยู่อาศัย</p>
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                  ข้อมูลล่าสุด ณ ปี พ.ศ. {housingSupplyData.length > 0 ? housingSupplyData[housingSupplyData.length - 1].year + 543 : ''}
                </div>
              </div>
            </div>
            
            <div className="border-l-4 border-red-200 pl-4 bg-red-50 p-3 rounded-r-md">
              <p className="text-sm text-red-800 font-medium">ข้อค้นพบสำคัญ:</p>
              <p className="text-sm text-gray-700">
                {housingSupplyData.length > 0 && householdData.length > 0 && 
                  `อัตราส่วนระหว่างจำนวนที่อยู่อาศัยต่อจำนวนครัวเรือนใน${provinceName}อยู่ที่ประมาณ 
                  ${(housingCategories.reduce((sum, category) => 
                    sum + (housingSupplyData[housingSupplyData.length - 1][category.name] || 0), 0) / 
                    parseInt(householdData[householdData.length - 1].household)).toFixed(2)} 
                  ซึ่ง${
                    housingCategories.reduce((sum, category) => 
                      sum + (housingSupplyData[housingSupplyData.length - 1][category.name] || 0), 0) > 
                    parseInt(householdData[householdData.length - 1].household) 
                    ? 'แสดงถึงภาวะอุปทานส่วนเกินในตลาดที่อยู่อาศัยโดยรวม' 
                    : 'สะท้อนถึงภาวะการขาดแคลนที่อยู่อาศัยซึ่งอาจส่งผลกระทบต่อระดับราคาและความสามารถในการเข้าถึงที่อยู่อาศัย'
                  }`}
              </p>
            </div>
          </div>
          
          {/* Expenditure Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">ภาระค่าใช้จ่ายด้านที่อยู่อาศัย</h3>
            <p className="text-gray-700 mb-4">{getExpenditureTrend()}</p>
            
            {/* Expenditure Chart */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">ค่าใช้จ่ายด้านที่อยู่อาศัยจำแนกตามกลุ่มรายได้</h4>
              </div>
              <div className="p-4" style={{ height: "250px" }}>
                {Object.keys(expenditureData).length > 0 ? (
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.keys(expenditureData).map(quintileId => {
                          const quintileData = expenditureData[quintileId];
                          const quintileName = quintiles.find(q => q.id === parseInt(quintileId))?.name || `Quintile ${quintileId}`;
                          const shortenedName = {
                            "Quintile 1 (Lowest 20%)": "Q1",
                            "Quintile 2": "Q2",
                            "Quintile 3": "Q3", 
                            "Quintile 4": "Q4",
                            "Quintile 5 (Highest 20%)": "Q5"
                          }[quintileName] || quintileName;
                          
                          // Get housing expenditures
                          const housingExp = quintileData.find(exp => exp.expenditure_id === 1)?.amount || 0;
                          const rentExp = quintileData.find(exp => exp.expenditure_id === 2)?.amount || 0;
                          const mortgageExp = quintileData.find(exp => exp.expenditure_id === 3)?.amount || 0;
                          const utilityExp = quintileData.find(exp => exp.expenditure_id === 5)?.amount || 0;
                          
                          return {
                            name: shortenedName,
                            'ค่าที่อยู่อาศัยรวม': housingExp,
                            'ค่าเช่า': rentExp,
                            'ค่าผ่อนบ้าน': mortgageExp,
                            'ค่าสาธารณูปโภค': utilityExp
                          };
                        })}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          tickSize={5}
                          height={30}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickSize={5}
                          width={35}
                        />
                        <Tooltip contentStyle={{ fontSize: 12 }} formatter={(value) => `ร้อยละ ${value.toFixed(1)}`} />
                        <Legend
                            wrapperStyle={{ fontSize: 12, paddingTop: 0 }}
                            height={15} 
                        />
                        <Bar dataKey="ค่าที่อยู่อาศัยรวม" fill="#1f77b4" />
                        <Bar dataKey="ค่าเช่า" fill="#ff7f0e" />
                        <Bar dataKey="ค่าผ่อนบ้าน" fill="#2ca02c" />
                        <Bar dataKey="ค่าสาธารณูปโภค" fill="#d62728" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">ไม่พบข้อมูลค่าใช้จ่าย</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                แสดงสัดส่วนภาระค่าใช้จ่ายด้านที่อยู่อาศัยต่อรายได้รวมของครัวเรือน
              </div>
            </div>
            
            <div className="border-l-4 border-red-200 pl-4 bg-red-50 p-3 rounded-r-md">
              <p className="text-sm text-red-800 font-medium">ข้อค้นพบสำคัญ:</p>
              <p className="text-sm text-gray-700">
                ความแตกต่างของภาระค่าใช้จ่ายด้านที่อยู่อาศัยระหว่างกลุ่มรายได้ต่างๆ ชี้ให้เห็นถึงความจำเป็นในการมีมาตรการสนับสนุน
                ด้านที่อยู่อาศัยที่มีราคาเหมาะสมสำหรับครัวเรือนรายได้น้อยใน{provinceName}อย่างเร่งด่วน
              </p>
            </div>
          </div>
          
          {/* Policy Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">นโยบายด้านที่อยู่อาศัย</h3>
            <p className="text-gray-700 mb-4">{getPolicyOverview()}</p>
            
            {/* Policy Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Policy Status Chart */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700">สถานะการดำเนินนโยบาย</h4>
                </div>
                <div className="p-4" style={{ height: "250px" }}>
                  {policyData.length > 0 ? (
                    <div className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'อยู่ระหว่างดำเนินการ', value: policyData.filter(p => p.Status === 'Active').length, fill: '#2ca02c' },
                              { name: 'อยู่ระหว่างเตรียมการ', value: policyData.filter(p => p.Status === 'Pending').length, fill: '#ff7f0e' },
                              { name: 'สิ้นสุดแล้ว', value: policyData.filter(p => p.Status === 'Inactive').length, fill: '#7f7f7f' }
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}% `} 
                            fontSize={9}
                          >
                          </Pie>
                          <Tooltip 
                            formatter={(value) => `${value} นโยบาย`} 
                            contentStyle={{ fontSize: 12 }}
                          />
                          
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">ไม่พบข้อมูลนโยบาย</p>
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                  ที่มา: การเคหะแห่งชาติและหน่วยงานที่เกี่ยวข้อง
                </div>
              </div>
              
              {/* Policy Type Chart */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700">ประเภทนโยบายตามกรอบแนวคิดโมเดล 3S</h4>
                </div>
                <div className="p-4" style={{ height: "250px" }}>
                  {policyData.length > 0 ? (
                    <div className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={[
                            { 
                              name: 'ด้านอุปทาน (Supply)', 
                              count: policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S1')).length,
                              fill: '#1f77b4'
                            },
                            { 
                              name: 'ด้านการอุดหนุน (Subsidy)', 
                              count: policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S2')).length,
                              fill: '#9467bd'
                            },
                            { 
                              name: 'ด้านเสถียรภาพ (Stability)', 
                              count: policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S3')).length,
                              fill: '#d62728'
                            }
                          ].filter(item => item.count > 0).sort((a, b) => b.count - a.count)}
                          margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                              type="number"
                              tick={{ fontSize: 12 }}
                              tickSize={5}
                              height={30} 
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value) => `${value} นโยบาย`}
                            contentStyle={{ fontSize: 12 }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="#8884d8"
                            barSize={30}
                            radius={[0, 4, 4, 0]}
                          >
                            {[
                              { name: 'ด้านอุปทาน (Supply)', fill: '#1f77b4' },
                              { name: 'ด้านการอุดหนุน (Subsidy)', fill: '#9467bd' },
                              { name: 'ด้านเสถียรภาพ (Stability)', fill: '#d62728' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">ไม่พบข้อมูลนโยบาย</p>
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                  การจำแนกนโยบายตามกรอบแนวคิดโมเดล 3S
                </div>
              </div>
            </div>
            
            <div className="border-l-4 border-red-200 pl-4 bg-red-50 p-3 rounded-r-md">
              <p className="text-sm text-red-800 font-medium">ข้อค้นพบสำคัญ:</p>
              <p className="text-sm text-gray-700">
                {policyData.length > 0 && 
                  `จากการวิเคราะห์นโยบายด้านที่อยู่อาศัยใน${provinceName}พบว่า 
                  ${policyData.filter(p => p.Status === 'Active').length > policyData.length / 2 
                    ? 'มีการดำเนินนโยบายอย่างต่อเนื่องและเป็นรูปธรรม' 
                    : 'ยังประสบความท้าทายในการขับเคลื่อนนโยบายให้เกิดผลเป็นรูปธรรม'
                  } โดยมี
                  ${policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S1')).length > 
                    policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S2')).length && 
                    policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S1')).length > 
                    policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S3')).length 
                    ? 'การให้ความสำคัญกับการเพิ่มอุปทานที่อยู่อาศัยเป็นหลัก' 
                    : policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S2')).length > 
                      policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S1')).length && 
                      policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S2')).length > 
                      policyData.filter(p => p['3S Model'] && p['3S Model'].includes('S3')).length 
                      ? 'การให้ความสำคัญกับมาตรการอุดหนุนและความสามารถในการเข้าถึงที่อยู่อาศัยเป็นหลัก' 
                      : 'การให้ความสำคัญกับการสร้างเสถียรภาพของตลาดที่อยู่อาศัยเป็นหลัก'
                  }`}
              </p>
            </div>
          </div>
          
          {/* Conclusion Section */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">บทสรุปและข้อเสนอแนะ</h3>
            <p className="text-gray-700 mb-4">
              จากการวิเคราะห์แนวโน้มประชากร อุปทานที่อยู่อาศัย และภูมิทัศน์นโยบายใน{provinceName} 
              มีข้อเสนอแนะต่อไปนี้เพื่อแก้ไขความท้าทายด้านที่อยู่อาศัย:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>
                <span className="font-medium">แก้ไขพลวัตประชากรและครัวเรือน:</span> {' '}
                {populationData.length > 0 && householdData.length > 0 && 
                  `ด้วยประชากรที่${(populationData[populationData.length - 1].population / 
                    populationData[populationData.length - 2].population - 1) * 100 > 0 
                    ? 'เติบโต' : 'ลดลง'} และการก่อตัวของครัวเรือนที่
                    ${(householdData[householdData.length - 1].household / 
                      householdData[householdData.length - 2].household - 1) * 100 > 0 
                      ? 'เพิ่มขึ้น' : 'ลดลง'} 
                    นโยบายที่อยู่อาศัยควรได้รับการปรับให้เหมาะสม`}
              </li>
              <li>
                <span className="font-medium">การสร้างสมดุลของนโยบายที่อยู่อาศัย:</span> {' '}
                ควรพัฒนานโยบายที่มีความสมดุลระหว่างมิติด้านอุปทาน การอุดหนุน และเสถียรภาพ (โมเดล 3S) 
                เพื่อให้เกิดการพัฒนาที่อยู่อาศัยอย่างยั่งยืนและครอบคลุม
              </li>
              <li>
                <span className="font-medium">การพัฒนาระบบติดตามและประเมินผลนโยบาย:</span> {' '}
                ควรมีการพัฒนาระบบการติดตามและประเมินผลนโยบายที่อยู่อาศัยอย่างเป็นระบบ 
                เพื่อให้สามารถปรับปรุงและพัฒนานโยบายให้มีประสิทธิภาพและตอบสนองต่อความต้องการของประชาชนได้อย่างแท้จริง
              </li>
              <li>
                <span className="font-medium">การบูรณาการความร่วมมือระหว่างภาคส่วน:</span> {' '}
                ควรส่งเสริมความร่วมมือระหว่างภาครัฐ ภาคเอกชน และภาคประชาสังคม 
                ในการพัฒนาและดำเนินนโยบายด้านที่อยู่อาศัย เพื่อให้เกิดการพัฒนาที่ครอบคลุมและยั่งยืน
              </li>
            </ol>
          </div>
        </div>
      </div>
      
      {/* Report Footer */}
      <div className="text-center text-gray-500 text-sm mb-8">
        <p>© สงวนลิขสิทธิ์ Urban Studies Lab 2025 Housing Profile Platform </p>
        <p className="mt-1">ที่มา: สำนักงานสถิติแห่งชาติ กรมที่ดิน และการเคหะแห่งชาติ</p>
        <div className="mt-4">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            กลับสู่หน้าหลัก
          </Link>
          <button 
            onClick={() => window.print()}
            className="inline-flex items-center ml-6 text-blue-600 hover:text-blue-800"
          >
            <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            พิมพ์รายงาน
          </button>
        </div>
      </div>
    </div>
  );
};

export default Report;
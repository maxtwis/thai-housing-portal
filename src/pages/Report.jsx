import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  usePopulationData, 
  useHouseholdData, 
  useIncomeData, 
  useAllExpenditureData,
  useHousingSupplyData,
  useHousingAffordabilityData,
  useHousingDemandData
} from '../hooks/useCkanQueries';
import { 
  housingCategories, 
  provinces 
} from '../utils/dataUtils';
import { processHousingSupplyData } from '../utils/ckanClient';
import { getPolicyData } from '../utils/policyUtils';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// Province name mapping
const PROVINCE_NAME_MAPPING = {
  "กรุงเทพมหานคร": "กรุงเทพมหานคร",
  "สมุทรปราการ": "สมุทรปราการ",
  "นนทบุรี": "นนทบุรี",
  "ปทุมธานี": "ปทุมธานี",
  "พระนครศรีอยุธยา": "พระนครศรีอยุธยา",
  "อ่างทอง": "อ่างทอง",
  "ลพบุรี": "ลพบุรี",
  "สิงห์บุรี": "สิงห์บุรี",
  "ชัยนาท": "ชัยนาท",
  "สระบุรี": "สระบุรี",
  "ชลบุรี": "ชลบุรี",
  "ระยอง": "ระยอง",
  "จันทบุรี": "จันทบุรี",
  "ตราด": "ตราด",
  "ฉะเชิงเทรา": "ฉะเชิงเทรา",
  "ปราจีนบุรี": "ปราจีนบุรี",
  "นครนายก": "นครนายก",
  "สระแก้ว": "สระแก้ว",
  "นครราชสีมา": "นครราชสีมา",
  "บุรีรัมย์": "บุรีรัมย์",
  "สุรินทร์": "สุรินทร์",
  "ศีขรภูมิ": "ศีขรภูมิ",
  "ขอนแก่น": "ขอนแก่น",
  "อุดรธานี": "อุดรธานี",
  "เลย": "เลย",
  "หนองบัวลำภู": "หนองบัวลำภู",
  "มหาสารคาม": "มหาสารคาม",
  "ร้อยเอ็ด": "ร้อยเอ็ด",
  "กาฬสินธุ์": "กาฬสินธุ์",
  "สกลนคร": "สกลนคร",
  "นครพนม": "นครพนม",
  "มุกดาหาร": "มุกดาหาร",
  "เชียงใหม่": "เชียงใหม่",
  "ลำพูน": "ลำพูน",
  "ลำปาง": "ลำปาง",
  "อุตรดิตถ์": "อุตรดิตถ์",
  "แพร่": "แพร่",
  "น่าน": "น่าน",
  "พะเยา": "พะเยา",
  "เชียงราย": "เชียงราย",
  "แม่ฮ่องสอน": "แม่ฮ่องสอน",
  "นครสวรรค์": "นครสวรรค์",
  "อุทัยธานี": "อุทัยธานี",
  "กำแพงเพชร": "กำแพงเพชร",
  "ตาก": "ตาก",
  "สุโขทัย": "สุโขทัย",
  "พิษณุโลก": "พิษณุโลก",
  "พิจิตร": "พิจิตร",
  "เพชรบูรณ์": "เพชรบูรณ์",
  "ราชบุรี": "ราชบุรี",
  "กาญจนบุรี": "กาญจนบุรี",
  "สุพรรณบุรี": "สุพรรณบุรี",
  "นครปฐม": "นครปฐม",
  "สมุทรสาคร": "สมุทรสาคร",
  "สมุทรสงคราม": "สมุทรสงคราม",
  "เพชรบุรี": "เพชรบุรี",
  "ประจวบคีรีขันธ์": "ประจวบคีรีขันธ์",
  "นครศรีธรรมราช": "นครศรีธรรมราช",
  "กระบี่": "กระบี่",
  "พังงา": "พังงา",
  "ภูเก็ต": "ภูเก็ต",
  "สุราษฎร์ธานี": "สุราษฎร์ธานี",
  "ระนอง": "ระนอง",
  "ชุมพร": "ชุมพร",
  "สงขลา": "สงขลา",
  "สตูล": "สตูล",
  "ตรัง": "ตรัง",
  "พัทลุง": "พัทลุง",
  "ปัตตานี": "ปัตตานี",
  "ยะลา": "ยะลา",
  "นราธิวาส": "นราธิวาส",
  "บึงกาฬ": "บึงกาฬ",
  "อำนาจเจริญ": "อำนาจเจริญ",
  "หนองคาย": "หนองคาย",
  "ยโสธร": "ยโสธร",
  "อุบลราชธานี": "อุบลราชธานี",
  "โฮมออฟฟิศ": "ออฟฟิศ"
};

const Report = () => {
  const { provinceId } = useParams();
  const [activeProvince, setActiveProvince] = useState(parseInt(provinceId) || 10);
  const [policyData, setPolicyData] = useState([]);
  
  // Use React Query hooks for data fetching
  const { 
    data: populationData = [], 
    isLoading: populationLoading, 
    error: populationError 
  } = usePopulationData(activeProvince);
  
  const { 
    data: householdData = [], 
    isLoading: householdLoading, 
    error: householdError 
  } = useHouseholdData(activeProvince);
  
  const { 
    data: incomeData = [], 
    isLoading: incomeLoading, 
    error: incomeError 
  } = useIncomeData(activeProvince);
  
  const { 
    data: rawHousingData, 
    isLoading: housingLoading, 
    error: housingError 
  } = useHousingSupplyData(activeProvince);

  // NEW: Housing Affordability Data
  const { 
    data: rawAffordabilityData, 
    isLoading: affordabilityLoading, 
    error: affordabilityError 
  } = useHousingAffordabilityData(activeProvince, 'province');

  // NEW: Housing Demand Data
  const { 
    data: rawDemandData, 
    isLoading: demandLoading, 
    error: demandError 
  } = useHousingDemandData(activeProvince);
  
  const expenditureQueries = useAllExpenditureData(activeProvince);
  const expenditureLoading = expenditureQueries.some(q => q.isLoading);
  const expenditureError = expenditureQueries.some(q => q.isError);
  
  // Process housing supply data
  const housingSupplyData = React.useMemo(() => {
    if (rawHousingData && rawHousingData.records) {
      return processHousingSupplyData(rawHousingData.records, housingCategories);
    }
    return [];
  }, [rawHousingData]);
  
  // Process expenditure data
  const expenditureData = React.useMemo(() => {
    const result = {};
    expenditureQueries.forEach((query, index) => {
      const quintileId = index + 1;
      if (query.data) {
        result[quintileId] = query.data;
      }
    });
    return result;
  }, [expenditureQueries]);

  // NEW: Process housing affordability data
  const housingAffordabilityData = React.useMemo(() => {
    if (!rawAffordabilityData?.records) return [];
    return rawAffordabilityData.records;
  }, [rawAffordabilityData]);

  // NEW: Process housing demand data
  const housingDemandData = React.useMemo(() => {
    if (!rawDemandData?.records) return [];
    return rawDemandData.records;
  }, [rawDemandData]);
  
  // Check overall loading state
  const loading = populationLoading || householdLoading || incomeLoading || 
                  housingLoading || expenditureLoading || affordabilityLoading || demandLoading;
  
  // Check overall error state
  const error = populationError || householdError || incomeError || 
                housingError || expenditureError || affordabilityError || demandError;
  
  // Current province name
  const provinceName = provinces.find(p => p.id === activeProvince)?.name || '';
  const mappedProvinceName = PROVINCE_NAME_MAPPING[provinceName] || provinceName;
  
  // Format date for report
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('th-TH', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(currentDate);

  // Fetch policy data separately (still using old method)
  useEffect(() => {
    const fetchPolicyData = async () => {
      try {
        const result = await getPolicyData(activeProvince);
        setPolicyData(result);
      } catch (err) {
        console.error('Error fetching policy data:', err);
        setPolicyData([]);
      }
    };
    
    fetchPolicyData();
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
    
    return `ในช่วงปี พ.ศ. ${startYear + 543} ถึง พ.ศ. ${endYear + 543} ประชากรในจังหวัด${mappedProvinceName}${growthDescription}ร้อยละ ${Math.abs(growthPercent).toFixed(1)} 
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
    const growthDescription = growthPercent >= 0 ? 
      'มีแนวโน้มเพิ่มขึ้น ซึ่งอาจช่วยให้ความสามารถในการจับจ่ายด้านที่อยู่อาศัยของครัวเรือนส่วนใหญ่ปรับตัวดีขึ้น' : 
      'มีแนวโน้มลดลง ซึ่งส่งผลให้ความสามารถในการจับจ่ายด้านที่อยู่อาศัยของครัวเรือนส่วนใหญ่ถดถอยลง';
      
    return `ในช่วงปี พ.ศ. ${startYear + 543} ถึง พ.ศ. ${endYear + 543} จำนวนครัวเรือนในจังหวัด${mappedProvinceName}${growthDescription}ร้อยละ ${Math.abs(growthPercent).toFixed(1)} 
            จาก ${new Intl.NumberFormat('th-TH').format(startHouseholds)} ครัวเรือน เป็น ${new Intl.NumberFormat('th-TH').format(endHouseholds)} ครัวเรือน`;
  };
  
  // Generate income trend description
  const getIncomeTrend = () => {
    if (!incomeData || incomeData.length < 2) return 'ไม่พบข้อมูลรายได้';
    
    const firstYear = incomeData[0];
    const latestYear = incomeData[incomeData.length - 1];
    
    const startYear = firstYear.year;
    const endYear = latestYear.year;
    const startIncome = firstYear.income;
    const endIncome = latestYear.income;
    
    const growthPercent = ((endIncome / startIncome) - 1) * 100;
    const growthDescription = growthPercent >= 0 ? 'เพิ่มขึ้น' : 'ลดลง';
    
    return `ในช่วงปี พ.ศ. ${startYear + 543} ถึง พ.ศ. ${endYear + 543} รายได้ครัวเรือนมัธยฐานในจังหวัด${mappedProvinceName}${growthDescription}ร้อยละ ${Math.abs(growthPercent).toFixed(1)} 
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
    
    return `ในช่วงปี พ.ศ. ${startYear + 543} ถึง พ.ศ. ${endYear + 543} จำนวนที่อยู่อาศัยทั้งหมดในจังหวัด${mappedProvinceName}${growthDescription}ร้อยละ ${Math.abs(growthPercent).toFixed(1)} 
            จาก ${new Intl.NumberFormat('th-TH').format(startTotal)} หน่วย เป็น ${new Intl.NumberFormat('th-TH').format(endTotal)} หน่วย 
            โดยประเภทที่อยู่อาศัยส่วนใหญ่เป็น${dominantType[0]} คิดเป็นร้อยละ ${dominantPercentage} ของจำนวนที่อยู่อาศัยทั้งหมด`;
  };

  // NEW: Generate housing affordability analysis
  const getAffordabilityAnalysis = () => {
    if (!housingAffordabilityData || housingAffordabilityData.length === 0) {
      return 'ไม่พบข้อมูลความสามารถในการซื้อที่อยู่อาศัย';
    }

    // Calculate average housing burden by quintile
    const quintileData = {};
    housingAffordabilityData.forEach(record => {
      const quintile = record.Quintile;
      if (!quintileData[quintile]) {
        quintileData[quintile] = {
          totalBurden: 0,
          count: 0,
          totalExpense: 0
        };
      }
      quintileData[quintile].totalBurden += parseFloat(record.Total_Hburden || 0);
      quintileData[quintile].totalExpense += parseFloat(record.Exp_house || 0);
      quintileData[quintile].count += 1;
    });

    // Find quintile with highest and lowest burden
    let highestBurden = { quintile: 1, avg: 0 };
    let lowestBurden = { quintile: 1, avg: 100 };

    Object.entries(quintileData).forEach(([quintile, data]) => {
      const avgBurden = data.count > 0 ? data.totalBurden / data.count : 0;
      if (avgBurden > highestBurden.avg) {
        highestBurden = { quintile: parseInt(quintile), avg: avgBurden };
      }
      if (avgBurden < lowestBurden.avg && avgBurden > 0) {
        lowestBurden = { quintile: parseInt(quintile), avg: avgBurden };
      }
    });

    // Calculate average housing expenditure
    const totalExpense = Object.values(quintileData).reduce((sum, data) => sum + data.totalExpense, 0);
    const totalRecords = Object.values(quintileData).reduce((sum, data) => sum + data.count, 0);
    const avgExpense = totalRecords > 0 ? totalExpense / totalRecords : 0;

    return `จากการวิเคราะห์ความสามารถในการซื้อที่อยู่อาศัยในจังหวัด${mappedProvinceName} พบว่า กลุ่มประชากรที่มีรายได้น้อย (ควินไทล์ที่ ${highestBurden.quintile}) 
            มีภาระค่าที่อยู่อาศัยสูงสุด คิดเป็นร้อยละ ${highestBurden.avg.toFixed(1)} ของรายได้ ในขณะที่กลุ่มประชากรที่มีรายได้สูง (ควินไทล์ที่ ${lowestBurden.quintile}) 
            มีภาระค่าที่อยู่อาศัยต่ำสุด คิดเป็นร้อยละ ${lowestBurden.avg.toFixed(1)} ของรายได้ โดยค่าใช้จ่าายเฉลี่ยสำหรับที่อยู่อาศัยอยู่ที่ 
            ${new Intl.NumberFormat('th-TH').format(avgExpense)} บาทต่อเดือน`;
  };

  // NEW: Generate housing demand analysis  
  const getDemandAnalysis = () => {
    if (!housingDemandData || housingDemandData.length === 0) {
      return 'ไม่พบข้อมูลความต้องการที่อยู่อาศัย';
    }

    // Group by demand type
    const demandByType = {};
    housingDemandData.forEach(record => {
      const demandType = record.demand_type;
      if (!demandByType[demandType]) {
        demandByType[demandType] = {
          totalDemand: 0,
          count: 0,
          currentTypes: new Set(),
          futureTypes: new Set()
        };
      }
      demandByType[demandType].totalDemand += parseFloat(record.demand || 0);
      demandByType[demandType].count += 1;
      demandByType[demandType].currentTypes.add(record.current_house_type);
      demandByType[demandType].futureTypes.add(record.future_house_type);
    });

    // Find the highest demand group
    let highestDemand = { type: '', demand: 0 };
    Object.entries(demandByType).forEach(([type, data]) => {
      if (data.totalDemand > highestDemand.demand) {
        highestDemand = { type, demand: data.totalDemand };
      }
    });

    // Calculate total demand
    const totalDemand = Object.values(demandByType).reduce((sum, data) => sum + data.totalDemand, 0);

    // Analysis of preference shifts
    let preferenceShift = '';
    const firstJobberData = demandByType['First Jobber'];
    if (firstJobberData) {
      const currentTypes = Array.from(firstJobberData.currentTypes);
      const futureTypes = Array.from(firstJobberData.futureTypes);
      
      if (currentTypes.length > 0 && futureTypes.length > 0) {
        preferenceShift = ` กลุ่ม First Jobber แสดงความต้องการเปลี่ยนแปลงจากที่อยู่อาศัยประเภท ${currentTypes[0]} เป็น ${futureTypes[0]}`;
      }
    }

    return `จากการวิเคราะห์ความต้องการที่อยู่อาศัยในจังหวัด${mappedProvinceName} พบว่า กลุ่ม ${highestDemand.type} มีความต้องการที่อยู่อาศัยสูงสุด 
            คิดเป็น ${new Intl.NumberFormat('th-TH').format(highestDemand.demand)} หน่วย จากความต้องการรวมทั้งหมด 
            ${new Intl.NumberFormat('th-TH').format(totalDemand)} หน่วย${preferenceShift} 
            ซึ่งสะท้อนให้เห็นถึงการเปลี่ยนแปลงรูปแบบความต้องการที่อยู่อาศัยของประชากรในพื้นที่`;
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
    
    return `การวิเคราะห์ภาระค่าใช้จ่ายด้านที่อยู่อาศัยในจังหวัด${mappedProvinceName}แสดงให้เห็นถึงความแตกต่างของภาระค่าใช้จ่ายระหว่างกลุ่มรายได้ต่างๆ อย่างมีนัยสำคัญ ${housingExpText}`;
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
    
    return `การดำเนินนโยบายด้านที่อยู่อาศัยในจังหวัด${mappedProvinceName}ในปัจจุบันมี ${policyData.length} นโยบาย ประกอบด้วย 
            ${activePolicies} นโยบายที่ดำเนินการอยู่ ${pendingPolicies} นโยบายรอดำเนินการ และ ${inactivePolicies} นโยบายที่ยกเลิกแล้ว 
            โดยแบ่งตามกรอบแนวคิด 3S Model ได้เป็น ด้านอุปทาน (Supply) ${supplyPolicies} นโยบาย ด้านการอุดหนุน (Subsidy) ${subsidyPolicies} นโยบาย 
            และด้านเสถียรภาพ (Stability) ${stabilityPolicies} นโยบาย`;
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">กรุณารอสักครู่...</p>
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
          <p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
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
          <h2 className="text-xl font-bold">สถานการณ์ที่อยู่อาศัยจังหวัด{mappedProvinceName}</h2>
          <p className="text-sm mt-1">จัดทำเมื่อวันที่ {formattedDate}</p>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            เพื่อประเมินความต้องการและความสามารถในการเข้าถึงที่อยู่อาศัยของประชากรในจังหวัด{mappedProvinceName} 
            รายงานฉบับนี้จัดทำขึ้นโดยการรวบรวมและวิเคราะห์ข้อมูลทางสถิติจากหน่วยงานต่างๆ 
            ทั้งข้อมูลประชากร ครัวเรือน รายได้ ค่าใช้จ่าย อุปทานที่อยู่อาศัย ความสามารถในการซื้อที่อยู่อาศัย 
            ความต้องการที่อยู่อาศัย และนโยบายที่เกี่ยวข้อง เพื่อใช้เป็นข้อมูลประกอบการวางแผนและการตัดสินใจ
            ของหน่วยงานที่เกี่ยวข้อง
          </p>
          
          {/* Population Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">สถานการณ์ประชากรและครัวเรือน</h3>
            <p className="text-gray-700 mb-4">{getPopulationTrend()}</p>
            <p className="text-gray-700">{getHouseholdTrend()}</p>
            
            {/* Summary Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border-l-4 border-blue-200 pl-4 bg-blue-50 p-3 rounded-r-md">
                <p className="text-sm text-blue-800 font-medium">ข้อมูลสำคัญ:</p>
                <div className="text-sm text-gray-700">
                  ประชากรปัจจุบัน: {populationData.length > 0 ? 
                    new Intl.NumberFormat('th-TH').format(populationData[populationData.length - 1].population) : 'ไม่ระบุ'} คน<br/>
                  ครัวเรือนปัจจุบัน: {householdData.length > 0 ? 
                    new Intl.NumberFormat('th-TH').format(householdData[householdData.length - 1].household) : 'ไม่ระบุ'} ครัวเรือน<br/>
                  ข้อมูลล่าสุด: ปี พ.ศ. {populationData.length > 0 ? populationData[populationData.length - 1].year + 543 : ''}
                </div>
              </div>
              
              <div className="border-l-4 border-green-200 pl-4 bg-green-50 p-3 rounded-r-md">
                <p className="text-sm text-green-800 font-medium">แนวโน้ม:</p>
                <p className="text-sm text-gray-700">
                  {populationData.length > 0 && householdData.length > 0 && 
                    `อัตราส่วนระหว่างประชากรต่อครัวเรือนในจังหวัด${mappedProvinceName}อยู่ที่ประมาณ 
                    ${(populationData[populationData.length - 1].population / 
                       parseInt(householdData[householdData.length - 1].household)).toFixed(2)} คนต่อครัวเรือน 
                    ซึ่งสะท้อนให้เห็นถึงขนาดครัวเรือนเฉลี่ยในพื้นที่`}
                </p>
              </div>
            </div>
          </div>
          
          {/* Income Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">สถานการณ์รายได้ครัวเรือน</h3>
            <p className="text-gray-700 mb-4">{getIncomeTrend()}</p>
            
            {/* Income Chart */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">แนวโน้มรายได้ครัวเรือนมัธยฐาน</h4>
              </div>
              <div className="p-4" style={{ height: "250px" }}>
                {incomeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={incomeData.map(item => ({
                        year: item.year + 543,
                        income: item.income
                      }))}
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
                        formatter={(value) => new Intl.NumberFormat('th-TH').format(value) + ' บาท'}
                        labelFormatter={(value) => `ปี พ.ศ. ${value}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#2ca02c"
                        fill="#2ca02c"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">ไม่มีข้อมูลรายได้</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-l-4 border-yellow-200 pl-4 bg-yellow-50 p-3 rounded-r-md">
              <p className="text-sm text-yellow-800 font-medium">การวิเคราะห์:</p>
              <p className="text-sm text-gray-700">
                รายได้ครัวเรือนมัธยฐานเป็นตัวชี้วัดสำคัญในการประเมินความสามารถในการซื้อที่อยู่อาศัยของประชากร โดยทั่วไป 
                ค่าใช้จ่ายด้านที่อยู่อาศัยไม่ควรเกิน 30% ของรายได้ครัวเรือนเพื่อให้ครัวเรือนมีความมั่นคงทางการเงิน
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
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={housingSupplyData.map(item => ({
                          ...item,
                          year: item.year + 543
                        }))}
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
                          labelFormatter={(value) => `ปี พ.ศ. ${value}`}
                        />
                        {housingCategories.map((category, index) => (
                          <Area
                            key={category.name}
                            type="monotone"
                            dataKey={category.name}
                            stackId="1"
                            stroke={`hsl(${index * 60}, 70%, 50%)`}
                            fill={`hsl(${index * 60}, 70%, 50%)`}
                            fillOpacity={0.8}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">ไม่มีข้อมูลที่อยู่อาศัย</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Housing Units by Type - Current Year */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700">การกระจายที่อยู่อาศัยตามประเภท</h4>
                </div>
                <div className="p-4" style={{ height: "250px" }}>
                  {housingSupplyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={housingCategories.map((category, index) => ({
                            name: category.name,
                            value: housingSupplyData[housingSupplyData.length - 1][category.name] || 0,
                            fill: `hsl(${index * 60}, 70%, 50%)`
                          })).filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {housingCategories.map((category, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => new Intl.NumberFormat('th-TH').format(value) + ' หน่วย'} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">ไม่มีข้อมูลที่อยู่อาศัย</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-l-4 border-red-200 pl-4 bg-red-50 p-3 rounded-r-md">
              <p className="text-sm text-red-800 font-medium">ข้อค้นพบสำคัญ:</p>
              <p className="text-sm text-gray-700">
                {housingSupplyData.length > 0 && householdData.length > 0 && 
                  `อัตราส่วนระหว่างจำนวนที่อยู่อาศัยต่อจำนวนครัวเรือนในจังหวัด${mappedProvinceName}อยู่ที่ประมาณ 
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

          {/* NEW: Housing Affordability Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">การวิเคราะห์ความสามารถในการซื้อที่อยู่อาศัย</h3>
            <p className="text-gray-700 mb-4">{getAffordabilityAnalysis()}</p>
            
            {/* Affordability Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Housing Burden by Quintile */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700">ภาระค่าที่อยู่อาศัยตามกลุ่มรายได้</h4>
                </div>
                <div className="p-4" style={{ height: "250px" }}>
                  {housingAffordabilityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Array.from({length: 5}, (_, i) => {
                          const quintile = i + 1;
                          const quintileRecords = housingAffordabilityData.filter(r => r.Quintile === quintile);
                          const avgBurden = quintileRecords.length > 0 
                            ? quintileRecords.reduce((sum, r) => sum + parseFloat(r.Total_Hburden || 0), 0) / quintileRecords.length 
                            : 0;
                          return {
                            quintile: `ควินไทล์ ${quintile}`,
                            burden: avgBurden
                          };
                        })}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="quintile" 
                          tick={{ fontSize: 10 }}
                          tickSize={5}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickSize={5}
                          domain={[0, 'dataMax']}
                        />
                        <Tooltip 
                          formatter={(value) => `${value.toFixed(1)}%`}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar 
                          dataKey="burden" 
                          fill="#ff7f0e"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">ไม่มีข้อมูลความต้องการ</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-l-4 border-green-200 pl-4 bg-green-50 p-3 rounded-r-md">
              <p className="text-sm text-green-800 font-medium">📊 การวิเคราะห์เพิ่มเติม:</p>
              <p className="text-sm text-gray-700">
                ความต้องการที่อยู่อาศัยแตกต่างกันตามช่วงอายุและสถานะการทำงาน โดยกลุ่ม First Jobber มักต้องการที่อยู่อาศัย
                ในพื้นที่ใกล้แหล่งงาน ในขณะที่ผู้สูงอายุมีความต้องการที่อยู่อาศัยที่เหมาะสมกับวัยและสภาพร่างกาย 
                การวางแผนที่อยู่อาศัยควรคำนึงถึงความแตกต่างเหล่านี้
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
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(expenditureData).map(([quintile, data]) => {
                        const housingExpIds = [1, 2, 3];
                        const housingExps = data.filter(exp => housingExpIds.includes(exp.expenditure_id));
                        const totalAmount = housingExps.reduce((sum, exp) => sum + exp.amount, 0);
                        return {
                          quintile: `ควินไทล์ ${quintile}`,
                          amount: totalAmount
                        };
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="quintile" 
                        tick={{ fontSize: 12 }}
                        tickSize={5}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickSize={5}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value) => `${value.toFixed(1)}%`}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="#17becf"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">ไม่มีข้อมูลค่าใช้จ่าย</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-l-4 border-orange-200 pl-4 bg-orange-50 p-3 rounded-r-md">
              <p className="text-sm text-orange-800 font-medium">⚠️ ข้อค้นพบสำคัญ:</p>
              <p className="text-sm text-gray-700">
                ความแตกต่างของภาระค่าใช้จ่ายด้านที่อยู่อาศัยระหว่างกลุ่มรายได้ต่างๆ ชี้ให้เห็นถึงความจำเป็นในการมีมาตรการสนับสนุน
                ด้านที่อยู่อาศัยที่มีราคาเหมาะสมสำหรับครัวเรือนรายได้น้อยและปานกลางในจังหวัด{mappedProvinceName}อย่างเร่งด่วน
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
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { 
                              name: 'ดำเนินการอยู่', 
                              value: policyData.filter(p => p.Status === 'Active').length,
                              fill: '#2ca02c'
                            },
                            { 
                              name: 'รอดำเนินการ', 
                              value: policyData.filter(p => p.Status === 'Pending').length,
                              fill: '#ff7f0e'
                            },
                            { 
                              name: 'ยกเลิก/หยุดชะงัก', 
                              value: policyData.filter(p => p.Status === 'Inactive').length,
                              fill: '#d62728'
                            }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        />
                        <Tooltip formatter={(value) => `${value} นโยบาย`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">ไม่มีข้อมูลนโยบาย</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Policy Type Chart */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700">ประเภทนโยบายตาม 3S Model</h4>
                </div>
                <div className="p-4" style={{ height: "250px" }}>
                  {policyData.length > 0 ? (
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
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">ไม่มีข้อมูลนโยบาย</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-l-4 border-indigo-200 pl-4 bg-indigo-50 p-3 rounded-r-md">
              <p className="text-sm text-indigo-800 font-medium">🏛️ การประเมินนโยบาย:</p>
              <p className="text-sm text-gray-700">
                การกระจายนโยบายตาม 3S Model แสดงให้เห็นถึงการมุ่งเน้นของภาครัฐในแต่ละด้าน โดยควรมีความสมดุลระหว่าง
                การเพิ่มอุปทาน การให้การอุดหนุน และการรักษาเสถียรภาพของตลาดที่อยู่อาศัยเพื่อความยั่งยืนระยะยาว
              </p>
            </div>
          </div>

          {/* NEW: Cross-Analysis Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">การวิเคราะห์เชื่อมโยง</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Supply vs Demand Analysis */}
              <div className="border-l-4 border-teal-200 pl-4 bg-teal-50 p-4 rounded-r-md">
                <h4 className="text-sm font-medium text-teal-800 mb-2">🔄 อุปทาน vs ความต้องการ</h4>
                <p className="text-sm text-gray-700">
                  {housingSupplyData.length > 0 && housingDemandData.length > 0 ? (
                    (() => {
                      const latestSupply = housingCategories.reduce((sum, category) => 
                        sum + (housingSupplyData[housingSupplyData.length - 1][category.name] || 0), 0);
                      const totalDemand = housingDemandData.reduce((sum, record) => 
                        sum + parseFloat(record.demand || 0), 0);
                      const ratio = latestSupply / totalDemand;
                      
                      return `อัตราส่วนอุปทานต่อความต้องการอยู่ที่ ${ratio.toFixed(2)}:1 ${
                        ratio > 1.2 ? 'ซึ่งแสดงถึงภาวะอุปทานส่วนเกิน อาจส่งผลให้ราคาปรับตัวลง' :
                        ratio < 0.8 ? 'ซึ่งแสดงถึงภาวะขาดแคลนอุปทาน อาจส่งผลให้ราคาเพิ่มสูงขึ้น' :
                        'ซึ่งอยู่ในระดับสมดุล แต่ควรติดตามอย่างใกล้ชิด'
                      }`;
                    })()
                  ) : 'ไม่สามารถวิเคราะห์ได้เนื่องจากข้อมูลไม่ครบถ้วน'}
                </p>
              </div>
              
              {/* Affordability vs Income Analysis */}
              <div className="border-l-4 border-pink-200 pl-4 bg-pink-50 p-4 rounded-r-md">
                <h4 className="text-sm font-medium text-pink-800 mb-2">💰 ความสามารถซื้อ vs รายได้</h4>
                <p className="text-sm text-gray-700">
                  {incomeData.length > 0 && housingAffordabilityData.length > 0 ? (
                    (() => {
                      const latestIncome = incomeData[incomeData.length - 1].income;
                      const avgBurden = housingAffordabilityData.reduce((sum, record) => 
                        sum + parseFloat(record.Total_Hburden || 0), 0) / housingAffordabilityData.length;
                      
                      return `ด้วยรายได้มัธยฐาน ${new Intl.NumberFormat('th-TH').format(latestIncome)} บาท/เดือน และภาระค่าที่อยู่อาศัยเฉลี่ย ${avgBurden.toFixed(1)}% ของรายได้ ${
                        avgBurden > 30 ? 'ซึ่งเกินมาตรฐานสากล (30%) บ่งชี้ถึงปัญหาความสามารถในการซื้อ' :
                        'ซึ่งอยู่ในเกณฑ์ที่ยอมรับได้ตามมาตรฐานสากล'
                      }`;
                    })()
                  ) : 'ไม่สามารถวิเคราะห์ได้เนื่องจากข้อมูลไม่ครบถ้วน'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary and Recommendations Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">สรุปและข้อเสนอแนะเชิงนโยบาย</h3>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    จุดแข็ง
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• มีข้อมูลที่อยู่อาศัยครบถ้วนในทุกประเภท</li>
                    <li>• สามารถวิเคราะห์ความต้องการแยกตามกลุ่มประชากร</li>
                    <li>• มีการติดตามแนวโน้มในระยะยาว</li>
                    <li>• มีนโยบายหลากหลายครอบคลุม 3S Model</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    ความท้าทาย
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• ความเหลื่อมล้ำในการเข้าถึงที่อยู่อาศัย</li>
                    <li>• ความต้องการแตกต่างตามกลุ่มอายุและอาชีพ</li>
                    <li>• ภาระค่าใช้จ่ายที่เพิ่มสูงขึ้น</li>
                    <li>• การประสานงานระหว่างหน่วยงาน</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    โอกาส
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• การใช้เทคโนโลยีในการก่อสร้าง</li>
                    <li>• การพัฒนาระบบขนส่งสาธารณะ</li>
                    <li>• การสนับสนุนจากภาครัฐ</li>
                    <li>• การมีส่วนร่วมของภาคเอกชน</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-blue-200">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  ข้อเสนอแนะเชิงนโยบาย
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">ระยะสั้น (1-2 ปี)</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• เร่งพัฒนาโครงการที่อยู่อาศัยเพื่อกลุ่มรายได้น้อย</li>
                      <li>• ปรับปรุงระบบการเงินเพื่อช่วยเหลือการซื้อที่อยู่อาศัย</li>
                      <li>• เสริมสร้างความร่วมมือระหว่างภาครัฐและเอกชน</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">ระยะยาว (3-5 ปี)</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• พัฒนาระบบการบริหารจัดการที่ดินอย่างยั่งยืน</li>
                      <li>• ส่งเสริมการใช้เทคโนโลยีสีเขียวในการก่อสร้าง</li>
                      <li>• สร้างระบบติดตามและประเมินผลที่มีประสิทธิภาพ</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">ตัวชี้วัดสำคัญ</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {housingSupplyData.length > 0 && householdData.length > 0 ? 
                    (housingCategories.reduce((sum, category) => 
                      sum + (housingSupplyData[housingSupplyData.length - 1][category.name] || 0), 0) / 
                     parseInt(householdData[householdData.length - 1].household)).toFixed(2) : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">อัตราส่วนที่อยู่อาศัย:ครัวเรือน</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {housingAffordabilityData.length > 0 ? 
                    `${(housingAffordabilityData.reduce((sum, record) => 
                      sum + parseFloat(record.Total_Hburden || 0), 0) / housingAffordabilityData.length).toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">ภาระที่อยู่อาศัยเฉลี่ย</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {incomeData.length > 0 ? 
                    new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(incomeData[incomeData.length - 1].income) : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">รายได้มัธยฐาน (บาท/เดือน)</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {policyData.length > 0 ? policyData.filter(p => p.Status === 'Active').length : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">นโยบายที่ดำเนินการอยู่</div>
              </div>
            </div>
          </div>
          
          {/* Data Sources Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">แหล่งข้อมูลและวิธีการ</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">แหล่งข้อมูล</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• สำนักงานสถิติแห่งชาติ: ข้อมูลประชากร ครัวเรือน และรายได้</p>
                  <p>• การเคหะแห่งชาติ: ข้อมูลที่อยู่อาศัยและนโยบาย</p>
                  <p>• กรมที่ดิน และกรมธนารักษ์: ข้อมูลราคาที่ดินและที่อยู่อาศัย</p>
                  <p>• ธนาคารแห่งประเทศไทย: ข้อมูลเครดิตและการเงิน</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">วิธีการวิเคราะห์</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• การวิเคราะห์แนวโน้มข้อมูลอนุกรมเวลา</p>
                  <p>• การประเมินความสามารถในการซื้อตามมาตรฐานสากล</p>
                  <p>• การวิเคราะห์ความต้องการตามกลุ่มเป้าหมาย</p>
                  <p>• การประเมินประสิทธิผลของนโยบายตาม 3S Model</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 text-center text-sm text-gray-600">
          <p>รายงานนี้จัดทำขึ้นเพื่อการศึกษาและการวางแผนนโยบาย</p>
          <p className="mt-1">© 2025 ระบบข้อมูลที่อยู่อาศัย กรมที่ดิน และการเคหะแห่งชาติ</p>
          <p className="mt-1 text-xs">ข้อมูลอัปเดตแบบเรียลไทม์จากระบบฐานข้อมูลกลาง</p>
        </div>
        
        {/* Action Buttons */}
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <p className="text-gray-600 mb-4">ดาวน์โหลดรายงานหรือแชร์ข้อมูลเพื่อการประชาสัมพันธ์และการเผยแพร่</p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              พิมพ์รายงาน
            </button>
            
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `รายงานสถานการณ์ที่อยู่อาศัยจังหวัด${mappedProvinceName}`,
                    text: `รายงานสถานการณ์ที่อยู่อาศัยจังหวัด${mappedProvinceName} วิเคราะห์ข้อมูลประชากร รายได้ อุปทาน ความสามารถในการซื้อ และความต้องการที่อยู่อาศัย`,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('คัดลอกลิงก์เรียบร้อยแล้ว');
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              แชร์รายงาน
            </button>
            
            <button 
              onClick={() => {
                const csvData = housingSupplyData.map(item => ({
                  ปี: item.year + 543,
                  ...housingCategories.reduce((acc, category) => {
                    acc[category.name] = item[category.name] || 0;
                    return acc;
                  }, {})
                }));
                
                const csvContent = "data:text/csv;charset=utf-8," 
                  + Object.keys(csvData[0]).join(",") + "\n"
                  + csvData.map(row => Object.values(row).join(",")).join("\n");
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `housing_data_${mappedProvinceName}_${new Date().getFullYear()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              ดาวน์โหลด CSV
            </button>
          </div>
          
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
              onClick={() => window.location.reload()}
              className="inline-flex items-center ml-6 text-gray-600 hover:text-gray-800"
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              รีเฟรชข้อมูล
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
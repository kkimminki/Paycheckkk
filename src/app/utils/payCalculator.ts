export interface WorkRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  isNightShift: boolean;
  isOvertime: boolean;
}

export interface PayCalculation {
  basicPay: number;
  nightShiftPay: number;
  overtimePay: number;
  weeklyHolidayPay: number;
  totalBeforeTax: number;
  tax: number;
  totalAfterTax: number;
}

// 근무 시간 계산 (시간 단위)
export function calculateWorkHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  let minutes = endMin - startMin;
  
  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }
  
  // 자정 넘어가는 경우
  if (hours < 0) {
    hours += 24;
  }
  
  return hours + minutes / 60;
}

// 주휴수당 계산 (주 15시간 이상 근무 시 지급)
export function calculateWeeklyHolidayPay(
  weeklyHours: number,
  hourlyWage: number
): number {
  if (weeklyHours >= 15) {
    // 1주일 평균 근무시간의 1일치 (주 5일 기준)
    const averageDailyHours = weeklyHours / 5;
    return averageDailyHours * hourlyWage;
  }
  return 0;
}

// 급여 계산
export function calculatePay(
  hours: number,
  hourlyWage: number,
  isNightShift: boolean = false,
  isOvertime: boolean = false,
  includeWeeklyHolidayPay: boolean = false,
  weeklyHours: number = 0
): PayCalculation {
  // 기본급
  let basicPay = hours * hourlyWage;
  
  // 야간 가산수당 (22시~06시, 50% 가산)
  let nightShiftPay = 0;
  if (isNightShift) {
    nightShiftPay = basicPay * 0.5;
  }
  
  // 연장 근로 가산수당 (50% 가산)
  let overtimePay = 0;
  if (isOvertime) {
    overtimePay = basicPay * 0.5;
  }
  
  // 주휴수당
  let weeklyHolidayPay = 0;
  if (includeWeeklyHolidayPay) {
    weeklyHolidayPay = calculateWeeklyHolidayPay(weeklyHours, hourlyWage);
  }
  
  const totalBeforeTax = basicPay + nightShiftPay + overtimePay + weeklyHolidayPay;
  
  // 3.3% 세금 (사업소득세)
  const tax = totalBeforeTax * 0.033;
  const totalAfterTax = totalBeforeTax - tax;
  
  return {
    basicPay,
    nightShiftPay,
    overtimePay,
    weeklyHolidayPay,
    totalBeforeTax,
    tax,
    totalAfterTax,
  };
}

// 월간 총 급여 계산
export function calculateMonthlyPay(records: WorkRecord[]): PayCalculation {
  let totalBasicPay = 0;
  let totalNightShiftPay = 0;
  let totalOvertimePay = 0;
  
  records.forEach(record => {
    const hours = calculateWorkHours(record.startTime, record.endTime);
    const pay = calculatePay(
      hours,
      record.hourlyWage,
      record.isNightShift,
      record.isOvertime
    );
    
    totalBasicPay += pay.basicPay;
    totalNightShiftPay += pay.nightShiftPay;
    totalOvertimePay += pay.overtimePay;
  });
  
  // 주휴수당 계산을 위한 주간 근무시간 계산 (간단히 전체 시간을 4주로 나눔)
  const totalHours = records.reduce((sum, record) => {
    return sum + calculateWorkHours(record.startTime, record.endTime);
  }, 0);
  const avgWeeklyHours = totalHours / 4;
  
  const weeklyHolidayPay = calculateWeeklyHolidayPay(avgWeeklyHours, 
    records.length > 0 ? records[0].hourlyWage : 0) * 4; // 4주치
  
  const totalBeforeTax = totalBasicPay + totalNightShiftPay + totalOvertimePay + weeklyHolidayPay;
  const tax = totalBeforeTax * 0.033;
  const totalAfterTax = totalBeforeTax - tax;
  
  return {
    basicPay: totalBasicPay,
    nightShiftPay: totalNightShiftPay,
    overtimePay: totalOvertimePay,
    weeklyHolidayPay,
    totalBeforeTax,
    tax,
    totalAfterTax,
  };
}

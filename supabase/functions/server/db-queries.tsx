/**
 * 데이터베이스 쿼리 모음
 * SQL 스키마에 기반한 실제 쿼리 함수들
 */

import { SupabaseClient } from "jsr:@supabase/supabase-js@2";

// A. 월별 기본급 및 3.3% 세금 계산
export async function calculateMonthlyPay(
  supabase: SupabaseClient,
  employeeId: number,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase.rpc('calculate_monthly_pay', {
    p_employee_id: employeeId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    // RPC가 없으면 직접 쿼리 실행
    const { data: workLogs, error: queryError } = await supabase
      .from('work_logs')
      .select(`
        *,
        employment!inner(
          employee_id,
          hourly_wage
        )
      `)
      .eq('employment.employee_id', employeeId)
      .eq('status', 'APPROVED')
      .gte('work_date', startDate)
      .lte('work_date', endDate);

    if (queryError) throw queryError;

    if (!workLogs || workLogs.length === 0) {
      return {
        employee_id: employeeId,
        work_month: startDate.substring(0, 7),
        total_monthly_hours: 0,
        hourly_wage: 0,
        base_pay: 0,
        tax_deduction: 0,
        final_pay: 0,
      };
    }

    const totalHours = workLogs.reduce((sum, log) => sum + parseFloat(log.total_hours), 0);
    const hourlyWage = (workLogs[0].employment as any).hourly_wage;
    const basePay = totalHours * hourlyWage;
    const taxDeduction = Math.round(basePay * 0.033);
    const finalPay = Math.round(basePay * 0.967);

    return {
      employee_id: employeeId,
      work_month: startDate.substring(0, 7),
      total_monthly_hours: totalHours,
      hourly_wage: hourlyWage,
      base_pay: basePay,
      tax_deduction: taxDeduction,
      final_pay: finalPay,
    };
  }

  return data;
}

// B. 주휴수당 계산 (주 15시간 이상 조건)
export async function calculateWeeklyHolidayPay(
  supabase: SupabaseClient,
  employeeId: number,
  startDate: string,
  endDate: string
) {
  const { data: workLogs, error } = await supabase
    .from('work_logs')
    .select(`
      *,
      employment!inner(
        employee_id,
        hourly_wage
      )
    `)
    .eq('employment.employee_id', employeeId)
    .eq('status', 'APPROVED')
    .gte('work_date', startDate)
    .lte('work_date', endDate);

  if (error) throw error;

  // 주차별로 그룹화
  const weeklyData: { [key: string]: { hours: number; wage: number } } = {};

  workLogs?.forEach((log) => {
    const date = new Date(log.work_date);
    // ISO 주차 계산
    const weekNumber = getISOWeek(date);
    const weekKey = `${date.getFullYear()}-W${weekNumber}`;

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        hours: 0,
        wage: (log.employment as any).hourly_wage,
      };
    }
    weeklyData[weekKey].hours += parseFloat(log.total_hours);
  });

  // 주휴수당 계산
  const results = Object.entries(weeklyData).map(([week, data]) => {
    const weeklyHolidayPay =
      data.hours >= 15 ? Math.round((data.hours / 40) * 8 * data.wage) : 0;

    return {
      employee_id: employeeId,
      week_number: week,
      weekly_hours: data.hours,
      weekly_holiday_pay: weeklyHolidayPay,
    };
  });

  return results;
}

// C. 야간수당 계산
export async function calculateNightPay(
  supabase: SupabaseClient,
  employeeId: number,
  startDate: string,
  endDate: string
) {
  const { data: workLogs, error } = await supabase
    .from('work_logs')
    .select(`
      *,
      employment!inner(
        employee_id,
        hourly_wage
      )
    `)
    .eq('employment.employee_id', employeeId)
    .eq('status', 'APPROVED')
    .gte('work_date', startDate)
    .lte('work_date', endDate);

  if (error) throw error;

  const results = workLogs?.map((log) => {
    const nightHours = calculateNightHours(log.start_time, log.end_time);
    const hourlyWage = (log.employment as any).hourly_wage;
    const extraNightAllowance = Math.round(nightHours * hourlyWage * 0.5);

    return {
      employee_id: employeeId,
      work_date: log.work_date,
      night_hours: nightHours,
      extra_night_allowance: extraNightAllowance,
    };
  }) || [];

  return results;
}

// D. 근로장려금 수급 자격 체크
export async function checkSubsidy(
  supabase: SupabaseClient,
  employeeId: number,
  year: number
) {
  const { data: workLogs, error } = await supabase
    .from('work_logs')
    .select(`
      *,
      employment!inner(
        employee_id,
        hourly_wage
      )
    `)
    .eq('employment.employee_id', employeeId)
    .eq('status', 'APPROVED')
    .gte('work_date', `${year}-01-01`)
    .lte('work_date', `${year}-12-31`);

  if (error) throw error;

  const yearlyTotalIncome = workLogs?.reduce((sum, log) => {
    const hours = parseFloat(log.total_hours);
    const wage = (log.employment as any).hourly_wage;
    return sum + hours * wage;
  }, 0) || 0;

  const isEligible = yearlyTotalIncome < 22000000;

  return {
    employee_id: employeeId,
    target_year: year,
    yearly_total_income: yearlyTotalIncome,
    subsidy_status: isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
  };
}

// 유틸리티 함수: ISO 주차 계산
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// 유틸리티 함수: 야간시간 계산 (22:00 ~ 06:00)
function calculateNightHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let nightMinutes = 0;

  // 시작 시간을 분 단위로 변환
  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  // 자정을 넘어가는 경우
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  // 22:00 ~ 24:00 구간
  const nightStart1 = 22 * 60; // 22:00
  const nightEnd1 = 24 * 60; // 24:00

  // 00:00 ~ 06:00 구간
  const nightStart2 = 0;
  const nightEnd2 = 6 * 60; // 06:00

  // 22:00 ~ 24:00 구간 계산
  if (startMinutes < nightEnd1 && endMinutes > nightStart1) {
    const overlapStart = Math.max(startMinutes, nightStart1);
    const overlapEnd = Math.min(endMinutes, nightEnd1);
    nightMinutes += overlapEnd - overlapStart;
  }

  // 00:00 ~ 06:00 구간 계산 (다음날)
  if (endMinutes > nightEnd1) {
    const nextDayEnd = endMinutes - 24 * 60;
    if (nextDayEnd > nightStart2) {
      const overlapEnd = Math.min(nextDayEnd, nightEnd2);
      nightMinutes += overlapEnd - nightStart2;
    }
  }

  return nightMinutes / 60;
}

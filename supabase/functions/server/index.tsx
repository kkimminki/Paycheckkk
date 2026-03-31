import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as dbQueries from "./db-queries.tsx";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Supabase 클라이언트 초기화
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ===== Utility Functions =====

function calculateWorkHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  let minutes = endMin - startMin;
  
  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }
  
  if (hours < 0) {
    hours += 24;
  }
  
  return hours + minutes / 60;
}

function calculateWeeklyHolidayPay(weeklyHours: number, hourlyWage: number): number {
  if (weeklyHours >= 15) {
    const averageDailyHours = weeklyHours / 5;
    return averageDailyHours * hourlyWage;
  }
  return 0;
}

// ===== API Endpoints =====

// Health check endpoint
app.get("/make-server-b1fa0427/health", (c) => {
  return c.json({ status: "ok" });
});

// GET /calculate-pay: 급여 및 주휴수당 계산기
app.get("/make-server-b1fa0427/calculate-pay", (c) => {
  try {
    const hours = Number(c.req.query('hours')) || 0;
    const hourlyWage = Number(c.req.query('hourlyWage')) || 10000;
    const isNightShift = c.req.query('isNightShift') === 'true';
    const isOvertime = c.req.query('isOvertime') === 'true';
    const includeWeeklyHolidayPay = c.req.query('includeWeeklyHolidayPay') === 'true';
    const weeklyHours = Number(c.req.query('weeklyHours')) || 0;

    let basicPay = hours * hourlyWage;
    let nightShiftPay = isNightShift ? basicPay * 0.5 : 0;
    let overtimePay = isOvertime ? basicPay * 0.5 : 0;
    let weeklyHolidayPay = includeWeeklyHolidayPay ? calculateWeeklyHolidayPay(weeklyHours, hourlyWage) : 0;
    
    const totalBeforeTax = basicPay + nightShiftPay + overtimePay + weeklyHolidayPay;
    const tax = totalBeforeTax * 0.033;
    const totalAfterTax = totalBeforeTax - tax;

    return c.json({
      basicPay,
      nightShiftPay,
      overtimePay,
      weeklyHolidayPay,
      totalBeforeTax,
      tax,
      totalAfterTax,
    });
  } catch (error) {
    console.error('Error calculating pay:', error);
    return c.json({ error: 'Failed to calculate pay' }, 500);
  }
});

// GET /compare-tax: 3.3% vs 4대보험 비교기
app.get("/make-server-b1fa0427/compare-tax", (c) => {
  try {
    const monthlyIncome = Number(c.req.query('monthlyIncome')) || 2000000;

    // 3.3% 사업소득세
    const businessIncomeTax = monthlyIncome * 0.033;
    const netIncome33 = monthlyIncome - businessIncomeTax;

    // 4대보험 (대략적인 계산 - 실제로는 급여 수준에 따라 다름)
    const nationalPension = monthlyIncome * 0.045; // 국민연금 4.5%
    const healthInsurance = monthlyIncome * 0.0354; // 건강보험 3.54%
    const longTermCare = healthInsurance * 0.1295; // 장기요양 (건보의 12.95%)
    const employmentInsurance = monthlyIncome * 0.009; // 고용보험 0.9%
    
    const total4Insurance = nationalPension + healthInsurance + longTermCare + employmentInsurance;
    const netIncome4Insurance = monthlyIncome - total4Insurance;

    return c.json({
      monthlyIncome,
      option33: {
        tax: businessIncomeTax,
        netIncome: netIncome33,
        deductionRate: 3.3,
      },
      option4Insurance: {
        nationalPension,
        healthInsurance,
        longTermCare,
        employmentInsurance,
        totalDeduction: total4Insurance,
        netIncome: netIncome4Insurance,
        deductionRate: (total4Insurance / monthlyIncome) * 100,
      },
      difference: netIncome33 - netIncome4Insurance,
      recommendation: netIncome33 > netIncome4Insurance ? '3.3% 사업소득세가 유리' : '4대보험이 유리',
    });
  } catch (error) {
    console.error('Error comparing tax:', error);
    return c.json({ error: 'Failed to compare tax' }, 500);
  }
});

// GET /calculate-night-pay: 야간수당 계산기
app.get("/make-server-b1fa0427/calculate-night-pay", (c) => {
  try {
    const nightHours = Number(c.req.query('nightHours')) || 0;
    const hourlyWage = Number(c.req.query('hourlyWage')) || 10000;

    const basicPay = nightHours * hourlyWage;
    const nightShiftBonus = basicPay * 0.5; // 50% 가산
    const totalPay = basicPay + nightShiftBonus;

    return c.json({
      nightHours,
      hourlyWage,
      basicPay,
      nightShiftBonus,
      totalPay,
      effectiveHourlyRate: totalPay / nightHours,
    });
  } catch (error) {
    console.error('Error calculating night pay:', error);
    return c.json({ error: 'Failed to calculate night pay' }, 500);
  }
});

// GET /check-subsidy: 근로장려금 수급 체크
app.get("/make-server-b1fa0427/check-subsidy", (c) => {
  try {
    const annualIncome = Number(c.req.query('annualIncome')) || 0;
    const householdType = c.req.query('householdType') || 'single'; // single, couple, family
    const totalAssets = Number(c.req.query('totalAssets')) || 0;

    // 재산 요건: 2.4억원 미만
    const assetRequirement = totalAssets < 240000000;

    // 소득 요건 (2026년 기준 예시)
    let incomeLimit = 0;
    let maxSubsidy = 0;
    
    if (householdType === 'single') {
      incomeLimit = 22000000; // 단독 가구
      maxSubsidy = 1650000;
    } else if (householdType === 'couple') {
      incomeLimit = 26000000; // 홑벌이 가구
      maxSubsidy = 2800000;
    } else {
      incomeLimit = 30000000; // 맞벌이 가구
      maxSubsidy = 3300000;
    }

    const incomeRequirement = annualIncome < incomeLimit;
    const isEligible = assetRequirement && incomeRequirement;

    // 예상 지급액 계산 (간단한 선형 모델)
    let estimatedAmount = 0;
    if (isEligible) {
      const incomeRatio = annualIncome / incomeLimit;
      estimatedAmount = maxSubsidy * (1 - incomeRatio * 0.8); // 소득이 높을수록 감소
    }

    return c.json({
      isEligible,
      requirements: {
        assetRequirement: {
          met: assetRequirement,
          limit: 240000000,
          current: totalAssets,
        },
        incomeRequirement: {
          met: incomeRequirement,
          limit: incomeLimit,
          current: annualIncome,
        },
      },
      estimatedAmount: Math.max(0, Math.floor(estimatedAmount)),
      maxSubsidy,
      message: isEligible 
        ? `근로장려금 수급 가능 예상! 최대 ${maxSubsidy.toLocaleString()}원까지 받을 수 있습니다.`
        : '근로장려금 수급 요건을 충족하지 못했습니다.',
    });
  } catch (error) {
    console.error('Error checking subsidy:', error);
    return c.json({ error: 'Failed to check subsidy eligibility' }, 500);
  }
});

// POST /save-work-log: 근무 기록 KV 스토어에 저장 (레거시)
app.post("/make-server-b1fa0427/save-work-log", async (c) => {
  try {
    const body = await c.req.json();
    const { date, startTime, endTime, hourlyWage, isNightShift, isOvertime } = body;

    if (!date || !startTime || !endTime || !hourlyWage) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const workLogId = `work_log_${date}_${Date.now()}`;
    const workLog = {
      id: workLogId,
      date,
      startTime,
      endTime,
      hourlyWage,
      isNightShift: isNightShift || false,
      isOvertime: isOvertime || false,
      createdAt: new Date().toISOString(),
    };

    // KV 스토어에 저장
    await kv.set(workLogId, workLog);

    console.log(`Work log saved to KV store: ${workLogId}`);
    return c.json({ 
      success: true, 
      message: 'Work log saved successfully',
      workLog,
    });
  } catch (error) {
    console.error('Error saving work log:', error);
    return c.json({ error: 'Failed to save work log' }, 500);
  }
});

// GET /get-work-logs: 저장된 근무 기록 KV 스토어에서 불러오기 (레거시)
app.get("/make-server-b1fa0427/get-work-logs", async (c) => {
  try {
    const year = c.req.query('year');
    const month = c.req.query('month');

    // work_log_ 프리픽스로 모든 근무 기록 가져오기
    const allWorkLogs = await kv.getByPrefix('work_log_');

    let filteredLogs = allWorkLogs;

    // 년/월 필터링
    if (year && month) {
      const datePrefix = `${year}-${String(month).padStart(2, '0')}`;
      filteredLogs = allWorkLogs.filter((log: any) => log.date.startsWith(datePrefix));
    }

    // 날짜순 정렬
    filteredLogs.sort((a: any, b: any) => a.date.localeCompare(b.date));

    return c.json({
      success: true,
      count: filteredLogs.length,
      workLogs: filteredLogs,
    });
  } catch (error) {
    console.error('Error getting work logs from KV store:', error);
    return c.json({ error: 'Failed to get work logs' }, 500);
  }
});

// ===== 데이터베이스 기반 API 엔드포인트 =====

// GET /db/monthly-pay: 데이터베이스에서 월별 급여 조회
app.get("/make-server-b1fa0427/db/monthly-pay", async (c) => {
  try {
    const employeeId = Number(c.req.query('employeeId')) || 2;
    const year = c.req.query('year') || '2026';
    const month = c.req.query('month') || '03';
    
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;

    const result = await dbQueries.calculateMonthlyPay(supabase, employeeId, startDate, endDate);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching monthly pay from database:', error);
    return c.json({ error: 'Failed to fetch monthly pay' }, 500);
  }
});

// GET /db/weekly-holiday-pay: 데이터베이스에서 주휴수당 조회
app.get("/make-server-b1fa0427/db/weekly-holiday-pay", async (c) => {
  try {
    const employeeId = Number(c.req.query('employeeId')) || 2;
    const year = c.req.query('year') || '2026';
    const month = c.req.query('month') || '03';
    
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;

    const results = await dbQueries.calculateWeeklyHolidayPay(supabase, employeeId, startDate, endDate);

    const totalWeeklyHolidayPay = results.reduce((sum, week) => sum + week.weekly_holiday_pay, 0);

    return c.json({
      success: true,
      totalWeeklyHolidayPay,
      weeklyBreakdown: results,
    });
  } catch (error) {
    console.error('Error fetching weekly holiday pay from database:', error);
    return c.json({ error: 'Failed to fetch weekly holiday pay' }, 500);
  }
});

// GET /db/night-pay: 데이터베이스에서 야간수당 조회
app.get("/make-server-b1fa0427/db/night-pay", async (c) => {
  try {
    const employeeId = Number(c.req.query('employeeId')) || 2;
    const year = c.req.query('year') || '2026';
    const month = c.req.query('month') || '03';
    
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;

    const results = await dbQueries.calculateNightPay(supabase, employeeId, startDate, endDate);

    const totalNightPay = results.reduce((sum, day) => sum + day.extra_night_allowance, 0);

    return c.json({
      success: true,
      totalNightPay,
      dailyBreakdown: results,
    });
  } catch (error) {
    console.error('Error fetching night pay from database:', error);
    return c.json({ error: 'Failed to fetch night pay' }, 500);
  }
});

// GET /db/subsidy-check: 데이터베이스에서 근로장려금 자격 조회
app.get("/make-server-b1fa0427/db/subsidy-check", async (c) => {
  try {
    const employeeId = Number(c.req.query('employeeId')) || 2;
    const year = Number(c.req.query('year')) || 2026;

    const result = await dbQueries.checkSubsidy(supabase, employeeId, year);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking subsidy eligibility from database:', error);
    return c.json({ error: 'Failed to check subsidy eligibility' }, 500);
  }
});

// POST /db/create-work-log: 근무 기록 생성 (스키마 기반)
app.post("/make-server-b1fa0427/db/create-work-log", async (c) => {
  try {
    const body = await c.req.json();
    const { employmentId, workDate, startTime, endTime, totalHours, status } = body;

    if (!employmentId || !workDate || !totalHours) {
      return c.json({ error: 'Missing required fields: employmentId, workDate, totalHours' }, 400);
    }

    const { data, error } = await supabase
      .from('work_logs')
      .insert([{
        employment_id: employmentId,
        work_date: workDate,
        start_time: startTime || null,
        end_time: endTime || null,
        total_hours: totalHours,
        status: status || 'PENDING',
      }])
      .select();

    if (error) {
      console.error('Database error creating work log:', error);
      throw error;
    }

    console.log(`Work log created for employment_id ${employmentId} on ${workDate}`);
    return c.json({ 
      success: true, 
      message: 'Work log created successfully',
      data: data[0],
    });
  } catch (error) {
    console.error('Error creating work log:', error);
    return c.json({ error: 'Failed to create work log' }, 500);
  }
});

// GET /db/work-logs: 근무 기록 조회 (스키마 기반)
app.get("/make-server-b1fa0427/db/work-logs", async (c) => {
  try {
    const employeeId = Number(c.req.query('employeeId'));
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const status = c.req.query('status');

    let query = supabase
      .from('work_logs')
      .select(`
        *,
        employment!inner(
          employee_id,
          hourly_wage,
          custom_name,
          workspace:workspaces(workspace_name)
        )
      `);

    if (employeeId) {
      query = query.eq('employment.employee_id', employeeId);
    }

    if (startDate) {
      query = query.gte('work_date', startDate);
    }

    if (endDate) {
      query = query.lte('work_date', endDate);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('work_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching work logs:', error);
      throw error;
    }

    return c.json({
      success: true,
      count: data?.length || 0,
      workLogs: data || [],
    });
  } catch (error) {
    console.error('Error fetching work logs:', error);
    return c.json({ error: 'Failed to fetch work logs' }, 500);
  }
});

Deno.serve(app.fetch);
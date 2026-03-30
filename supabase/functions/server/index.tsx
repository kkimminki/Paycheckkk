import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

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

// POST /save-work-log: 근무 기록 DB 저장
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

    await kv.set(workLogId, workLog);

    console.log(`Work log saved: ${workLogId}`);
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

// GET /get-work-logs: 저장된 근무 기록 전체 불러오기
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
    console.error('Error getting work logs:', error);
    return c.json({ error: 'Failed to get work logs' }, 500);
  }
});

Deno.serve(app.fetch);
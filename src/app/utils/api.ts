import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b1fa0427`;

// API 호출 헬퍼 함수
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`API Error (${endpoint}):`, error);
    throw new Error(`API request failed: ${error}`);
  }

  return response.json();
}

// 급여 계산
export async function calculatePay(params: {
  hours: number;
  hourlyWage: number;
  isNightShift?: boolean;
  isOvertime?: boolean;
  includeWeeklyHolidayPay?: boolean;
  weeklyHours?: number;
}) {
  const query = new URLSearchParams();
  query.append('hours', params.hours.toString());
  query.append('hourlyWage', params.hourlyWage.toString());
  query.append('isNightShift', (params.isNightShift || false).toString());
  query.append('isOvertime', (params.isOvertime || false).toString());
  query.append('includeWeeklyHolidayPay', (params.includeWeeklyHolidayPay || false).toString());
  query.append('weeklyHours', (params.weeklyHours || 0).toString());

  return apiCall(`/calculate-pay?${query.toString()}`);
}

// 3.3% vs 4대보험 비교
export async function compareTax(monthlyIncome: number) {
  return apiCall(`/compare-tax?monthlyIncome=${monthlyIncome}`);
}

// 야간수당 계산
export async function calculateNightPay(nightHours: number, hourlyWage: number) {
  return apiCall(`/calculate-night-pay?nightHours=${nightHours}&hourlyWage=${hourlyWage}`);
}

// 근로장려금 수급 체크
export async function checkSubsidy(params: {
  annualIncome: number;
  householdType: 'single' | 'couple' | 'family';
  totalAssets: number;
}) {
  const query = new URLSearchParams();
  query.append('annualIncome', params.annualIncome.toString());
  query.append('householdType', params.householdType);
  query.append('totalAssets', params.totalAssets.toString());

  return apiCall(`/check-subsidy?${query.toString()}`);
}

// 근무 기록 저장
export async function saveWorkLog(workLog: {
  date: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  isNightShift?: boolean;
  isOvertime?: boolean;
}) {
  return apiCall('/save-work-log', {
    method: 'POST',
    body: JSON.stringify(workLog),
  });
}

// 근무 기록 불러오기
export async function getWorkLogs(year?: number, month?: number) {
  let endpoint = '/get-work-logs';
  if (year && month) {
    endpoint += `?year=${year}&month=${month}`;
  }
  return apiCall(endpoint);
}

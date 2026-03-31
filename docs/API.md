# API 문서

## 🌐 Base URL

```
https://{projectId}.supabase.co/functions/v1/make-server-b1fa0427
```

## 🔑 인증

모든 요청에 다음 헤더가 필요합니다:

```
Authorization: Bearer {publicAnonKey}
```

## 📋 엔드포인트 목록

### 1. 계산기 API (실시간 계산)

#### 1.1 급여 계산

**Endpoint:** `GET /calculate-pay`

**설명:** 입력된 근무 시간과 조건에 따라 급여를 실시간으로 계산합니다.

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| hours | number | Yes | 근무 시간 |
| hourlyWage | number | Yes | 시급 |
| isNightShift | boolean | No | 야간 근무 여부 |
| isOvertime | boolean | No | 연장 근무 여부 |
| includeWeeklyHolidayPay | boolean | No | 주휴수당 포함 여부 |
| weeklyHours | number | No | 주간 근무 시간 |

**응답 예시:**
```json
{
  "basicPay": 100000,
  "nightShiftPay": 50000,
  "overtimePay": 0,
  "weeklyHolidayPay": 16000,
  "totalBeforeTax": 166000,
  "tax": 5478,
  "totalAfterTax": 160522
}
```

#### 1.2 야간수당 계산

**Endpoint:** `GET /calculate-night-pay`

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| nightHours | number | Yes | 야간 근무 시간 |
| hourlyWage | number | Yes | 시급 |

**응답 예시:**
```json
{
  "nightHours": 5,
  "hourlyWage": 10000,
  "basicPay": 50000,
  "nightShiftBonus": 25000,
  "totalPay": 75000,
  "effectiveHourlyRate": 15000
}
```

#### 1.3 세금 비교

**Endpoint:** `GET /compare-tax`

**설명:** 3.3% 사업소득세와 4대보험을 비교합니다.

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| monthlyIncome | number | Yes | 월 수입 |

**응답 예시:**
```json
{
  "monthlyIncome": 2000000,
  "option33": {
    "tax": 66000,
    "netIncome": 1934000,
    "deductionRate": 3.3
  },
  "option4Insurance": {
    "nationalPension": 90000,
    "healthInsurance": 70800,
    "longTermCare": 9169,
    "employmentInsurance": 18000,
    "totalDeduction": 187969,
    "netIncome": 1812031,
    "deductionRate": 9.398
  },
  "difference": 121969,
  "recommendation": "3.3% 사업소득세가 유리"
}
```

#### 1.4 근로장려금 자격 확인

**Endpoint:** `GET /check-subsidy`

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| annualIncome | number | Yes | 연 소득 |
| householdType | string | Yes | 가구 유형 (single/couple/family) |
| totalAssets | number | Yes | 총 자산 |

**응답 예시:**
```json
{
  "isEligible": true,
  "requirements": {
    "assetRequirement": {
      "met": true,
      "limit": 240000000,
      "current": 50000000
    },
    "incomeRequirement": {
      "met": true,
      "limit": 22000000,
      "current": 15000000
    }
  },
  "estimatedAmount": 900000,
  "maxSubsidy": 1650000,
  "message": "근로장려금 수급 가능 예상! 최대 1,650,000원까지 받을 수 있습니다."
}
```

---

### 2. 근무 기록 API (레거시 KV 스토어)

#### 2.1 근무 기록 저장

**Endpoint:** `POST /save-work-log`

**Request Body:**
```json
{
  "date": "2026-03-25",
  "startTime": "09:00",
  "endTime": "18:00",
  "hourlyWage": 10320,
  "isNightShift": false,
  "isOvertime": false
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "Work log saved successfully",
  "workLog": {
    "id": "work_log_2026-03-25_1234567890",
    "date": "2026-03-25",
    "startTime": "09:00",
    "endTime": "18:00",
    "hourlyWage": 10320,
    "isNightShift": false,
    "isOvertime": false,
    "createdAt": "2026-03-25T10:00:00.000Z"
  }
}
```

#### 2.2 근무 기록 조회

**Endpoint:** `GET /get-work-logs`

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| year | string | No | 연도 (예: 2026) |
| month | string | No | 월 (예: 03) |

**응답 예시:**
```json
{
  "success": true,
  "count": 3,
  "workLogs": [
    {
      "id": "work_log_2026-03-23_1234567890",
      "date": "2026-03-23",
      "startTime": "15:00",
      "endTime": "22:00",
      "hourlyWage": 10320,
      "isNightShift": false,
      "isOvertime": false,
      "createdAt": "2026-03-23T10:00:00.000Z"
    }
  ]
}
```

---

### 3. 데이터베이스 API (실제 DB 기반)

#### 3.1 월별 급여 조회

**Endpoint:** `GET /db/monthly-pay`

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| employeeId | number | No | 2 | 근로자 ID |
| year | string | No | 2026 | 연도 |
| month | string | No | 03 | 월 |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "employee_id": 2,
    "work_month": "2026-03",
    "total_monthly_hours": 21,
    "hourly_wage": 10320,
    "base_pay": 216720,
    "tax_deduction": 7152,
    "final_pay": 209568
  }
}
```

#### 3.2 주휴수당 조회

**Endpoint:** `GET /db/weekly-holiday-pay`

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| employeeId | number | No | 2 | 근로자 ID |
| year | string | No | 2026 | 연도 |
| month | string | No | 03 | 월 |

**응답 예시:**
```json
{
  "success": true,
  "totalWeeklyHolidayPay": 41280,
  "weeklyBreakdown": [
    {
      "employee_id": 2,
      "week_number": "2026-W12",
      "weekly_hours": 14,
      "weekly_holiday_pay": 0
    },
    {
      "employee_id": 2,
      "week_number": "2026-W13",
      "weekly_hours": 21,
      "weekly_holiday_pay": 41280
    }
  ]
}
```

#### 3.3 야간수당 조회

**Endpoint:** `GET /db/night-pay`

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| employeeId | number | No | 2 | 근로자 ID |
| year | string | No | 2026 | 연도 |
| month | string | No | 03 | 월 |

**응답 예시:**
```json
{
  "success": true,
  "totalNightPay": 0,
  "dailyBreakdown": [
    {
      "employee_id": 2,
      "work_date": "2026-03-23",
      "night_hours": 0,
      "extra_night_allowance": 0
    }
  ]
}
```

#### 3.4 근로장려금 자격 확인

**Endpoint:** `GET /db/subsidy-check`

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| employeeId | number | No | 2 | 근로자 ID |
| year | number | No | 2026 | 연도 |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "employee_id": 2,
    "target_year": 2026,
    "yearly_total_income": 2580000,
    "subsidy_status": "ELIGIBLE"
  }
}
```

#### 3.5 근무 기록 생성

**Endpoint:** `POST /db/create-work-log`

**Request Body:**
```json
{
  "employmentId": 1,
  "workDate": "2026-03-31",
  "startTime": "15:00:00",
  "endTime": "22:00:00",
  "totalHours": 7.00,
  "status": "PENDING"
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "Work log created successfully",
  "data": {
    "log_id": 4,
    "employment_id": 1,
    "work_date": "2026-03-31",
    "start_time": "15:00:00",
    "end_time": "22:00:00",
    "total_hours": 7.00,
    "status": "PENDING",
    "created_at": "2026-03-31T10:00:00.000Z"
  }
}
```

#### 3.6 근무 기록 조회

**Endpoint:** `GET /db/work-logs`

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| employeeId | number | No | 근로자 ID |
| startDate | string | No | 시작 날짜 (YYYY-MM-DD) |
| endDate | string | No | 종료 날짜 (YYYY-MM-DD) |
| status | string | No | 상태 (PENDING/APPROVED/REJECTED) |

**응답 예시:**
```json
{
  "success": true,
  "count": 3,
  "workLogs": [
    {
      "log_id": 3,
      "employment_id": 1,
      "work_date": "2026-03-30",
      "start_time": "15:00:00",
      "end_time": "22:00:00",
      "total_hours": 7.00,
      "status": "PENDING",
      "created_at": "2026-03-23T10:00:00.000Z",
      "employment": {
        "employee_id": 2,
        "hourly_wage": 10320,
        "custom_name": "월화 편의점 오후알바",
        "workspace": {
          "workspace_name": "편의점 진주점"
        }
      }
    }
  ]
}
```

---

## ❌ 에러 응답

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "error": "에러 메시지"
}
```

**HTTP 상태 코드:**
- `400` - Bad Request (잘못된 요청)
- `401` - Unauthorized (인증 실패)
- `404` - Not Found (리소스 없음)
- `500` - Internal Server Error (서버 오류)

---

## 📝 사용 예시

### JavaScript/TypeScript

```typescript
const projectId = 'your-project-id';
const publicAnonKey = 'your-anon-key';

async function getMonthlyPay(employeeId: number, year: string, month: string) {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-b1fa0427/db/monthly-pay?employeeId=${employeeId}&year=${year}&month=${month}`,
    {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    }
  );
  
  const data = await response.json();
  return data;
}

// 사용
const result = await getMonthlyPay(2, '2026', '03');
console.log(result);
```

### cURL

```bash
# 월별 급여 조회
curl -X GET \
  'https://your-project.supabase.co/functions/v1/make-server-b1fa0427/db/monthly-pay?employeeId=2&year=2026&month=03' \
  -H 'Authorization: Bearer your-anon-key'

# 근무 기록 생성
curl -X POST \
  'https://your-project.supabase.co/functions/v1/make-server-b1fa0427/db/create-work-log' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "employmentId": 1,
    "workDate": "2026-03-31",
    "startTime": "15:00:00",
    "endTime": "22:00:00",
    "totalHours": 7.00,
    "status": "PENDING"
  }'
```

---

## 🔄 Rate Limiting

현재 Rate Limiting은 설정되어 있지 않으나, 프로덕션 환경에서는 적절한 제한을 두는 것을 권장합니다.

---

## 📞 문의

API 관련 문의사항은 GitHub 이슈를 등록해주세요.

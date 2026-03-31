# 데이터베이스 스키마 가이드

## 📊 데이터베이스 구조

Pay-Check은 PostgreSQL 데이터베이스를 사용하며, Supabase를 통해 관리됩니다.

## 테이블 구조

### 1. users (사용자)

근로자와 고용주 정보를 저장합니다.

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('EMPLOYER', 'EMPLOYEE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**필드 설명:**
- `user_id`: 사용자 고유 ID
- `username`: 로그인 아이디
- `password`: 비밀번호 (해시 저장 권장)
- `name`: 실명
- `role`: 역할 (EMPLOYER: 고용주, EMPLOYEE: 근로자)
- `created_at`: 계정 생성일

### 2. workspaces (사업장)

고용주가 운영하는 사업장 정보를 저장합니다.

```sql
CREATE TABLE workspaces (
    workspace_id SERIAL PRIMARY KEY,
    employer_id INTEGER NOT NULL,
    workspace_name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    FOREIGN KEY (employer_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

**필드 설명:**
- `workspace_id`: 사업장 고유 ID
- `employer_id`: 고용주 ID (users 테이블 참조)
- `workspace_name`: 사업장 이름
- `address`: 사업장 주소

### 3. employment (고용 관계)

근로자와 사업장 간의 고용 관계를 나타냅니다.

```sql
CREATE TABLE employment (
    employment_id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    custom_name VARCHAR(100),
    hourly_wage INTEGER NOT NULL,
    tax_type VARCHAR(20) DEFAULT '3.3%',
    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

**필드 설명:**
- `employment_id`: 고용 관계 고유 ID
- `workspace_id`: 사업장 ID
- `employee_id`: 근로자 ID
- `custom_name`: 사용자 정의 이름 (예: "월화 편의점 오후알바")
- `hourly_wage`: 시급
- `tax_type`: 세금 유형 (3.3% 또는 4대보험)

### 4. work_logs (근무 기록)

실제 근무 기록을 저장합니다.

```sql
CREATE TABLE work_logs (
    log_id SERIAL PRIMARY KEY,
    employment_id INTEGER NOT NULL,
    work_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    total_hours NUMERIC(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employment_id) REFERENCES employment(employment_id) ON DELETE CASCADE
);
```

**필드 설명:**
- `log_id`: 근무 기록 고유 ID
- `employment_id`: 고용 관계 ID
- `work_date`: 근무 날짜
- `start_time`: 출근 시간
- `end_time`: 퇴근 시간
- `total_hours`: 총 근무 시간
- `status`: 승인 상태 (PENDING, APPROVED, REJECTED)
- `created_at`: 기록 생성일

### 5. substitute_board (대타 구하기 게시판)

근로자가 대타를 구하기 위한 게시판입니다.

```sql
CREATE TABLE substitute_board (
    board_id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL,
    employment_id INTEGER NOT NULL,
    target_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'LOOKING' CHECK (status IN ('LOOKING', 'FOUND', 'CANCELED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (employment_id) REFERENCES employment(employment_id) ON DELETE CASCADE
);
```

**필드 설명:**
- `board_id`: 게시글 고유 ID
- `requester_id`: 요청자 ID
- `employment_id`: 고용 관계 ID
- `target_date`: 대타가 필요한 날짜
- `title`: 제목
- `content`: 내용
- `status`: 상태 (LOOKING: 찾는 중, FOUND: 찾음, CANCELED: 취소)

## 🔍 인덱스

성능 최적화를 위한 인덱스:

```sql
CREATE INDEX idx_work_logs_date ON work_logs(work_date);
CREATE INDEX idx_work_logs_employment ON work_logs(employment_id);
CREATE INDEX idx_work_logs_status ON work_logs(status);
CREATE INDEX idx_employment_employee ON employment(employee_id);
CREATE INDEX idx_substitute_board_status ON substitute_board(status);
```

## 📝 데이터베이스 마이그레이션

### 초기 설정

1. Supabase 프로젝트를 생성합니다.
2. `/supabase/migrations/001_initial_schema.sql` 파일의 SQL을 실행합니다.
3. 테스트 데이터가 자동으로 삽입됩니다.

### 마이그레이션 실행

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref <your-project-ref>

# 마이그레이션 실행
supabase db push
```

## 🔐 Row Level Security (RLS)

보안을 위해 RLS 정책을 설정하는 것을 권장합니다:

```sql
-- 예시: 근로자는 자신의 근무 기록만 조회 가능
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own work logs"
ON work_logs FOR SELECT
USING (
  employment_id IN (
    SELECT employment_id FROM employment
    WHERE employee_id = auth.uid()
  )
);
```

## 📊 주요 쿼리 예제

### 월별 급여 계산

```sql
SELECT 
    e.employee_id,
    DATE_FORMAT(w.work_date, '%Y-%m') AS work_month,
    SUM(w.total_hours) AS total_monthly_hours,
    e.hourly_wage,
    (SUM(w.total_hours) * e.hourly_wage) AS base_pay,
    ROUND((SUM(w.total_hours) * e.hourly_wage) * 0.033) AS tax_deduction,
    ROUND((SUM(w.total_hours) * e.hourly_wage) * 0.967) AS final_pay
FROM work_logs w
JOIN employment e ON w.employment_id = e.employment_id
WHERE e.employee_id = ? AND w.status = 'APPROVED'
  AND w.work_date BETWEEN ? AND ?
GROUP BY e.employee_id, work_month, e.hourly_wage;
```

### 주휴수당 계산

```sql
SELECT 
    e.employee_id,
    EXTRACT(WEEK FROM w.work_date) AS week_number,
    SUM(w.total_hours) AS weekly_hours,
    CASE 
        WHEN SUM(w.total_hours) >= 15 
        THEN ROUND((SUM(w.total_hours) / 40) * 8 * e.hourly_wage)
        ELSE 0 
    END AS weekly_holiday_pay
FROM work_logs w
JOIN employment e ON w.employment_id = e.employment_id
WHERE e.employee_id = ? AND w.status = 'APPROVED'
  AND w.work_date BETWEEN ? AND ?
GROUP BY e.employee_id, week_number, e.hourly_wage;
```

## 🧪 테스트 데이터

초기 마이그레이션 시 다음 테스트 데이터가 삽입됩니다:

- **사용자**: 고용주 1명 (김점주), 근로자 1명 (박알바)
- **사업장**: 편의점 진주점
- **고용 관계**: 박알바 - 편의점 진주점 (시급 10,320원)
- **근무 기록**: 2026년 3월 23일, 24일, 30일 (각 7시간)
- **대타 게시글**: 3월 31일 대타 구함

## 🔄 백업 및 복구

### 백업

```bash
# Supabase에서 자동 백업 제공
# 수동 백업
supabase db dump -f backup.sql
```

### 복구

```bash
psql -h <host> -U <user> -d <database> -f backup.sql
```

## 📞 문의

데이터베이스 관련 문의사항은 이슈를 등록해주세요.

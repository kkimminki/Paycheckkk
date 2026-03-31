-- ==========================================
-- Pay-Check 데이터베이스 스키마 (PostgreSQL)
-- ==========================================

-- 기존 테이블 삭제 (역순으로)
DROP TABLE IF EXISTS substitute_board CASCADE;
DROP TABLE IF EXISTS work_logs CASCADE;
DROP TABLE IF EXISTS employment CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- 테이블 생성
-- ==========================================

-- 사용자 테이블
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('EMPLOYER', 'EMPLOYEE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사업장 테이블
CREATE TABLE workspaces (
    workspace_id SERIAL PRIMARY KEY,
    employer_id INTEGER NOT NULL,
    workspace_name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    FOREIGN KEY (employer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 고용 관계 테이블
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

-- 근무 기록 테이블
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

-- 대타 구하기 게시판 테이블
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

-- ==========================================
-- 인덱스 생성 (성능 최적화)
-- ==========================================

CREATE INDEX idx_work_logs_date ON work_logs(work_date);
CREATE INDEX idx_work_logs_employment ON work_logs(employment_id);
CREATE INDEX idx_work_logs_status ON work_logs(status);
CREATE INDEX idx_employment_employee ON employment(employee_id);
CREATE INDEX idx_substitute_board_status ON substitute_board(status);

-- ==========================================
-- 테스트용 가상 데이터 삽입
-- ==========================================

INSERT INTO users (username, password, name, role) VALUES
('employer1', '1234', '김점주', 'EMPLOYER'),
('employee1', '1234', '박알바', 'EMPLOYEE');

INSERT INTO workspaces (employer_id, workspace_name, address) VALUES
(1, '편의점 진주점', '경상남도 진주시');

INSERT INTO employment (workspace_id, employee_id, custom_name, hourly_wage, tax_type) VALUES
(1, 2, '월화 편의점 오후알바', 10320, '3.3%');

INSERT INTO work_logs (employment_id, work_date, start_time, end_time, total_hours, status) VALUES
(1, '2026-03-23', '15:00:00', '22:00:00', 7.00, 'APPROVED'),
(1, '2026-03-24', '15:00:00', '22:00:00', 7.00, 'APPROVED'),
(1, '2026-03-30', '15:00:00', '22:00:00', 7.00, 'PENDING');

INSERT INTO substitute_board (requester_id, employment_id, target_date, title, content, status) VALUES
(2, 1, '2026-03-31', '3월 31일 화요일 편의점 대타 구합니다', '개인 사정으로 하루 대타 구합니다. 시급 만원 드릴게요.', 'LOOKING');

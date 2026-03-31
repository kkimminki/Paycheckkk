import { useState, useEffect } from "react";
import { StatCard } from "../components/StatCard";
import { Wallet, Clock, TrendingUp, Target, Loader2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getWorkLogs } from "../utils/api";
import { toast } from "sonner";

export function Dashboard() {
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const currentDate = new Date(2026, 2, 30); // 2026년 3월 30일
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // 근무 기록 불러오기
  useEffect(() => {
    loadAllWorkLogs();
  }, []);

  const loadAllWorkLogs = async () => {
    try {
      setLoading(true);
      const response = await getWorkLogs();
      if (response.success) {
        setWorkLogs(response.workLogs);
      }
    } catch (error) {
      console.error('Failed to load work logs:', error);
      toast.error('근무 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 이번 달 데이터 계산
  const currentMonthLogs = workLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate.getFullYear() === currentYear && logDate.getMonth() + 1 === currentMonth;
  });

  const calculateHours = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    if (hours < 0) hours += 24;
    return hours + minutes / 60;
  };

  const totalHours = currentMonthLogs.reduce((sum, log) => sum + calculateHours(log.startTime, log.endTime), 0);
  const avgHourlyWage = currentMonthLogs.length > 0 
    ? currentMonthLogs.reduce((sum, log) => sum + log.hourlyWage, 0) / currentMonthLogs.length 
    : 10000;
  const monthlyIncome = Math.floor(totalHours * avgHourlyWage);

  // 월별 수입 데이터 생성
  const monthlyData = [];
  for (let m = 1; m <= 6; m++) {
    const monthLogs = workLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getFullYear() === currentYear && logDate.getMonth() + 1 === m;
    });
    const monthHours = monthLogs.reduce((sum, log) => sum + calculateHours(log.startTime, log.endTime), 0);
    const monthWage = monthLogs.length > 0 
      ? monthLogs.reduce((sum, log) => sum + log.hourlyWage, 0) / monthLogs.length 
      : avgHourlyWage;
    monthlyData.push({
      id: `month-${m}`, // 고유 ID 추가
      month: `${m}월`,
      income: Math.floor(monthHours * monthWage),
    });
  }

  const yearlyIncome = monthlyData.reduce((sum, data) => sum + data.income, 0);

  // 주간 근무시간 데이터 (이번 달의 주별)
  const weeklyHours = [];
  for (let week = 0; week < 4; week++) {
    const weekStart = 1 + week * 7;
    const weekEnd = Math.min(weekStart + 6, 31);
    const weekLogs = currentMonthLogs.filter(log => {
      const day = parseInt(log.date.split('-')[2]);
      return day >= weekStart && day <= weekEnd;
    });
    const weekHoursTotal = weekLogs.reduce((sum, log) => sum + calculateHours(log.startTime, log.endTime), 0);
    weeklyHours.push({
      id: `week-${week + 1}`, // 고유 ID 추가
      week: `${week + 1}주`,
      hours: Math.floor(weekHoursTotal),
    });
  }

  const savingsGoal = 10000000;
  const savingsProgress = (yearlyIncome / savingsGoal) * 100;

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">안녕하세요! 👋</h2>
        <p className="text-blue-100">
          {currentMonth}월 수입 현황과 근무 통계를 확인하세요.
        </p>
      </div>

      {/* 주요 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="이번 달 수입"
          value={`₩${monthlyIncome.toLocaleString()}`}
          icon={Wallet}
          description="세전 금액"
          color="blue"
        />
        <StatCard
          title="이번 달 근무시간"
          value={`${Math.floor(totalHours)}시간`}
          icon={Clock}
          description="총 근무시간"
          color="green"
        />
        <StatCard
          title="올해 누적 수입"
          value={`₩${yearlyIncome.toLocaleString()}`}
          icon={TrendingUp}
          description="1월~6월"
          color="purple"
        />
        <StatCard
          title="저축 목표 달성률"
          value={`${savingsProgress.toFixed(1)}%`}
          icon={Target}
          description={`목표: ₩${savingsGoal.toLocaleString()}`}
          color="orange"
        />
      </div>

      {/* 월별 수입 차트 */}
      <div className="bg-white rounded-lg shadow p-6 border">
        <h3 className="text-lg font-semibold mb-4">월별 수입 추이</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData} key="monthly-income-chart">
              <defs>
                <linearGradient id="colorIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid key="grid-monthly" strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis key="xaxis-monthly" dataKey="month" stroke="#6B7280" />
              <YAxis key="yaxis-monthly" stroke="#6B7280" />
              <Tooltip 
                key="tooltip-monthly"
                formatter={(value: number) => `₩${value.toLocaleString()}`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
              <Area 
                key="area-monthly"
                type="monotone" 
                dataKey="income" 
                stroke="#3B82F6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorIncomeGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-400">
            데이터가 없습니다
          </div>
        )}
      </div>

      {/* 주간 근무시간 차트 */}
      <div className="bg-white rounded-lg shadow p-6 border">
        <h3 className="text-lg font-semibold mb-4">이번 달 주간 근무시간</h3>
        {weeklyHours.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyHours} key="weekly-hours-chart">
              <CartesianGrid key="grid-weekly" strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis key="xaxis-weekly" dataKey="week" stroke="#6B7280" />
              <YAxis key="yaxis-weekly" stroke="#6B7280" />
              <Tooltip 
                key="tooltip-weekly"
                formatter={(value: number) => `${value}시간`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
              <Bar key="bar-weekly" dataKey="hours" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-400">
            데이터가 없습니다
          </div>
        )}
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border hover:shadow-md transition-shadow cursor-pointer">
          <h4 className="font-semibold mb-2">📝 근무 기록 추가</h4>
          <p className="text-sm text-gray-600">오늘의 근무시간을 기록하세요</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border hover:shadow-md transition-shadow cursor-pointer">
          <h4 className="font-semibold mb-2">💰 급여 계산하기</h4>
          <p className="text-sm text-gray-600">예상 급여를 미리 확인하세요</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border hover:shadow-md transition-shadow cursor-pointer">
          <h4 className="font-semibold mb-2">🎁 정책 혜택 확인</h4>
          <p className="text-sm text-gray-600">받을 수 있는 지원금을 확인하세요</p>
        </div>
      </div>
    </div>
  );
}
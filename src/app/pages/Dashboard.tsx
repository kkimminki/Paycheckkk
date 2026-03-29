import { useState } from "react";
import { StatCard } from "../components/StatCard";
import { Wallet, Clock, TrendingUp, Target } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock 데이터
const monthlyData = [
  { month: "1월", income: 850000 },
  { month: "2월", income: 920000 },
  { month: "3월", income: 1050000 },
  { month: "4월", income: 980000 },
  { month: "5월", income: 1120000 },
  { month: "6월", income: 1200000 },
];

const weeklyHours = [
  { week: "1주", hours: 20 },
  { week: "2주", hours: 24 },
  { week: "3주", hours: 18 },
  { week: "4주", hours: 22 },
];

export function Dashboard() {
  const [currentMonth] = useState("6월");
  const [monthlyIncome] = useState(1200000);
  const [totalHours] = useState(84);
  const [yearlyIncome] = useState(6120000);
  const [savingsGoal] = useState(10000000);
  const savingsProgress = (yearlyIncome / savingsGoal) * 100;

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">안녕하세요! 👋</h2>
        <p className="text-blue-100">
          {currentMonth} 수입 현황과 근무 통계를 확인하세요.
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
          value={`${totalHours}시간`}
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
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="colorIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip 
              formatter={(value: number) => `₩${value.toLocaleString()}`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
            />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#3B82F6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorIncomeGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 주간 근무시간 차트 */}
      <div className="bg-white rounded-lg shadow p-6 border">
        <h3 className="text-lg font-semibold mb-4">이번 달 주간 근무시간</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyHours}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="week" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip 
              formatter={(value: number) => `${value}시간`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
            />
            <Bar dataKey="hours" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
import { useState } from "react";
import { Target, Save, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export function Settings() {
  const [savingsGoal, setSavingsGoal] = useState(10000000);
  const [targetDate, setTargetDate] = useState("2026-12-31");
  const [currentSavings, setCurrentSavings] = useState(6120000);
  const [monthlySavings, setMonthlySavings] = useState(500000);

  const remainingAmount = savingsGoal - currentSavings;
  const progressPercentage = (currentSavings / savingsGoal) * 100;

  // 목표 달성까지 남은 개월 수 계산
  const today = new Date();
  const target = new Date(targetDate);
  const monthsRemaining = Math.max(
    0,
    (target.getFullYear() - today.getFullYear()) * 12 +
      (target.getMonth() - today.getMonth())
  );

  // 월별 필요 저축액
  const requiredMonthlySavings =
    monthsRemaining > 0 ? remainingAmount / monthsRemaining : 0;

  // 차트 데이터
  const pieData = [
    { name: "달성", value: currentSavings, color: "#3B82F6" },
    { name: "남은 금액", value: remainingAmount > 0 ? remainingAmount : 0, color: "#E5E7EB" },
  ];

  const handleSave = () => {
    // 실제로는 여기서 데이터 저장
    alert("설정이 저장되었습니다!");
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold mb-2">설정</h2>
        <p className="text-gray-600">
          저축 목표를 설정하고 달성 현황을 추적하세요
        </p>
      </div>

      {/* 목표 달성 현황 */}
      <div className="bg-white rounded-lg shadow p-6 border">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold">저축 목표 달성 현황</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 차트 */}
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-4">
              <div className="text-3xl font-bold text-blue-600">
                {progressPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">목표 달성률</div>
            </div>
          </div>

          {/* 통계 */}
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-700 mb-1">목표 금액</div>
              <div className="text-2xl font-bold text-blue-900">
                ₩{savingsGoal.toLocaleString()}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-700 mb-1">현재 저축액</div>
              <div className="text-2xl font-bold text-green-900">
                ₩{currentSavings.toLocaleString()}
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-700 mb-1">남은 금액</div>
              <div className="text-2xl font-bold text-orange-900">
                ₩{remainingAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-400 h-4 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 목표 설정 */}
      <div className="bg-white rounded-lg shadow p-6 border">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold">저축 목표 설정</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              목표 금액 (원)
            </label>
            <input
              type="number"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="100000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">목표 날짜</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              현재 저축액 (원)
            </label>
            <input
              type="number"
              value={currentSavings}
              onChange={(e) => setCurrentSavings(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              월 예상 저축액 (원)
            </label>
            <input
              type="number"
              value={monthlySavings}
              onChange={(e) => setMonthlySavings(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="10000"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Save className="w-5 h-5" />
            설정 저장
          </button>
        </div>
      </div>

      {/* 목표 달성 예측 */}
      <div className="bg-white rounded-lg shadow p-6 border">
        <h3 className="text-lg font-semibold mb-4">목표 달성 예측</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-700 mb-1">남은 기간</div>
            <div className="text-2xl font-bold text-purple-900">
              {monthsRemaining}개월
            </div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700 mb-1">월 필요 저축액</div>
            <div className="text-2xl font-bold text-blue-900">
              ₩{Math.ceil(requiredMonthlySavings / 1000) * 1000}
            </div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-700 mb-1">현재 월 저축액</div>
            <div className="text-2xl font-bold text-green-900">
              ₩{monthlySavings.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          {monthlySavings >= requiredMonthlySavings ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-1">
                  목표 달성 가능합니다! 🎉
                </h4>
                <p className="text-sm text-green-700">
                  현재 월 저축액으로 목표 날짜까지 저축 목표를 달성할 수 있습니다.
                  이대로 계속 유지하세요!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">!</span>
              </div>
              <div>
                <h4 className="font-semibold text-orange-900 mb-1">
                  저축액 조정이 필요합니다
                </h4>
                <p className="text-sm text-orange-700">
                  목표를 달성하려면 월{" "}
                  {Math.ceil((requiredMonthlySavings - monthlySavings) / 1000) *
                    1000}
                  원을 추가로 저축해야 합니다. 목표 금액이나 목표 날짜를 조정하는
                  것도 고려해보세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 저축 팁 */}
      <div className="bg-white rounded-lg shadow p-6 border">
        <h3 className="text-lg font-semibold mb-4">💡 저축 팁</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">📊 급여일 자동이체</h4>
            <p className="text-sm text-gray-600">
              급여가 들어오는 날 자동으로 저축 계좌로 이체되도록 설정하면 저축
              습관을 만들기 쉽습니다.
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">🎯 작은 목표부터</h4>
            <p className="text-sm text-gray-600">
              큰 목표를 작은 단위로 나누어 달성하면 동기부여가 되고 성취감을 느낄
              수 있습니다.
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">💰 근로장려금 활용</h4>
            <p className="text-sm text-gray-600">
              정책 정보 탭에서 받을 수 있는 지원금을 확인하고 신청하여 저축
              금액을 늘려보세요.
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">📱 지출 관리</h4>
            <p className="text-sm text-gray-600">
              불필요한 지출을 줄이고 고정 지출을 관리하면 더 많은 금액을 저축할
              수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

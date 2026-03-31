import { useState } from "react";
import { Calculator as CalcIcon, Info, Loader2 } from "lucide-react";
import { calculatePay as calculatePayAPI } from "../utils/api";
import { calculateWorkHours } from "../utils/payCalculator";
import { toast } from "sonner";

export function Calculator() {
  const [formData, setFormData] = useState({
    startTime: "09:00",
    endTime: "18:00",
    hourlyWage: 10000,
    isNightShift: false,
    isOvertime: false,
    includeWeeklyHolidayPay: false,
    weeklyHours: 40,
  });

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    try {
      setLoading(true);
      const hours = calculateWorkHours(formData.startTime, formData.endTime);
      
      const response = await calculatePayAPI({
        hours,
        hourlyWage: formData.hourlyWage,
        isNightShift: formData.isNightShift,
        isOvertime: formData.isOvertime,
        includeWeeklyHolidayPay: formData.includeWeeklyHolidayPay,
        weeklyHours: formData.weeklyHours,
      });

      setResult(response);
      toast.success('급여 계산이 완료되었습니다!');
    } catch (error) {
      console.error('Failed to calculate pay:', error);
      toast.error('급여 계산에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const workHours = calculateWorkHours(formData.startTime, formData.endTime);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold mb-2">급여 계산기</h2>
        <p className="text-gray-600">
          근무 시간과 조건을 입력하여 예상 급여를 계산하세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 폼 */}
        <div className="bg-white rounded-lg shadow p-6 border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalcIcon className="w-5 h-5 text-blue-600" />
            근무 정보 입력
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  시작 시간
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  종료 시간
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">총 근무시간</div>
              <div className="text-2xl font-bold text-gray-900">
                {workHours.toFixed(1)}시간
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                시급 (원)
              </label>
              <input
                type="number"
                value={formData.hourlyWage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hourlyWage: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                2026년 최저시급: ₩10,030
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNightShift}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isNightShift: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium">야간근무</div>
                  <div className="text-sm text-gray-600">
                    22시~06시, 기본급의 50% 가산
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isOvertime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isOvertime: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium">연장근무</div>
                  <div className="text-sm text-gray-600">
                    주 40시간 초과, 기본급의 50% 가산
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeWeeklyHolidayPay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includeWeeklyHolidayPay: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium">주휴수당 포함</div>
                  <div className="text-sm text-gray-600">
                    주 15시간 이상 근무 시 지급
                  </div>
                </div>
              </label>
            </div>

            {formData.includeWeeklyHolidayPay && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  주간 총 근무시간
                </label>
                <input
                  type="number"
                  value={formData.weeklyHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weeklyHours: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            )}

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? '계산 중...' : '급여 계산하기'}
            </button>
          </div>
        </div>

        {/* 결과 표시 */}
        <div className="bg-white rounded-lg shadow p-6 border">
          <h3 className="text-lg font-semibold mb-4">계산 결과</h3>

          {result ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6 rounded-lg">
                <div className="text-sm mb-1">실수령액 (세후)</div>
                <div className="text-3xl font-bold">
                  ₩{Math.floor(result.totalAfterTax).toLocaleString()}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">기본급</span>
                  <span className="font-semibold">
                    ₩{Math.floor(result.basicPay).toLocaleString()}
                  </span>
                </div>

                {result.nightShiftPay > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">야간수당 (50%)</span>
                    <span className="font-semibold text-blue-600">
                      +₩{Math.floor(result.nightShiftPay).toLocaleString()}
                    </span>
                  </div>
                )}

                {result.overtimePay > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">연장수당 (50%)</span>
                    <span className="font-semibold text-blue-600">
                      +₩{Math.floor(result.overtimePay).toLocaleString()}
                    </span>
                  </div>
                )}

                {result.weeklyHolidayPay > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">주휴수당</span>
                    <span className="font-semibold text-blue-600">
                      +₩{Math.floor(result.weeklyHolidayPay).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">세전 총액</span>
                    <span className="font-bold text-lg">
                      ₩{Math.floor(result.totalBeforeTax).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-red-600">
                    <span>세금 (3.3%)</span>
                    <span>-₩{Math.floor(result.tax).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2 mb-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <div className="font-semibold mb-1">안내사항</div>
                    <ul className="space-y-1 text-blue-800">
                      <li>• 3.3% 세금은 사업소득세 기준입니다.</li>
                      <li>• 4대보험 가입자는 공제액이 다를 수 있습니다.</li>
                      <li>• 실제 급여는 사업장 정책에 따라 차이가 있을 수 있습니다.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CalcIcon className="w-16 h-16 mb-4" />
              <p>근무 정보를 입력하고 계산하기 버튼을 눌러주세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 급여 계산 가이드 */}
      <div className="bg-white rounded-lg shadow p-6 border">
        <h3 className="text-lg font-semibold mb-4">급여 계산 가이드</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">💰 주휴수당이란?</h4>
            <p className="text-sm text-gray-600">
              주 15시간 이상 규칙적으로 근무하는 근로자에게 지급되는 유급휴일
              수당입니다. 1주일 평균 근무시간의 하루치가 지급됩니다.
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">🌙 야간근무 가산수당</h4>
            <p className="text-sm text-gray-600">
              오후 10시부터 다음날 오전 6시 사이에 근무하는 경우 기본 시급의
              50%가 추가로 지급됩니다.
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">⏰ 연장근로 수당</h4>
            <p className="text-sm text-gray-600">
              법정 근로시간(주 40시간)을 초과하여 근무하는 경우 기본 시급의
              50%가 추가로 지급됩니다.
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">📊 세금 공제</h4>
            <p className="text-sm text-gray-600">
              3.3% 사업소득세가 원천징수됩니다. 4대보험 가입자의 경우 별도
              공제율이 적용됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from "lucide-react";
import { WorkRecord } from "../utils/payCalculator";
import { saveWorkLog, getWorkLogs } from "../utils/api";
import { toast } from "sonner";

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 30)); // 2026년 3월 30일
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    hourlyWage: 10000,
    isNightShift: false,
    isOvertime: false,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 근무 기록 불러오기
  useEffect(() => {
    loadWorkLogs();
  }, [year, month]);

  const loadWorkLogs = async () => {
    try {
      setLoading(true);
      const response = await getWorkLogs(year, month + 1);
      if (response.success) {
        setWorkRecords(response.workLogs);
      }
    } catch (error) {
      console.error('Failed to load work logs:', error);
      toast.error('근무 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 달력 날짜 생성
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = [];

  // 빈 칸 추가 (이전 달)
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // 현재 달 날짜 추가
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getWorkRecordForDay = (day: number | null) => {
    if (!day) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return workRecords.find(record => record.date === dateStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await saveWorkLog({
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hourlyWage: formData.hourlyWage,
        isNightShift: formData.isNightShift,
        isOvertime: formData.isOvertime,
      });

      if (response.success) {
        toast.success('근무 기록이 저장되었습니다!');
        setShowAddForm(false);
        setFormData({
          date: "",
          startTime: "",
          endTime: "",
          hourlyWage: 10000,
          isNightShift: false,
          isOvertime: false,
        });
        // 근무 기록 새로고침
        loadWorkLogs();
      }
    } catch (error) {
      console.error('Failed to save work log:', error);
      toast.error('근무 기록 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 총 근무시간 계산
  const calculateTotalHours = () => {
    return workRecords.reduce((total, record) => {
      const [startHour, startMin] = record.startTime.split(':').map(Number);
      const [endHour, endMin] = record.endTime.split(':').map(Number);
      let hours = endHour - startHour;
      let minutes = endMin - startMin;
      if (minutes < 0) {
        hours -= 1;
        minutes += 60;
      }
      if (hours < 0) hours += 24;
      return total + hours + minutes / 60;
    }, 0);
  };

  const totalHours = calculateTotalHours();
  const avgWeeklyHours = totalHours / 4;
  const avgHourlyWage = workRecords.length > 0 
    ? workRecords.reduce((sum, r) => sum + r.hourlyWage, 0) / workRecords.length 
    : 10000;
  const estimatedBasicPay = totalHours * avgHourlyWage;
  const estimatedWeeklyHolidayPay = avgWeeklyHours >= 15 ? (avgWeeklyHours / 5) * avgHourlyWage * 4 : 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">근무 기록</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          기록 추가
        </button>
      </div>

      {/* 달력 컨트롤 */}
      <div className="bg-white rounded-lg shadow p-6 border">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-bold">
            {year}년 {month + 1}월
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
            <div
              key={day}
              className={`text-center text-sm font-semibold py-2 ${
                i === 0 ? "text-red-600" : i === 6 ? "text-blue-600" : "text-gray-700"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const workRecord = getWorkRecordForDay(day);
            const isToday =
              day === 30 && month === 2 && year === 2026;

            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 border rounded-lg ${
                  day
                    ? "bg-white hover:bg-gray-50 cursor-pointer"
                    : "bg-gray-50"
                } ${isToday ? "border-blue-500 border-2" : "border-gray-200"}`}
              >
                {day && (
                  <>
                    <div className="text-sm font-semibold mb-1">{day}</div>
                    {workRecord && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-1 text-xs">
                        <div className="font-medium text-blue-900">
                          {workRecord.startTime} - {workRecord.endTime}
                        </div>
                        <div className="text-blue-700">
                          ₩{workRecord.hourlyWage.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 기록 추가 폼 (모달) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">근무 기록 추가</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">날짜</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
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
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isNightShift}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isNightShift: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">야간근무 (22시~06시)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isOvertime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isOvertime: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">연장근무</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 이번 달 근무 요약 */}
      <div className="bg-white rounded-lg shadow p-6 border">
        <h3 className="text-lg font-semibold mb-4">이번 달 근무 요약</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {workRecords.length}일
            </div>
            <div className="text-sm text-gray-600">총 근무일</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalHours.toFixed(2)}시간
            </div>
            <div className="text-sm text-gray-600">총 근무시간</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ₩{estimatedBasicPay.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">예상 기본급</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ₩{estimatedWeeklyHolidayPay.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">예상 주휴수당</div>
          </div>
        </div>
      </div>
    </div>
  );
}
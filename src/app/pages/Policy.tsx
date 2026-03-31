import { useState } from "react";
import { Gift, AlertCircle, ExternalLink, CheckCircle, Calculator } from "lucide-react";
import { checkSubsidy } from "../utils/api";
import { toast } from "sonner";

interface PolicyInfo {
  id: string;
  title: string;
  category: string;
  description: string;
  eligibility: string[];
  amount: string;
  deadline: string;
  link: string;
  status: "available" | "upcoming" | "ended";
}

const policies: PolicyInfo[] = [
  {
    id: "1",
    title: "근로장려금",
    category: "국세청",
    description:
      "열심히 일은 하지만 소득이 적어 생활이 어려운 근로자, 사업자 가구에 대해 가구원 구성과 근로소득, 사업소득 또는 종교인소득에 따라 산정된 근로장려금을 지급하여 근로를 장려하고 실질소득을 지원하는 제도입니다.",
    eligibility: [
      "가구원 요건: 배우자, 부양자녀, 동거 부모 포함",
      "소득 요건: 가구 총소득이 기준금액 미만",
      "재산 요건: 가구원 재산 합계액이 2.4억원 미만",
    ],
    amount: "최대 330만원",
    deadline: "2026년 5월 31일",
    link: "https://www.nts.go.kr",
    status: "available",
  },
  {
    id: "2",
    title: "청년 일자리 도약 장려금",
    category: "고용노���부",
    description:
      "중소·중견기업에 취업한 청년에게 장려금을 지급하여 중소기업 취업을 촉진하고 청년의 자산형성을 지원하는 제도입니다.",
    eligibility: [
      "만 15~34세 청년 (군필자는 복무기간만큼 연령 추가)",
      "중소·중견기업 정규직 취업자",
      "고용보험 가입 필수",
    ],
    amount: "월 최대 30만원 (최장 2년)",
    deadline: "상시 신청",
    link: "https://www.work.go.kr",
    status: "available",
  },
  {
    id: "3",
    title: "청년내일채움공제",
    category: "고용노동부",
    description:
      "중소·중견기업에 정규직으로 취업한 청년이 2년 또는 3년간 근속하며 자산을 형성할 수 있도록 기업, 정부와 함께 공제금을 적립해주는 사업입니다.",
    eligibility: [
      "만 15~34세 청년",
      "중소·중견기업 정규직 6개월 미만 재직자",
      "임금 수준 제한 있음",
    ],
    amount: "2년형: 1,600만원 / 3년형: 3,000만원",
    deadline: "상시 신청",
    link: "https://www.work.go.kr",
    status: "available",
  },
  {
    id: "4",
    title: "청년 주거급여 분리지급",
    category: "국토교통부",
    description:
      "취업·구직 등을 위해 부모와 떨어져 거주하는 청년에게 주거급여를 별도로 지급하는 제도입니다.",
    eligibility: [
      "만 19~30세 미혼 청년",
      "취업·구직·교육 등의 사유로 부모와 떨어져 거주",
      "중위소득 50% 이하 가구",
    ],
    amount: "월 최대 32만원 (지역별 상이)",
    deadline: "상시 신청",
    link: "https://www.myhome.go.kr",
    status: "available",
  },
  {
    id: "5",
    title: "서울시 청년수당",
    category: "서울시",
    description:
      "서울시 거주 미취업 청년의 구직활동을 지원하는 서울형 청년보장 정책입니다.",
    eligibility: [
      "만 18~34세 서울시 거주 청년",
      "미취업자 (주 30시간 미만 근로)",
      "중위소득 150% 이하",
    ],
    amount: "월 50만원 (6개월)",
    deadline: "2026년 4월 30일",
    link: "https://youth.seoul.go.kr",
    status: "available",
  },
  {
    id: "6",
    title: "청년도전지원사업",
    category: "고용노동부",
    description:
      "저소득 청년에게 구직활동을 위한 생활안정자금을 지원하고 취업지원서비스를 제공하는 사업입니다.",
    eligibility: [
      "만 18~34세 청년",
      "중위소득 120% 이하 가구",
      "미취업 상태",
    ],
    amount: "월 50만원 (6개월)",
    deadline: "2026년 6월 30일",
    link: "https://www.work.go.kr",
    status: "upcoming",
  },
];

export function Policy() {
  const [showSubsidyChecker, setShowSubsidyChecker] = useState(false);
  const [subsidyForm, setSubsidyForm] = useState({
    annualIncome: 0,
    householdType: 'single' as 'single' | 'couple' | 'family',
    totalAssets: 0,
  });
  const [subsidyResult, setSubsidyResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckSubsidy = async () => {
    try {
      setLoading(true);
      const result = await checkSubsidy(subsidyForm);
      setSubsidyResult(result);
      toast.success('근로장려금 자격 확인이 완료되었습니다!');
    } catch (error) {
      console.error('Failed to check subsidy:', error);
      toast.error('근로장려금 자격 확인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: PolicyInfo["status"]) => {
    const badges = {
      available: (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <CheckCircle className="w-3 h-3" />
          신청 가능
        </span>
      ),
      upcoming: (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          <AlertCircle className="w-3 h-3" />
          신청 예정
        </span>
      ),
      ended: (
        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
          마감
        </span>
      ),
    };
    return badges[status];
  };

  const availablePolicies = policies.filter((p) => p.status === "available");
  const upcomingPolicies = policies.filter((p) => p.status === "upcoming");

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold mb-2">정책 정보</h2>
        <p className="text-gray-600">
          근로자와 청년을 위한 다양한 지원 정책을 확인하세요
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Gift className="w-12 h-12 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold mb-2">
              받을 수 있는 혜택을 확인하세요!
            </h3>
            <p className="text-purple-100 mb-3">
              현재 신청 가능한 정책이 {availablePolicies.length}개 있습니다.
              조건을 확인하고 놓치지 마세요.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                💰 근로장려금
              </span>
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                👔 청년 취업 지원
              </span>
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                🏠 주거 지원
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 신청 가능한 정책 */}
      <div>
        <h3 className="text-xl font-semibold mb-4">✅ 신청 가능한 정책</h3>
        <div className="space-y-4">
          {availablePolicies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white rounded-lg shadow p-6 border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold">{policy.title}</h4>
                    {getStatusBadge(policy.status)}
                  </div>
                  <p className="text-sm text-blue-600">{policy.category}</p>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{policy.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h5 className="font-semibold text-sm mb-2">📋 신청 자격</h5>
                  <ul className="space-y-1">
                    {policy.eligibility.map((item, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-sm mb-2">💵 지원 금액</h5>
                  <p className="text-xl font-bold text-blue-600 mb-3">
                    {policy.amount}
                  </p>
                  <h5 className="font-semibold text-sm mb-1">📅 신청 기한</h5>
                  <p className="text-sm text-gray-600">{policy.deadline}</p>
                </div>
              </div>

              <a
                href={policy.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                자세히 보기
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* 신청 예정 정책 */}
      {upcomingPolicies.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">📢 신청 예정 정책</h3>
          <div className="space-y-4">
            {upcomingPolicies.map((policy) => (
              <div
                key={policy.id}
                className="bg-white rounded-lg shadow p-6 border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-bold">{policy.title}</h4>
                      {getStatusBadge(policy.status)}
                    </div>
                    <p className="text-sm text-blue-600">{policy.category}</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-3">{policy.description}</p>
                <p className="text-sm text-gray-600">
                  신청 시작: {policy.deadline}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 안내 사항 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-2">안내사항</p>
            <ul className="space-y-1">
              <li>• 정책별 신청 자격과 조건을 반드시 확인해주세요.</li>
              <li>• 중복 신청이 불가능한 정책이 있을 수 있습니다.</li>
              <li>
                • 자세한 내용은 각 정책의 공식 사이트를 참고하시기 바랍니다.
              </li>
              <li>• 신청 기한을 놓치지 않도록 주의해주세요.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 관련 링크 */}
      <div className="bg-white rounded-lg shadow p-6 border">
        <h3 className="text-lg font-semibold mb-4">🔗 관련 사이트</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href="https://www.nts.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">국세청 (근로장려금)</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
          <a
            href="https://www.work.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">고용노동부 (청년 정책)</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
          <a
            href="https://www.youthcenter.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">청년정책 종합정보</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
          <a
            href="https://www.bokjiro.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">복지로 (복지서비스)</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
import { Link } from "react-router";
import { Home } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-3xl font-bold mb-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-gray-600 mb-6">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Home className="w-5 h-5" />
        홈으로 돌아가기
      </Link>
    </div>
  );
}

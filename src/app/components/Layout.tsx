import { Outlet, Link, useLocation } from "react-router";
import { Home, Calendar, Calculator, FileText, Settings } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "홈" },
    { path: "/calendar", icon: Calendar, label: "근무기록" },
    { path: "/calculator", icon: Calculator, label: "급여계산" },
    { path: "/policy", icon: FileText, label: "정책정보" },
    { path: "/settings", icon: Settings, label: "설정" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-blue-600">Pay-Check</h1>
          <p className="text-sm text-gray-600">근로자 맞춤형 정산 관리</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex justify-around items-center">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center py-3 px-4 flex-1 transition-colors ${
                  isActive(path)
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}

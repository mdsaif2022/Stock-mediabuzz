import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, BarChart3, FileText, Radio, Users, Settings, Home, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_BASE_PATH } from "@/constants/routes";
import { ThemeToggle } from "./ThemeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasAdminSession, setHasAdminSession] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const adminSession = sessionStorage.getItem("adminSession") === "true";
    setHasAdminSession(adminSession);

    if (adminSession) {
      return;
    }

    if (currentUser && currentUser.email === (import.meta.env.VITE_ADMIN_EMAIL || "mediabuzz@local")) {
      return;
    }

    if ((currentUser as any)?.role === "admin") {
      return;
    }

    navigate("/login?role=admin");
  }, [currentUser, navigate]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: "Dashboard", href: ADMIN_BASE_PATH, icon: Home },
    { label: "Media", href: `${ADMIN_BASE_PATH}/media`, icon: FileText },
    { label: "Ads Manager", href: `${ADMIN_BASE_PATH}/ads`, icon: Radio },
    { label: "Analytics", href: `${ADMIN_BASE_PATH}/analytics`, icon: BarChart3 },
    { label: "Users", href: `${ADMIN_BASE_PATH}/users`, icon: Users },
    { label: "Referral System", href: `${ADMIN_BASE_PATH}/referral-system`, icon: Share2 },
    { label: "Settings", href: `${ADMIN_BASE_PATH}/settings`, icon: Settings },
  ];

  const handleNavClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? `fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : isSidebarOpen
              ? "w-64"
              : "w-0"
        } bg-slate-900 text-white transition-all duration-300 overflow-hidden flex flex-col shadow-xl`}
      >
        <div className="p-4 sm:p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2" onClick={handleNavClick}>
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-bold text-base sm:text-lg truncate">FreeMediaBuzz</span>
            </Link>
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg transition-all ${
                  active
                    ? "bg-primary text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 border-t border-slate-800 flex-shrink-0">
          <button
            onClick={() => {
              logout().catch(() => {});
              sessionStorage.removeItem("adminSession");
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-manipulation"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen && !isMobile ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {currentUser?.email || "Admin"}
              </p>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

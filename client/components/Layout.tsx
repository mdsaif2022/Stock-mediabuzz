import Header from "./Header";
import Footer from "./Footer";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const location = useLocation();
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  useEffect(() => {
    apiFetch("/api/settings/general")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.maintenanceMode === "boolean") {
          setMaintenanceMode(data.maintenanceMode);
        }
      })
      .catch(() => {
        // ignore failures
      });
  }, []);

  // Add smooth page transition effect
  useEffect(() => {
    setIsPageTransitioning(true);
    const timer = setTimeout(() => {
      setIsPageTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />
      <main className="flex-1 relative">
        {/* Page transition overlay */}
        <div
          className={`absolute inset-0 bg-white dark:bg-slate-950 z-50 transition-opacity duration-150 pointer-events-none ${
            isPageTransitioning ? "opacity-0" : "opacity-0"
          }`}
        />
        
        {/* Page content with visual separation */}
        <div
          className={`min-h-[calc(100vh-8rem)] transition-all duration-300 ${
            isPageTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          {maintenanceMode ? (
            <div className="flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24">
              <div className="max-w-2xl bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-xl p-8 space-y-4 backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Maintenance Mode</p>
                <h1 className="text-3xl font-bold">We'll be right back</h1>
                <p className="text-muted-foreground">
                  The site is temporarily undergoing scheduled maintenance. Please check back in a little while.
                  Creators and admins can still access the dashboard directly.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Subtle background pattern for visual depth */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:20px_20px] pointer-events-none" />
              <div className="relative z-10">
                {children}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

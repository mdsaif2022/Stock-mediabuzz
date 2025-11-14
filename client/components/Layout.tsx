import Header from "./Header";
import Footer from "./Footer";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {maintenanceMode ? (
          <div className="flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24">
            <div className="max-w-2xl bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-lg p-8 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Maintenance Mode</p>
              <h1 className="text-3xl font-bold">We’ll be right back</h1>
              <p className="text-muted-foreground">
                The site is temporarily undergoing scheduled maintenance. Please check back in a little while.
                Creators and admins can still access the dashboard directly.
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
      <Footer />
    </div>
  );
}

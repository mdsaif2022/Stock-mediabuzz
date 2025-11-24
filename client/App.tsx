import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BrowseMedia from "./pages/BrowseMedia";
import Categories from "./pages/Categories";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import Profile from "./pages/Profile";
import MediaDetail from "./pages/MediaDetail";
import NavigationDemo from "./pages/NavigationDemo";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMedia from "./pages/admin/Media";
import AdminAds from "./pages/admin/Ads";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";
import React, { useEffect } from "react";
import { ADMIN_BASE_PATH } from "./constants/routes";
import { apiFetch } from "@/lib/api";
import ScrollToTop from "@/components/ScrollToTop";
import NavigationMonitor from "@/components/NavigationMonitor";
import "@/utils/navigationDebug"; // Initialize debug utilities in development
import "@/utils/testBackButton"; // Initialize back button test utility
import "@/utils/diagnoseBackButton"; // Initialize comprehensive diagnosis utility

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      {process.env.NODE_ENV === 'development' && <NavigationMonitor />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/browse" element={<BrowseMedia />} />
        <Route path="/browse/:category" element={<BrowseMedia />} />
        <Route path="/browse/:category/:id" element={<MediaDetail />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/creator" element={<CreatorDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/navigation-demo" element={<NavigationDemo />} />
        {/* Legacy route support - redirect to new structure */}
        <Route path="/media/:id" element={<MediaDetail />} />

        {/* Admin Routes */}
        <Route path={ADMIN_BASE_PATH} element={<AdminDashboard />} />
        <Route path={`${ADMIN_BASE_PATH}/media`} element={<AdminMedia />} />
        <Route path={`${ADMIN_BASE_PATH}/ads`} element={<AdminAds />} />
        <Route path={`${ADMIN_BASE_PATH}/analytics`} element={<AdminAnalytics />} />
        <Route path={`${ADMIN_BASE_PATH}/users`} element={<AdminUsers />} />
        <Route path={`${ADMIN_BASE_PATH}/settings`} element={<AdminSettings />} />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  useEffect(() => {
    apiFetch("/api/settings/branding")
      .then((res) => res.json())
      .then((data) => {
        if (data?.faviconDataUrl) {
          let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = data.faviconDataUrl;
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

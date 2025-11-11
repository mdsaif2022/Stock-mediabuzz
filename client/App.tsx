import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BrowseMedia from "./pages/BrowseMedia";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MediaDetail from "./pages/MediaDetail";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMedia from "./pages/admin/Media";
import AdminAds from "./pages/admin/Ads";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<BrowseMedia />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/media/:id" element={<MediaDetail />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/media" element={<AdminMedia />} />
            <Route path="/admin/ads" element={<AdminAds />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />

            {/* Placeholder routes - content to be added later */}
            <Route path="/categories" element={<BrowseMedia />} />
            <Route path="/search" element={<BrowseMedia />} />
            <Route path="/terms" element={<BrowseMedia />} />
            <Route path="/privacy" element={<BrowseMedia />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

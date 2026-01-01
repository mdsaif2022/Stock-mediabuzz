import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, LogIn, User, Smartphone, Download, DollarSign } from "lucide-react";
import AdsSlider from "./AdsSlider";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { apiFetch } from "@/lib/api";
import { AppSettings } from "@shared/api";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string>("");
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const { currentUser, logout, creatorProfile } = useAuth();
  const navigate = useNavigate();
  
  const isLoggedIn = !!currentUser;

  // Load site logo from settings
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await apiFetch("/api/settings/branding");
        if (res.ok) {
          const branding = await res.json();
          if (branding?.logo) {
            setSiteLogo(branding.logo);
          } else {
            // Clear logo if it was removed
            setSiteLogo("");
          }
        }
      } catch (error) {
        console.error("Failed to load site logo:", error);
        // Silently fail - use default logo
      }
    };
    
    loadLogo();
    
    // Refresh logo every 30 seconds in case it was updated
    const interval = setInterval(loadLogo, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load app settings
  useEffect(() => {
    const loadAppSettings = async () => {
      try {
        const res = await apiFetch("/api/settings/app");
        if (res.ok) {
          const app = await res.json();
          setAppSettings(app);
        }
      } catch (error) {
        console.error("Failed to load app settings:", error);
      }
    };
    
    loadAppSettings();
    
    // Refresh app settings every 30 seconds
    const interval = setInterval(loadAppSettings, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-950 border-b border-border shadow-sm">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex h-16 items-center justify-between gap-1 sm:gap-2 md:gap-4 min-w-0">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0 min-w-0">
            {siteLogo ? (
              <img
                src={siteLogo}
                alt="Site Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover flex-shrink-0"
                loading="lazy"
                onError={() => {
                  setSiteLogo("");
                  setLogoFailed(true);
                }}
              />
            ) : !logoFailed ? (
              <img
                src="/apple-touch-icon.png"
                alt="FreeMediaBuzz Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover flex-shrink-0"
                loading="lazy"
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).style.display = "none";
                  setLogoFailed(true);
                }}
              />
            ) : (
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">F</span>
              </div>
            )}
            <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-nowrap">
              FreeMediaBuzz
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/browse" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Browse Media
            </Link>
            <Link to="/categories" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Categories
            </Link>
            <Link to="/contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Contact
            </Link>
            <Link
              to="/creator"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              Creator Portal
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
            {/* Get App - Mobile & Desktop - Glitch/Cyberpunk Style */}
            {appSettings?.downloadEnabled && (appSettings.apkUrl || appSettings.xapkUrl || appSettings.playStoreUrl || appSettings.appStoreUrl) ? (
              <a
                href={appSettings.apkUrl || appSettings.xapkUrl || appSettings.playStoreUrl || appSettings.appStoreUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex relative text-xs sm:text-sm font-medium text-foreground transition-all duration-300 items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-primary/10 group animate-cyberpunk overflow-hidden border border-red-500/30 hover:border-blue-500/60"
              >
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 relative z-10" />
                <span className="relative z-10 font-bold group-hover:animate-glitch hidden sm:inline">
                  Get App
                </span>
              </a>
            ) : (
              <Link
                to="/get-app"
                className="flex relative text-xs sm:text-sm font-medium text-foreground transition-all duration-300 items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-primary/10 group animate-cyberpunk overflow-hidden border border-red-500/30 hover:border-blue-500/60"
              >
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 relative z-10" />
                <span className="relative z-10 font-bold group-hover:animate-glitch hidden sm:inline">
                  Get App
                </span>
              </Link>
            )}
            {/* Earnings - Mobile & Desktop - Currency Drop Animation - Only show if logged in */}
            {isLoggedIn && (
              <Link
                to="/earnings"
                className="flex relative text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-all duration-300 items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-primary/10 group overflow-hidden currency-drop-container"
              >
                {/* Currency symbols dropping */}
                <span className="currency-symbol">₿</span>
                <span className="currency-symbol">৳</span>
                <span className="currency-symbol">₿</span>
                <span className="currency-symbol">৳</span>
                
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-500 relative z-10" />
                <span className="relative z-10 font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:from-yellow-500 group-hover:to-yellow-400 transition-all duration-300 hidden sm:inline">
                  Earnings
                </span>
              </Link>
            )}
            {/* Theme Toggle */}
            <ThemeToggle />
            {/* Desktop Auth Buttons */}
            {!isLoggedIn ? (
              <div className="hidden sm:flex gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm truncate max-w-[120px]">
                    {currentUser?.displayName || currentUser?.email || "Account"}
                  </span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-border rounded-lg shadow-lg z-50">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-secondary/10 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-secondary/10 transition-colors"
                    >
                      Profile
                    </Link>
                    {creatorProfile && (
                      <Link
                        to="/creator"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-secondary/10 transition-colors"
                      >
                        Creator Portal
                      </Link>
                    )}
                    {/* Admin Panel link intentionally removed for regular users */}
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button - Always visible on mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex-shrink-0"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-border space-y-1">
            {/* Mobile Theme Toggle */}
            <div className="px-4 py-2 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>
            </div>
            <Link
              to="/browse"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium hover:bg-secondary/10 transition-colors"
            >
              Browse Media
            </Link>
            <Link
              to="/categories"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium hover:bg-secondary/10 transition-colors"
            >
              Categories
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium hover:bg-secondary/10 transition-colors"
            >
              Contact
            </Link>
            {!isLoggedIn && (
              <div className="flex gap-2 px-4 py-3 border-t border-border">
                <Link
                  to="/login"
                  className="flex-1 px-4 py-2 text-sm font-medium text-center border border-primary text-primary rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 px-4 py-2 text-sm font-medium text-center bg-gradient-to-r from-primary to-accent text-white rounded-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
            {isLoggedIn && (
              <div className="flex flex-col gap-1 px-4 py-3 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span>{currentUser?.displayName || "My Account"}</span>
                    <span className="text-xs text-muted-foreground break-all">{currentUser?.email}</span>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium hover:bg-secondary/10 rounded-md transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium hover:bg-secondary/10 rounded-md transition-colors"
                >
                  Profile
                </Link>
                {creatorProfile && (
                  <Link
                    to="/creator"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium hover:bg-secondary/10 rounded-md transition-colors"
                  >
                    Creator Portal
                  </Link>
                )}
                {/* Admin Panel link intentionally hidden for non-admin users */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-destructive border border-destructive rounded-md hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
            {!isLoggedIn && (
              <Link
                to="/creator"
                onClick={() => setIsMenuOpen(false)}
                className="block mt-2 px-4 py-2 text-sm font-semibold text-center border border-dashed border-primary rounded-lg text-primary hover:bg-primary/5 transition-colors"
              >
                Become a Creator
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
      
      {/* Ads Slider Below Header */}
      <AdsSlider />
    </>
  );
}

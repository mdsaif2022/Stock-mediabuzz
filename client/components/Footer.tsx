import { Link } from "react-router-dom";
import { Mail, MapPin, Heart, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  // Load site logo from settings
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await apiFetch("/api/settings/branding");
        if (!res.ok) return;
        const branding = await res.json();
        if (branding && Object.prototype.hasOwnProperty.call(branding, "logo")) {
          const logoValue = typeof branding.logo === "string" ? branding.logo : "";
          if (logoValue) {
            setSiteLogo(logoValue);
            setLogoFailed(false);
          } else {
            // Clear logo only when it's explicitly removed
            setSiteLogo(null);
          }
        }
      } catch (error) {
        console.error("Failed to load site logo:", error);
        // Keep existing logo on transient errors
      }
    };

    loadLogo();

    // Refresh logo every 30 seconds in case it was updated
    const interval = setInterval(loadLogo, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt="FreeMediaBuzz Logo"
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0 transition-transform group-hover:scale-105"
                  loading="lazy"
                  onError={() => {
                    setSiteLogo(null);
                    setLogoFailed(true);
                  }}
                />
              ) : !logoFailed ? (
                <img
                  src="/apple-touch-icon.png"
                  alt="FreeMediaBuzz Logo"
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0 transition-transform group-hover:scale-105"
                  loading="lazy"
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).style.display = "none";
                    setLogoFailed(true);
                  }}
                />
              ) : (
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
              )}
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transition-opacity group-hover:opacity-90">
                FreeMediaBuzz
              </span>
            </Link>
            <p className="text-sm text-slate-400">
              {t("footer.description")}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.186.092-.923.35-1.544.636-1.9-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817a9.56 9.56 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.191 20 14.441 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.879V12.89h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.989C16.343 19.129 20 14.99 20 10z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">{t("footer.product")}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/creator" className="text-sm text-slate-400 hover:text-primary transition-colors">
                  {t("nav.creator")}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-slate-400 hover:text-primary transition-colors">
                  {t("nav.dashboard")}
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm text-slate-400 hover:text-primary transition-colors">
                  {t("nav.profile")}
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-slate-400 hover:text-primary transition-colors">
                  {t("nav.login")}
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-sm text-slate-400 hover:text-primary transition-colors">
                  {t("nav.signup")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">{t("footer.company")}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-sm text-slate-400 hover:text-primary transition-colors">
                  {t("footer.aboutUs")}
                </a>
              </li>
              <li>
                <a href="#blog" className="text-sm text-slate-400 hover:text-primary transition-colors">
                  {t("footer.blog")}
                </a>
              </li>
              <li>
                <a href="#careers" className="text-sm text-slate-400 hover:text-primary transition-colors">
                  {t("footer.careers")}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">{t("footer.contact")}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary mt-1" />
                <div>
                  <p className="text-sm text-slate-400">{t("footer.email")}</p>
                  <a href="mailto:support@freemediabuzz.com" className="text-sm text-slate-300 hover:text-primary transition-colors">
                    support@freemediabuzz.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-1" />
                <div>
                  <p className="text-sm text-slate-400">{t("footer.address")}</p>
                  <p className="text-sm text-slate-300">{t("footer.globalHQ")}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800"></div>

        {/* User Manual Section */}
        <div className="py-8 border-t border-slate-800">
          <Link
            to="/user-manual"
            className="flex items-center gap-3 group"
          >
            <BookOpen className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
              {t("footer.userManual")}
            </h3>
          </Link>
        </div>

        {/* Bottom Footer */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-800">
          <p className="text-sm text-slate-400">
            &copy; 2024 FreeMediaBuzz. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {t("footer.madeWith")} <Heart className="w-4 h-4 text-accent" /> {t("footer.forCreators")}
          </div>
        </div>
      </div>
    </footer>
  );
}

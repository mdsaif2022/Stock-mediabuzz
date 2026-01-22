import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setLanguage(language === "en" ? "bn" : "en")}
        title={language === "en" ? "Switch to Bangla" : "Switch to English"}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{language === "en" ? "EN" : "BN"}</span>
      </button>
    </div>
  );
}


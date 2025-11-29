import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isAnimating: boolean;
  animationDirection: "rise" | "set" | null;
  triggerAnimation: (direction: "rise" | "set") => void;
  handleAnimationComplete: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "freemediabuzz-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    // Fallback to system preference
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<"rise" | "set" | null>(null);
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a preference manually
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const triggerAnimation = (direction: "rise" | "set") => {
    setAnimationDirection(direction);
    setIsAnimating(true);
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setAnimationDirection(null);
    // Clear pending theme - it should already be applied during animation
    // This ensures final state is correct
    if (pendingTheme) {
      setPendingTheme(null);
    }
  };

  const toggleTheme = () => {
    const currentTheme = theme;
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    // Determine animation direction based on theme transition
    // Dark → Light: sun rises (from bottom to top)
    // Light → Dark: sun sets (from top to bottom)
    const direction = currentTheme === "dark" ? "rise" : "set";
    
    // Store the new theme to apply gradually during animation
    setPendingTheme(newTheme);
    
    // Trigger animation first
    triggerAnimation(direction);
    
    // Start theme transition early (at 15% of animation) for gradual color blending
    // Animation is 1.8s, so we change theme at ~270ms (15% of 1800ms)
    // This creates a smooth transition as sun moves - colors gradually change with sun movement
    setTimeout(() => {
      setThemeState(newTheme);
    }, 270); // Start theme change early for gradual transition
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      setTheme, 
      isAnimating, 
      animationDirection,
      triggerAnimation,
      handleAnimationComplete,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}


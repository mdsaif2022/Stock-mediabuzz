import { useTheme } from "@/contexts/ThemeContext";
import { SunAnimation } from "./SunAnimation";

export function ThemeAnimationWrapper() {
  const { isAnimating, animationDirection, handleAnimationComplete } = useTheme();

  return (
    <SunAnimation
      isAnimating={isAnimating}
      direction={animationDirection}
      onComplete={handleAnimationComplete}
    />
  );
}


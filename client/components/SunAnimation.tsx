import { useEffect, useState } from "react";

interface SunAnimationProps {
  isAnimating: boolean;
  direction: "rise" | "set" | null;
  onComplete: () => void;
}

export function SunAnimation({ isAnimating, direction, onComplete }: SunAnimationProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isAnimating && direction) {
      setShouldRender(true);
      
      // Animation duration: 1.8s (1.5s-2s as requested)
      const timer = setTimeout(() => {
        // Hide immediately when animation completes
        setShouldRender(false);
        // Small delay to ensure DOM cleanup before calling onComplete
        requestAnimationFrame(() => {
          onComplete();
        });
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [isAnimating, direction, onComplete]);

  if (!shouldRender || !direction) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      <div className="background-layer absolute inset-0">
        <div
          key={`${direction}-${isAnimating}`} // Force remount for clean animation start
          className={`sun absolute left-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 shadow-[0_0_40px_rgba(251,191,36,0.8),0_0_80px_rgba(251,191,36,0.5)] ${
            direction === "rise"
              ? "animate-sunrise"
              : "animate-sunset"
          }`}
          style={{
            willChange: "transform, opacity",
          }}
        />
      </div>
    </div>
  );
}


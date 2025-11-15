import { RefObject, useEffect, useState } from "react";

export function useInView<T extends Element>(
  ref: RefObject<T>,
  options: IntersectionObserverInit = { threshold: 0.25 }
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [ref, options.root, options.rootMargin, JSON.stringify(options.threshold)]);

  return isIntersecting;
}



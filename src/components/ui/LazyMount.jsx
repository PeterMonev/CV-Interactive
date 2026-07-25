import { useState, useEffect, useRef } from "react";

export function LazyMount({ children, rootMargin = "350px 0px" }) {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setMounted(entry.isIntersecting);
        });
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return <div ref={ref} className="lazy-mount">{mounted ? children : null}</div>;
}


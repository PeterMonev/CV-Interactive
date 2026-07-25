export function magneticMove(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const relX = e.clientX - rect.left - rect.width / 2;
  const relY = e.clientY - rect.top - rect.height / 2;
  el.style.transform = `translate(${relX * 0.25}px, ${relY * 0.25}px)`;
}

export function magneticLeave(e) {
  e.currentTarget.style.transform = "";
}


export function handleCardMove(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const px = (x / rect.width) * 100;
  const py = (y / rect.height) * 100;
  const rotateY = (x / rect.width - 0.5) * 10;
  const rotateX = (y / rect.height - 0.5) * -10;
  el.style.setProperty("--mx", `${px}%`);
  el.style.setProperty("--my", `${py}%`);
  el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
}

export function handleCardLeave(e) {
  const el = e.currentTarget;
  el.style.transform = "";
  el.style.setProperty("--mx", "50%");
  el.style.setProperty("--my", "50%");
}


export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}


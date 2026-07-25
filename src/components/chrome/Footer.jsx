import { useState, useEffect } from "react";

function useSofiaClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: "Europe/Sofia",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Footer() {
  const sofiaTime = useSofiaClock();

  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} Peter Monev</span>
      <span className="footer-tags">Guitars · Music · Engineering</span>
      <span className="footer-clock">Sofia · {sofiaTime}</span>
    </footer>
  );
}

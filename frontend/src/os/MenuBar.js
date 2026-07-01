import { useEffect, useState } from "react";

export default function MenuBar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit" });

  return (
    <div
      data-testid="menu-bar"
      className="fixed top-0 left-0 right-0 h-10 z-[9000] flex items-center justify-between px-3"
      style={{ background: "var(--black)", color: "var(--cream)", borderBottom: "3px solid var(--black)" }}
    >
      <span
        data-testid="menu-brand"
        className="font-display text-[20px] leading-none tracking-tight"
      >
        (MADEBYJRY)<span style={{ color: "var(--red)" }}>®</span>
      </span>

      <div className="flex items-center gap-3 font-pixel text-[20px] leading-none">
        <span className="hidden sm:inline">PURE EXCELLENCE</span>
        <span className="opacity-50">///</span>
        <span>{date}</span>
        <span>{time}</span>
        <span className="flex items-center gap-1">
          <span className="w-7 h-3 inline-block relative" style={{ border: "2px solid var(--cream)" }}>
            <span className="absolute inset-y-0 left-0 w-4/5" style={{ background: "var(--red)" }} />
          </span>
        </span>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clapperboard, Users, Mail, Settings } from "lucide-react";
import "@/App.css";

import BootScreen from "@/os/BootScreen";
import MenuBar from "@/os/MenuBar";
import Dock from "@/os/Dock";
import Window from "@/os/Window";
import WorkApp from "@/apps/WorkApp";
import NetworkApp from "@/apps/NetworkApp";
import ContactApp from "@/apps/ContactApp";
import AdminApp from "@/apps/AdminApp";
import { getSettings } from "@/lib/api";

const APPS = [
  { id: "work", title: "Files", icon: Clapperboard, w: 980, h: 660, Comp: WorkApp },
  { id: "network", title: "Network", icon: Users, w: 860, h: 640, Comp: NetworkApp },
  { id: "contact", title: "Contact", icon: Mail, w: 640, h: 600, Comp: ContactApp },
  { id: "admin", title: "Studio", icon: Settings, w: 720, h: 660, Comp: AdminApp },
];

export default function App() {
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState([]);
  const [quote, setQuote] = useState("IMAGINE THINKING YOU'RE NOT DOING IT RIGHT JUST BECAUSE PEOPLE SAID SO");
  const zRef = useRef(20);
  const idRef = useRef(1);
  const desktopRef = useRef(null);

  useEffect(() => {
    getSettings().then((s) => s.desktop_quote && setQuote(s.desktop_quote)).catch(() => {});
  }, []);

  const nextZ = () => (zRef.current += 1);

  const focus = useCallback((id) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, z: nextZ() } : w)));
  }, []);

  const openApp = useCallback((appId) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.appId === appId);
      if (existing) {
        return prev.map((w) => (w.id === existing.id ? { ...w, minimized: false, z: nextZ() } : w));
      }
      const cfg = APPS.find((a) => a.id === appId);
      const availW = window.innerWidth - 24;
      const availH = window.innerHeight - 52 - 84; // top bar + floating taskbar
      const w = Math.min(cfg.w, availW);
      const h = Math.min(cfg.h, availH);
      const offset = prev.length * 26;
      const x = Math.max(12, Math.min((window.innerWidth - w) / 2 - 20 + offset, window.innerWidth - w - 12));
      const y = Math.max(50, Math.min((window.innerHeight - 84 - h) / 2 + 50 + offset, window.innerHeight - 84 - h));
      return [...prev, { id: idRef.current++, appId, title: cfg.title, x, y, w, h, z: nextZ(), minimized: false }];
    });
  }, []);

  const closeWindow = useCallback((id) => setWindows((prev) => prev.filter((w) => w.id !== id)), []);
  const minimizeWindow = useCallback((id) => setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))), []);

  const visible = windows.filter((w) => !w.minimized);
  const topWin = visible.reduce((a, b) => (a && a.z > b.z ? a : b), null);
  const runningIds = windows.map((w) => w.appId);

  return (
    <div className="jry-desktop" ref={desktopRef}>
      {!booted && <BootScreen onDone={() => setBooted(true)} />}

      <MenuBar />

      {/* Desktop launcher icons */}
      {booted && (
        <div className="absolute top-14 left-4 z-[5] flex flex-col gap-3" data-testid="desktop-icons">
          {APPS.map((app, i) => {
            const Icon = app.icon;
            return (
              <motion.button
                key={app.id}
                data-testid={`icon-${app.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                whileHover={{ scale: 1.04, rotate: -1 }}
                onClick={() => openApp(app.id)}
                className="w-20 flex flex-col items-center gap-1 group"
              >
                <span
                  className="w-14 h-14 flex items-center justify-center retro-border"
                  style={{ background: "var(--cream)", boxShadow: "5px 5px 0 rgba(0,0,0,0.5)" }}
                >
                  <Icon size={26} strokeWidth={2.5} color="var(--black)" />
                </span>
                <span className="font-pixel text-[17px] leading-none px-1.5 py-0.5" style={{ background: "var(--black)", color: "var(--cream)" }}>
                  {app.title.toUpperCase()}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Poster easter-egg + welcome */}
      {booted && windows.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[3] px-6">
          <div className="text-center">
            <div className="font-display text-4xl sm:text-6xl leading-[0.92] mb-4" style={{ color: "var(--black)" }}>
              (MADEBYJRY)<span style={{ color: "var(--cream)" }}>®</span>
            </div>
            <div
              className="inline-block retro-border px-6 py-5 max-w-md text-left"
              style={{ background: "var(--red)", boxShadow: "8px 8px 0 rgba(0,0,0,0.55)" }}
            >
              <p className="font-display text-2xl sm:text-3xl leading-[0.98]" style={{ color: "var(--black)" }}>
                {quote}
              </p>
              <div className="font-pixel text-[18px] mt-3 text-right" style={{ color: "var(--black)" }}>
                — click an icon to explore ®
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {visible.map((win) => {
          const cfg = APPS.find((a) => a.id === win.appId);
          const Comp = cfg.Comp;
          return (
            <Window
              key={win.id}
              win={win}
              focused={topWin?.id === win.id}
              onFocus={focus}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              constraintsRef={desktopRef}
            >
              <Comp />
            </Window>
          );
        })}
      </AnimatePresence>

      <Dock apps={APPS} onOpen={openApp} runningIds={runningIds} />

      {/* CRT / VHS glitch overlay */}
      <div className="crt-overlay" aria-hidden="true">
        <div className="crt-grain" />
        <div className="crt-scan" />
        <div className="crt-vignette" />
        <div className="crt-flicker" />
      </div>
    </div>
  );
}

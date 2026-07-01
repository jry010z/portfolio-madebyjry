import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Power } from "lucide-react";

export default function Dock({ apps, onOpen, runningIds }) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed bottom-3 left-0 right-0 z-[9000] flex justify-center px-3 pointer-events-none" data-testid="taskbar">
      <div className="relative pointer-events-auto max-w-full">
        {/* Start menu */}
        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-[58px] left-0 w-64 retro-border overflow-hidden"
                style={{ background: "var(--cream)" }}
                data-testid="start-menu"
              >
                <div className="font-display text-[17px] px-3 py-2 flex items-center gap-2" style={{ background: "var(--black)", color: "var(--cream)" }}>
                  <Power size={15} strokeWidth={3} color="var(--red)" /> PROGRAMS
                </div>
                {apps.map((app) => {
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.id}
                      data-testid={`start-${app.id}`}
                      onClick={() => { onOpen(app.id); setOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 font-pixel text-[21px] leading-none hover:bg-[var(--red)] hover:text-[var(--cream)] transition-colors"
                      style={{ borderTop: "2px solid var(--black)", color: "var(--black)" }}
                    >
                      <Icon size={20} strokeWidth={2.5} />
                      {app.title.toUpperCase()}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating bar */}
        <div
          className="h-12 flex items-center gap-2 px-2 retro-border"
          style={{ background: "var(--black)", boxShadow: "6px 6px 0 rgba(0,0,0,0.5)" }}
        >
          <button
            data-testid="start-btn"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 h-8 px-3 font-display text-[16px] leading-none retro-btn"
            style={{ background: open ? "var(--red)" : "var(--cream)", color: open ? "var(--cream)" : "var(--black)", boxShadow: "3px 3px 0 var(--red)" }}
          >
            <Power size={15} strokeWidth={3} /> START
          </button>

          <div className="w-[3px] h-7" style={{ background: "var(--cream)", opacity: 0.25 }} />

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[46vw]">
            {apps.filter((a) => runningIds.includes(a.id)).map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  data-testid={`task-${app.id}`}
                  onClick={() => onOpen(app.id)}
                  className="flex items-center gap-2 h-8 px-2.5 font-pixel text-[18px] leading-none whitespace-nowrap"
                  style={{ background: "var(--cream)", color: "var(--black)", border: "2px solid var(--cream)" }}
                >
                  <Icon size={15} strokeWidth={2.5} />
                  {app.title.toUpperCase()}
                </button>
              );
            })}
          </div>

          <div className="w-[3px] h-7" style={{ background: "var(--cream)", opacity: 0.25 }} />

          <div className="font-pixel text-[20px] px-3 h-8 flex items-center whitespace-nowrap" style={{ background: "var(--red)", color: "var(--cream)", border: "2px solid var(--cream)" }}>
            {time}
          </div>
        </div>
      </div>
    </div>
  );
}

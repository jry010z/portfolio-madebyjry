import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function BootScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t);
          setReady(true);
          return 100;
        }
        return Math.min(100, p + Math.random() * 16 + 5);
      });
    }, 150);
    return () => clearInterval(t);
  }, []);

  const start = () => { setGone(true); onDone(); };

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center px-6"
          style={{ background: "var(--red)" }}
          data-testid="boot-screen"
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 2px, transparent 4px)",
            mixBlendMode: "multiply",
          }} />
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl sm:text-7xl leading-[0.95] text-center relative"
            style={{ color: "var(--black)" }}
          >
            (MADEBYJRY)<span style={{ color: "var(--cream)" }}>®</span>
          </motion.div>
          <div className="font-pixel text-[26px] mt-3 mb-10 tracking-widest" style={{ color: "var(--black)" }}>
            OS v2.0 — PURE EXCELLENCE
          </div>

          {!ready ? (
            <div className="w-64 relative" data-testid="boot-progress">
              <div className="h-6 retro-border" style={{ background: "var(--cream)", boxShadow: "4px 4px 0 rgba(0,0,0,0.5)" }}>
                <motion.div className="h-full" style={{ background: "var(--black)" }} animate={{ width: `${progress}%` }} />
              </div>
              <div className="font-pixel text-[20px] mt-2 text-center" style={{ color: "var(--black)" }}>
                LOADING {Math.floor(progress)}%
              </div>
            </div>
          ) : (
            <motion.button
              data-testid="press-start-btn"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={start}
              className="font-display text-2xl sm:text-3xl px-10 py-4 retro-btn relative z-10"
              style={{ background: "var(--black)", color: "var(--cream)", boxShadow: "6px 6px 0 rgba(0,0,0,0.5)" }}
            >
              ▶ PRESS START
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

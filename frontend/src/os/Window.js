import { motion, useDragControls } from "framer-motion";
import { useRef } from "react";

export default function Window({ win, focused, onFocus, onClose, onMinimize, constraintsRef, children }) {
  const controls = useDragControls();
  const ref = useRef(null);

  return (
    <motion.div
      ref={ref}
      data-testid={`window-${win.appId}`}
      drag
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={constraintsRef}
      dragElastic={0.03}
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 10 }}
      transition={{ type: "spring", stiffness: 500, damping: 34 }}
      onPointerDown={() => onFocus(win.id)}
      className="absolute overflow-hidden flex flex-col retro-border"
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
        background: "var(--red)",
        boxShadow: focused
          ? "10px 10px 0 rgba(0,0,0,0.6)"
          : "6px 6px 0 rgba(0,0,0,0.4)",
      }}
    >
      {/* Title bar */}
      <div
        onPointerDown={(e) => controls.start(e)}
        className="flex items-center gap-2 px-2 h-9 shrink-0 cursor-grab active:cursor-grabbing"
        style={{
          background: focused ? "var(--black)" : "#2a2a2a",
          color: "var(--cream)",
          borderBottom: "3px solid var(--black)",
        }}
      >
        {/* windows-style title dots */}
        <div className="flex gap-1.5 pl-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--red)" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--cream)" }} />
        </div>
        <div className="flex-1 font-pixel text-[19px] leading-none tracking-wide truncate uppercase">
          {win.title}.exe
        </div>
        <div className="flex items-center gap-1.5 pr-0.5">
          <button
            data-testid={`window-minimize-${win.appId}`}
            onClick={(e) => { e.stopPropagation(); onMinimize(win.id); }}
            className="w-6 h-6 flex items-center justify-center font-pixel text-[18px] leading-none"
            style={{ background: "var(--cream)", color: "var(--black)", border: "2px solid var(--black)" }}
          >
            _
          </button>
          <button
            className="w-6 h-6 flex items-center justify-center font-pixel text-[15px] leading-none"
            style={{ background: "var(--cream)", color: "var(--black)", border: "2px solid var(--black)" }}
          >
            □
          </button>
          <button
            data-testid={`window-close-${win.appId}`}
            onClick={(e) => { e.stopPropagation(); onClose(win.id); }}
            className="w-6 h-6 flex items-center justify-center font-pixel text-[18px] leading-none"
            style={{ background: "var(--red)", color: "var(--cream)", border: "2px solid var(--black)" }}
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden" style={{ background: "var(--red)" }}>
        {children}
      </div>
    </motion.div>
  );
}

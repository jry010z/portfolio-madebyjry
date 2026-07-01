import { motion } from "framer-motion";

export default function AboutApp() {
  return (
    <div className="h-full jry-scroll overflow-y-auto p-6 flex flex-col" style={{ background: "var(--red)" }} data-testid="about-app">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="font-display text-4xl leading-[0.9] mb-1" style={{ color: "var(--black)" }}>
          (MADEBYJRY)<span style={{ color: "var(--cream)" }}>®</span>
        </div>
        <div className="font-pixel text-[19px] mb-4" style={{ color: "var(--black)" }}>
          EDITOR / CONTENT MANAGER / DESIGNER
        </div>
        <p className="font-display text-2xl leading-[0.98] max-w-md mb-4" style={{ color: "var(--black)" }}>
          I HELP CREATORS BECOME THE BEST VERSION OF THEMSELVES.
        </p>
        <div className="retro-border p-3 max-w-md" style={{ background: "var(--cream)", boxShadow: "6px 6px 0 rgba(0,0,0,0.5)" }}>
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--black)" }}>
            Hey, I'm <b>JRY</b> — aka <b>madebyjry</b>. From scroll-stopping thumbnails to viral shorts,
            cinematic long-form edits and full brand systems, I've worked with some of the biggest names online.
            Open the <b>WORK</b> and <b>NETWORK</b> icons to see more.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5 max-w-md">
          {[["44M+", "REACH"], ["6+", "CREATORS"], ["4", "FORMATS"]].map(([n, l]) => (
            <div key={l} className="retro-border py-3 text-center" style={{ background: "var(--black)", boxShadow: "4px 4px 0 rgba(0,0,0,0.5)" }}>
              <div className="font-display text-2xl leading-none" style={{ color: "var(--red)" }}>{n}</div>
              <div className="font-pixel text-[16px] leading-none mt-1" style={{ color: "var(--cream)" }}>{l}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

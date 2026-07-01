import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Twitter, Instagram, ArrowUpRight } from "lucide-react";
import { getSettings, openExternal } from "../lib/api";

const LINKS = [
  { id: "x", label: "X / TWITTER", handle: "@MADEBYJRY", href: "https://x.com/madebyjry", icon: Twitter },
  { id: "instagram", label: "INSTAGRAM", handle: "@MADEBYJRY", href: "https://www.instagram.com/madebyjry/", icon: Instagram },
];

export default function ContactApp() {
  const [s, setS] = useState({ contact_kicker: "LET'S_WORK.BAT", contact_title: "READY TO ELEVATE YOUR CONTENT?" });
  useEffect(() => { getSettings().then(setS).catch(() => {}); }, []);
  return (
    <div className="h-full jry-scroll overflow-y-auto p-6 flex flex-col justify-center" style={{ background: "var(--red)" }} data-testid="contact-app">
      <div className="font-pixel text-[20px] mb-1" style={{ color: "var(--black)" }}>&gt; {s.contact_kicker}</div>
      <h2 className="font-display text-4xl leading-[0.88] mb-4" style={{ color: "var(--black)" }}>
        {s.contact_title}
      </h2>

      <div className="space-y-3">
        {LINKS.map((l, i) => {
          const Icon = l.icon;
          return (
            <motion.button key={l.id} type="button" onClick={() => openExternal(l.href)}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ x: 5, y: -2 }}
              className="group w-full text-left flex items-center gap-3 p-3 retro-border"
              style={{ background: "var(--cream)", boxShadow: "5px 5px 0 rgba(0,0,0,0.5)" }}
              data-testid={`contact-${l.id}`}>
              <span className="w-11 h-11 flex items-center justify-center shrink-0" style={{ background: "var(--black)", color: "var(--cream)" }}>
                <Icon size={20} strokeWidth={2.5} />
              </span>
              <div className="flex-1">
                <div className="font-display text-[18px] leading-none" style={{ color: "var(--black)" }}>{l.label}</div>
                <div className="font-pixel text-[17px] leading-none" style={{ color: "var(--red-dark)" }}>{l.handle}</div>
              </div>
              <ArrowUpRight size={22} strokeWidth={3} style={{ color: "var(--black)" }} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

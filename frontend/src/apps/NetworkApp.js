import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { getNetwork, getSettings, resolveSrc, openExternal } from "../lib/api";

export default function NetworkApp() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState({ network_title: "THE NETWORK", network_subtitle: "creators & brands i've leveled up" });

  useEffect(() => {
    getNetwork().then((d) => { setClients(d); setLoading(false); }).catch(() => setLoading(false));
    getSettings().then(setS).catch(() => {});
  }, []);

  return (
    <div className="h-full jry-scroll overflow-y-auto" style={{ background: "var(--red)" }} data-testid="network-app">
      <div className="p-5">
        <h2 className="font-display text-3xl leading-[0.9]" style={{ color: "var(--black)" }}>{s.network_title}</h2>
        <p className="font-pixel text-[19px] mb-4" style={{ color: "var(--black)" }}>
          &gt; {s.network_subtitle}
        </p>

        {loading ? (
          <div className="font-pixel text-[22px]">LOADING…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {clients.map((c, i) => (
              <motion.button key={c.id} type="button"
                onClick={() => c.link && openExternal(c.link)}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3, x: -3 }}
                className="group retro-border p-3 flex flex-col items-center text-center"
                style={{ background: "var(--cream)", boxShadow: "5px 5px 0 rgba(0,0,0,0.5)", cursor: c.link ? "pointer" : "default" }}
                data-testid={`client-${c.id}`}>
                <div className="w-16 h-16 rounded-full overflow-hidden mb-2" style={{ border: "3px solid var(--black)" }}>
                  <img src={resolveSrc(c.logo_url)} alt={c.name} loading="lazy" className="w-full h-full object-cover" style={{ filter: "grayscale(0.15) contrast(1.05)" }} />
                </div>
                <div className="font-display text-[16px] leading-none flex items-center gap-1" style={{ color: "var(--black)" }}>
                  {c.name}
                  {c.link && <ArrowUpRight size={12} strokeWidth={3} />}
                </div>
                <div className="font-display text-[22px] leading-none mt-1" style={{ color: "var(--red)" }}>{c.followers}</div>
                <div className="font-pixel text-[15px] leading-none" style={{ color: "var(--black)" }}>FOLLOWERS</div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

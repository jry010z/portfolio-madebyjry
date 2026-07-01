import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Clapperboard, Film, PenTool, Folder, ArrowUpRight, Play, X } from "lucide-react";
import { getWork, resolveSrc, ytId, ytThumb, openExternal } from "../lib/api";

const CATS = [
  { id: "thumbnail", label: "Thumbnails", icon: Image },
  { id: "short", label: "Shorts", icon: Clapperboard },
  { id: "longform", label: "Long-form", icon: Film },
  { id: "design", label: "Designs", icon: PenTool },
];

export default function WorkApp() {
  const [active, setActive] = useState("thumbnail");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null); // item being viewed (image or video)

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getWork(active)
      .then((d) => { if (alive) { setItems(d); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [active]);

  const isVertical = active === "short";
  const thumbFor = (it) => (it.image_url ? resolveSrc(it.image_url) : ytThumb(it.youtube_url));
  const viewingVideo = viewing && ytId(viewing.youtube_url);

  return (
    <div className="flex h-full relative" data-testid="work-app">
      {/* Sidebar (Finder) */}
      <div className="w-40 shrink-0 py-3 px-2 jry-scroll overflow-y-auto"
        style={{ background: "var(--black)", borderRight: "3px solid var(--black)" }}>
        <div className="font-pixel text-[20px] px-1 mb-2" style={{ color: "var(--red)" }}>C:\FILES</div>
        {CATS.map((c) => {
          const Icon = c.icon;
          const on = active === c.id;
          return (
            <button key={c.id} data-testid={`work-cat-${c.id}`} onClick={() => setActive(c.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 mb-1 font-pixel text-[19px] leading-none"
              style={{ background: on ? "var(--red)" : "transparent", color: "var(--cream)", border: on ? "2px solid var(--cream)" : "2px solid transparent" }}>
              <Icon size={16} strokeWidth={2.5} />
              {c.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 jry-scroll overflow-y-auto p-4" style={{ background: "var(--red)" }}>
        {loading ? (
          <div className="h-full flex items-center justify-center font-pixel text-[22px]">LOADING…</div>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 font-pixel text-[22px]">
            <Folder size={40} strokeWidth={2.5} /> EMPTY FOLDER
          </div>
        ) : (
          <div className={`grid gap-4 ${isVertical ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}>
            {items.map((it, i) => {
              const isVideo = !!ytId(it.youtube_url);
              return (
                <motion.button key={it.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setViewing(it)}
                  className="group block w-full text-left retro-border overflow-hidden"
                  style={{ background: "var(--black)", boxShadow: "5px 5px 0 rgba(0,0,0,0.5)" }}
                  data-testid={`work-item-${it.id}`}>
                  <div className={`${isVertical ? "aspect-[9/16]" : "aspect-video"} overflow-hidden relative`} style={{ borderBottom: "3px solid var(--black)" }}>
                    {thumbFor(it) ? (
                      <img src={thumbFor(it)} alt={it.title} loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" style={{ filter: "contrast(1.05)" }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--cream)" }}>
                        <Film size={32} color="var(--black)" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.25)" }}>
                      <span className="w-12 h-12 flex items-center justify-center retro-border" style={{ background: "var(--red)" }}>
                        {isVideo ? <Play size={20} color="var(--cream)" fill="var(--cream)" /> : <Image size={20} color="var(--cream)" />}
                      </span>
                    </div>
                  </div>
                  <div className="p-2" style={{ background: "var(--cream)" }}>
                    <div className="font-display text-[16px] leading-none flex items-center gap-1" style={{ color: "var(--black)" }}>
                      {it.title}
                    </div>
                    {it.subtitle && <div className="font-pixel text-[16px] leading-none mt-1" style={{ color: "var(--red-dark)" }}>{it.subtitle}</div>}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Viewer overlay: video player OR image lightbox */}
      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.88)" }}
            data-testid="work-viewer"
            onClick={() => setViewing(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="retro-border overflow-hidden w-full flex flex-col"
              style={{ background: "var(--black)", maxWidth: isVertical ? 320 : 760, maxHeight: "100%" }}
            >
              <div className="flex items-center justify-between px-2 h-9 shrink-0" style={{ background: "var(--red)", color: "var(--cream)" }}>
                <span className="font-pixel text-[18px] truncate">
                  {viewing.title.toUpperCase()}.{viewingVideo ? "MP4" : "PNG"}
                </span>
                <button data-testid="viewer-close" onClick={() => setViewing(null)}
                  className="w-6 h-6 flex items-center justify-center shrink-0" style={{ background: "var(--cream)", color: "var(--black)", border: "2px solid var(--black)" }}>
                  <X size={13} strokeWidth={3} />
                </button>
              </div>

              {viewingVideo ? (
                <div className={isVertical ? "aspect-[9/16]" : "aspect-video"}>
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${ytId(viewing.youtube_url)}?autoplay=1&rel=0`}
                    title={viewing.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="min-h-0 overflow-auto jry-scroll" style={{ background: "var(--black)" }}>
                  <img src={thumbFor(viewing)} alt={viewing.title} className="w-full h-auto object-contain" style={{ maxHeight: "70vh" }} />
                </div>
              )}

              {(viewing.subtitle || viewing.link) && (
                <div className="px-3 py-2 shrink-0 flex items-center justify-between gap-2" style={{ background: "var(--cream)" }}>
                  <span className="font-pixel text-[16px]" style={{ color: "var(--red-dark)" }}>{viewing.subtitle}</span>
                  {viewing.link && (
                    <button type="button" onClick={() => openExternal(viewing.link)}
                      className="font-display text-[14px] flex items-center gap-1 px-2 py-1" style={{ background: "var(--black)", color: "var(--cream)" }}>
                      OPEN <ArrowUpRight size={13} strokeWidth={3} />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

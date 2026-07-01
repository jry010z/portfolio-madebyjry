import { useEffect, useRef, useState } from "react";
import { Lock, Plus, Trash2, Upload, Play, Save } from "lucide-react";
import {
  verifyPasscode, getWork, getNetwork, createWork, deleteWork, createClient, deleteClient,
  uploadImage, resolveSrc, ytId, ytThumb, getSettings, updateSettings,
} from "../lib/api";

const CATS = [
  { id: "thumbnail", label: "Thumbnail" },
  { id: "short", label: "Short" },
  { id: "longform", label: "Long-form" },
  { id: "design", label: "Design" },
];
const VIDEO_CATS = ["short", "longform"];
const inputStyle = { background: "#fff", border: "2.5px solid var(--black)", color: "var(--black)" };

const TEXT_FIELDS = [
  { key: "desktop_quote", label: "DESKTOP QUOTE (home poster)" },
  { key: "network_title", label: "NETWORK — TITLE" },
  { key: "network_subtitle", label: "NETWORK — SUBTITLE" },
  { key: "contact_kicker", label: "CONTACT — SMALL LABEL" },
  { key: "contact_title", label: "CONTACT — HEADLINE" },
];

function Field({ label, ...props }) {
  return (
    <label className="block mb-2.5">
      <span className="font-pixel text-[17px] block mb-1" style={{ color: "var(--black)" }}>{label}</span>
      <input {...props} className="w-full px-2.5 py-1.5 text-[14px] outline-none" style={inputStyle} />
    </label>
  );
}

export default function AdminApp() {
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("work");
  const [work, setWork] = useState([]);
  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState({});
  const [wf, setWf] = useState({ category: "thumbnail", title: "", subtitle: "", image_url: "", youtube_url: "", link: "" });
  const [cf, setCf] = useState({ name: "", followers: "", logo_url: "", link: "" });
  const [upWork, setUpWork] = useState(false);
  const [upLogo, setUpLogo] = useState(false);
  const workFileRef = useRef(null);
  const logoFileRef = useRef(null);

  const isVideo = VIDEO_CATS.includes(wf.category);

  const refresh = () => { getWork().then(setWork); getNetwork().then(setClients); getSettings().then(setSettings); };
  useEffect(() => { if (authed) refresh(); }, [authed]);

  const login = async () => {
    setErr("");
    try { await verifyPasscode(pass); setAuthed(true); } catch { setErr("ACCESS DENIED"); }
  };

  const onWorkFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setUpWork(true);
    try { const res = await uploadImage(file, pass); setWf((w) => ({ ...w, image_url: res.url })); }
    catch { setErr("UPLOAD FAILED"); }
    setUpWork(false);
  };
  const onLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setUpLogo(true);
    try { const res = await uploadImage(file, pass); setCf((c) => ({ ...c, logo_url: res.url })); }
    catch { setErr("UPLOAD FAILED"); }
    setUpLogo(false);
  };

  const addWork = async () => {
    if (!wf.title) return setErr("TITLE REQUIRED");
    if (isVideo && !ytId(wf.youtube_url)) return setErr("VALID YOUTUBE LINK REQUIRED");
    if (!isVideo && !wf.image_url) return setErr("UPLOAD AN IMAGE FIRST");
    setErr("");
    await createWork(wf, pass);
    setWf({ category: wf.category, title: "", subtitle: "", image_url: "", youtube_url: "", link: "" });
    if (workFileRef.current) workFileRef.current.value = "";
    refresh();
  };
  const addClient = async () => {
    if (!cf.name) return setErr("NAME REQUIRED");
    if (!cf.logo_url) return setErr("UPLOAD A LOGO FIRST");
    setErr(""); await createClient(cf, pass);
    setCf({ name: "", followers: "", logo_url: "", link: "" });
    if (logoFileRef.current) logoFileRef.current.value = "";
    refresh();
  };
  const saveText = async () => {
    setErr(""); setMsg("");
    try { const res = await updateSettings(settings, pass); setSettings(res); setMsg("SAVED ✓"); setTimeout(() => setMsg(""), 2000); }
    catch { setErr("SAVE FAILED"); }
  };

  if (!authed) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8" style={{ background: "var(--red)" }} data-testid="admin-app">
        <div className="w-16 h-16 flex items-center justify-center mb-4 retro-border" style={{ background: "var(--black)", boxShadow: "5px 5px 0 rgba(0,0,0,0.5)" }}>
          <Lock size={28} strokeWidth={2.5} color="var(--cream)" />
        </div>
        <h2 className="font-display text-3xl leading-none mb-1" style={{ color: "var(--black)" }}>STUDIO ACCESS</h2>
        <p className="font-pixel text-[18px] mb-4" style={{ color: "var(--black)" }}>&gt; enter passcode</p>
        <input data-testid="admin-passcode-input" type="password" value={pass}
          onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="********" className="w-56 text-center px-3 py-2 text-[15px] outline-none mb-3 font-pixel" style={inputStyle} />
        {err && <div className="font-pixel text-[18px] mb-2" style={{ color: "var(--black)", background: "var(--cream)", padding: "2px 8px" }}>{err}</div>}
        <button data-testid="admin-login-btn" onClick={login}
          className="w-56 py-2.5 font-display text-[18px] retro-btn" style={{ background: "var(--black)", color: "var(--cream)" }}>
          UNLOCK
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--red)" }} data-testid="admin-app">
      <div className="flex gap-1.5 p-2 shrink-0" style={{ borderBottom: "3px solid var(--black)" }}>
        {[["work", "WORK"], ["network", "NETWORK"], ["text", "TEXT"]].map(([id, l]) => (
          <button key={id} data-testid={`admin-tab-${id}`} onClick={() => { setTab(id); setErr(""); setMsg(""); }}
            className="px-3 py-1.5 font-display text-[16px] leading-none"
            style={{ background: tab === id ? "var(--black)" : "var(--cream)", color: tab === id ? "var(--cream)" : "var(--black)", border: "2.5px solid var(--black)" }}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 jry-scroll overflow-y-auto p-3">
        {err && <div className="font-pixel text-[18px] mb-3 inline-block px-2" style={{ background: "var(--black)", color: "var(--cream)" }}>{err}</div>}
        {msg && <div className="font-pixel text-[18px] mb-3 inline-block px-2" style={{ background: "var(--black)", color: "var(--cream)" }}>{msg}</div>}

        {tab === "work" && (
          <>
            <div className="retro-border p-3 mb-4" style={{ background: "var(--cream)" }}>
              <div className="font-display text-[18px] mb-2" style={{ color: "var(--black)" }}>ADD WORK</div>
              <label className="block mb-2.5">
                <span className="font-pixel text-[17px] block mb-1">CATEGORY</span>
                <select data-testid="admin-work-category" value={wf.category}
                  onChange={(e) => setWf({ ...wf, category: e.target.value, image_url: "", youtube_url: "" })}
                  className="w-full px-2.5 py-1.5 text-[14px] outline-none" style={inputStyle}>
                  {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>
              <Field label="TITLE" data-testid="admin-work-title" value={wf.title} onChange={(e) => setWf({ ...wf, title: e.target.value })} />
              <Field label="SUBTITLE" value={wf.subtitle} onChange={(e) => setWf({ ...wf, subtitle: e.target.value })} />

              {isVideo ? (
                <>
                  <Field label="YOUTUBE LINK (video or short)" data-testid="admin-work-youtube" placeholder="https://youtube.com/watch?v=…"
                    value={wf.youtube_url} onChange={(e) => setWf({ ...wf, youtube_url: e.target.value })} />
                  {ytId(wf.youtube_url) && (
                    <div className="mb-2.5 flex items-center gap-2">
                      <img src={ytThumb(wf.youtube_url)} alt="preview" className="w-24 h-14 object-cover" style={{ border: "2px solid var(--black)" }} />
                      <span className="font-pixel text-[16px]" style={{ color: "var(--black)" }}><Play size={13} className="inline" /> video ready</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="font-pixel text-[17px] block mb-1">UPLOAD IMAGE</span>
                  <input ref={workFileRef} data-testid="admin-work-file" type="file" accept="image/*" onChange={onWorkFile}
                    className="w-full text-[13px] mb-2 font-pixel" style={{ color: "var(--black)" }} />
                  {upWork && <div className="font-pixel text-[17px] mb-2">UPLOADING…</div>}
                  {wf.image_url && (
                    <img src={resolveSrc(wf.image_url)} alt="preview" className="w-32 h-20 object-cover mb-2.5" style={{ border: "2px solid var(--black)" }} />
                  )}
                </>
              )}

              <Field label="LINK (OPTIONAL)" value={wf.link} onChange={(e) => setWf({ ...wf, link: e.target.value })} />
              <button data-testid="admin-add-work-btn" onClick={addWork} disabled={upWork}
                className="flex items-center gap-1.5 px-3 py-2 font-display text-[15px] retro-btn" style={{ background: "var(--black)", color: "var(--cream)", opacity: upWork ? 0.5 : 1 }}>
                {isVideo ? <Plus size={16} strokeWidth={3} /> : <Upload size={16} strokeWidth={3} />} ADD WORK
              </button>
            </div>
            <div className="space-y-2">
              {work.map((it) => {
                const thumb = it.image_url ? resolveSrc(it.image_url) : ytThumb(it.youtube_url);
                return (
                  <div key={it.id} className="flex items-center gap-3 p-2 retro-border" style={{ background: "var(--cream)" }}>
                    {thumb ? <img src={thumb} alt="" className="w-12 h-9 object-cover" style={{ border: "2px solid var(--black)" }} />
                      : <div className="w-12 h-9 flex items-center justify-center" style={{ border: "2px solid var(--black)" }}><Play size={14} /></div>}
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[15px] leading-none truncate" style={{ color: "var(--black)" }}>{it.title}</div>
                      <div className="font-pixel text-[15px] leading-none" style={{ color: "var(--red-dark)" }}>
                        {it.category}{ytId(it.youtube_url) ? " · ▶ video" : ""}
                      </div>
                    </div>
                    <button data-testid={`admin-del-work-${it.id}`} onClick={async () => { await deleteWork(it.id, pass); refresh(); }}
                      className="p-1.5" style={{ background: "var(--red)", color: "var(--cream)", border: "2px solid var(--black)" }}>
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "network" && (
          <>
            <div className="retro-border p-3 mb-4" style={{ background: "var(--cream)" }}>
              <div className="font-display text-[18px] mb-2" style={{ color: "var(--black)" }}>ADD CLIENT</div>
              <Field label="NAME" data-testid="admin-client-name" value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} />
              <Field label="FOLLOWERS (e.g. 5M+)" data-testid="admin-client-followers" value={cf.followers} onChange={(e) => setCf({ ...cf, followers: e.target.value })} />
              <span className="font-pixel text-[17px] block mb-1">UPLOAD LOGO / AVATAR</span>
              <input ref={logoFileRef} data-testid="admin-client-logo-file" type="file" accept="image/*" onChange={onLogoFile}
                className="w-full text-[13px] mb-2 font-pixel" style={{ color: "var(--black)" }} />
              {upLogo && <div className="font-pixel text-[17px] mb-2">UPLOADING…</div>}
              {cf.logo_url && (
                <img src={resolveSrc(cf.logo_url)} alt="preview" className="w-16 h-16 rounded-full object-cover mb-2.5" style={{ border: "2px solid var(--black)" }} />
              )}
              <Field label="LINK (OPTIONAL)" value={cf.link} onChange={(e) => setCf({ ...cf, link: e.target.value })} />
              <button data-testid="admin-add-client-btn" onClick={addClient} disabled={upLogo}
                className="flex items-center gap-1.5 px-3 py-2 font-display text-[15px] retro-btn" style={{ background: "var(--black)", color: "var(--cream)", opacity: upLogo ? 0.5 : 1 }}>
                <Upload size={16} strokeWidth={3} /> ADD CLIENT
              </button>
            </div>
            <div className="space-y-2">
              {clients.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 retro-border" style={{ background: "var(--cream)" }}>
                  <img src={resolveSrc(c.logo_url)} alt="" className="w-9 h-9 rounded-full object-cover" style={{ border: "2px solid var(--black)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[15px] leading-none truncate" style={{ color: "var(--black)" }}>{c.name}</div>
                    <div className="font-pixel text-[15px] leading-none" style={{ color: "var(--red-dark)" }}>{c.followers}</div>
                  </div>
                  <button data-testid={`admin-del-client-${c.id}`} onClick={async () => { await deleteClient(c.id, pass); refresh(); }}
                    className="p-1.5" style={{ background: "var(--red)", color: "var(--cream)", border: "2px solid var(--black)" }}>
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "text" && (
          <div className="retro-border p-3" style={{ background: "var(--cream)" }}>
            <div className="font-display text-[18px] mb-2" style={{ color: "var(--black)" }}>EDIT SITE TEXT</div>
            {TEXT_FIELDS.map((f) => (
              <label key={f.key} className="block mb-3">
                <span className="font-pixel text-[17px] block mb-1" style={{ color: "var(--black)" }}>{f.label}</span>
                <textarea
                  data-testid={`admin-text-${f.key}`}
                  rows={f.key === "desktop_quote" ? 3 : 1}
                  value={settings[f.key] ?? ""}
                  onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-[14px] outline-none resize-none" style={inputStyle}
                />
              </label>
            ))}
            <button data-testid="admin-save-text-btn" onClick={saveText}
              className="flex items-center gap-1.5 px-3 py-2 font-display text-[15px] retro-btn" style={{ background: "var(--black)", color: "var(--cream)" }}>
              <Save size={16} strokeWidth={3} /> SAVE TEXT
            </button>
            <p className="font-pixel text-[15px] mt-2" style={{ color: "var(--red-dark)" }}>
              &gt; reopen a window to see changes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

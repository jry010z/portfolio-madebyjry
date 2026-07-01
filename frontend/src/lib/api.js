import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const getWork = (category) =>
  axios.get(`${API}/work`, { params: category ? { category } : {} }).then((r) => r.data);

export const getNetwork = () => axios.get(`${API}/network`).then((r) => r.data);

export const getSettings = () => axios.get(`${API}/settings`).then((r) => r.data);

export const updateSettings = (values, passcode) =>
  axios.put(`${API}/settings`, { values }, { headers: { "X-Admin-Passcode": passcode } }).then((r) => r.data);

export const verifyPasscode = (passcode) =>
  axios.post(`${API}/admin/verify`, { passcode }).then((r) => r.data);

export const createWork = (payload, passcode) =>
  axios.post(`${API}/work`, payload, { headers: { "X-Admin-Passcode": passcode } }).then((r) => r.data);

export const deleteWork = (id, passcode) =>
  axios.delete(`${API}/work/${id}`, { headers: { "X-Admin-Passcode": passcode } }).then((r) => r.data);

export const createClient = (payload, passcode) =>
  axios.post(`${API}/network`, payload, { headers: { "X-Admin-Passcode": passcode } }).then((r) => r.data);

export const deleteClient = (id, passcode) =>
  axios.delete(`${API}/network/${id}`, { headers: { "X-Admin-Passcode": passcode } }).then((r) => r.data);

export const uploadImage = (file, passcode) => {
  const fd = new FormData();
  fd.append("file", file);
  return axios.post(`${API}/upload`, fd, { headers: { "X-Admin-Passcode": passcode } }).then((r) => r.data);
};

// Resolve a stored media path (relative /api/files/... ) or absolute URL to a full src.
export const resolveSrc = (url) => (!url ? "" : url.startsWith("http") ? url : `${BACKEND_URL}${url}`);

// Extract a YouTube video id from any common URL form.
export const ytId = (url) => {
  if (!url) return "";
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : "";
};

export const ytThumb = (url) => {
  const id = ytId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
};

// Ensure external links are absolute so they don't resolve relative to our own site.
export const normalizeUrl = (url) => {
  if (!url) return "";
  const u = url.trim();
  if (/^https?:\/\//i.test(u) || /^(mailto:|tel:)/i.test(u)) return u;
  return `https://${u.replace(/^\/+/, "")}`;
};

// Reliably open an external link in a new tab (works inside sandboxed preview iframes too).
export const openExternal = (url) => {
  const u = normalizeUrl(url);
  if (!u) return;
  const win = window.open(u, "_blank", "noopener,noreferrer");
  if (win) win.opener = null;
  else window.top.location.href = u;
};

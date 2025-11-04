export const API_BASE =
  (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");

export function toWsUrl(path = "/ws") {
  const u = new URL(API_BASE);
  const proto = u.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${u.host}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiRequestBase(method: string, path: string, body?: any, opts: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    ...opts,
  };
  if (body) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText} ${txt}`);
  }
  return res;
}
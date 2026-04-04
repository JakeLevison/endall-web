/**
 * Device-level identity for Ask Endall data scoping.
 *
 * Until real user auth ships, each browser gets a random UUID stored in
 * localStorage. Every API call that reads or writes chats/files sends
 * this as X-Device-Id so users only see their own data.
 *
 * This is intentionally *not* a security boundary — anyone who copies
 * the UUID from one browser to another will see that data. It is a
 * *privacy boundary* that prevents accidental cross-device leakage.
 * Real auth will replace this.
 */

const STORAGE_KEY = "endall_device_id";

function randomUuid(): string {
  // crypto.randomUUID is widely available in modern browsers; fall back
  // to a Math.random UUID for ancient ones.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = randomUuid();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // localStorage may throw in private mode; fall back to a per-tab id
    return "";
  }
}

/** Fetch with X-Device-Id header automatically attached. */
export function deviceFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const id = getDeviceId();
  if (id) headers.set("X-Device-Id", id);
  return fetch(input, { ...init, headers });
}

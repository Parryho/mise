/** Get current UI language for API requests */
function getCurrentLang(): string {
  return localStorage.getItem("mise-lang") || "de";
}

/**
 * Typed fetch wrapper with automatic error handling.
 * Checks res.ok, extracts server error message, throws on failure.
 * Automatically sends current UI language as Accept-Language header.
 */
export async function apiFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const lang = getCurrentLang();
  const headers = new Headers(options?.headers);
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", lang);
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Anfrage fehlgeschlagen (${res.status})`);
  }
  return res.json();
}

/** Shorthand for JSON POST */
export function apiPost<T = any>(url: string, data: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/** Shorthand for JSON PUT */
export function apiPut<T = any>(url: string, data: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/** Shorthand for DELETE */
export function apiDelete(url: string): Promise<void> {
  return fetch(url, { method: "DELETE" }).then((res) => {
    if (!res.ok) {
      return res.json().catch(() => ({})).then((body: any) => {
        throw new Error(body.error || `Löschen fehlgeschlagen (${res.status})`);
      });
    }
  });
}

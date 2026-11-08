export async function postJson<T>(url: string, body: unknown, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["x-parent-token"] = token;
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = (await response.json().catch(() => ({ ok: false, error: "תשובה לא ברורה" }))) as T & {
    ok?: boolean;
    error?: string;
  };
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "משהו לא הסתדר. אפשר לנסות שוב.");
  }
  return data;
}

export async function getJson<T>(url: string, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["x-parent-token"] = token;
  const response = await fetch(url, { headers, cache: "no-store" });
  const data = (await response.json().catch(() => ({ ok: false, error: "תשובה לא ברורה" }))) as T & {
    ok?: boolean;
    error?: string;
  };
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "משהו לא הסתדר. אפשר לנסות שוב.");
  }
  return data;
}

export const PARENT_TOKEN_KEY = "masa-parent-token";

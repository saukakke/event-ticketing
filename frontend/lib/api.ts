const API_BASE = "https://event-ticketing-backend-yzzr.onrender.com";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  // Browser requests stay same-origin so the session cookie belongs to the
  // Render frontend. The Next.js rewrite proxies /api/* to the backend.
  // Server-rendered pages use the backend directly because relative fetch URLs
  // are not available from the Next.js server runtime.
  const baseUrl = typeof window === "undefined" ? `${API_BASE}/api` : "/api";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${normalizedPath}`, {
      ...options,
      credentials: "include",
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error("Unable to reach the EventFlow server. Please check that the backend is running and the application is configured correctly.");
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        `The server returned an error (${response.status}). Please try again.`
    );
  }

  if (!payload || !("data" in payload)) {
    throw new Error("The server returned an invalid response.");
  }

  return payload.data as T;
}

export type Event = { id: string; title: string; slug: string; description: string; venue: string; city: string; startAt: string; endAt: string; status: string; ticketTypes: TicketType[]; organizer?: { name: string } };
export type TicketType = { id: string; name: string; description: string; priceKobo: number; quantity: number; quantityRemaining: number };
export type Ticket = { id: string; code: string; qrDataUrl: string; checkedIn: boolean };
export function formatNaira(kobo: number) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100); }
export function formatDate(value: string) { return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

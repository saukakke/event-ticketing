const API_URL = "https://event-ticketing-backend-yzzr.onrender.com/" || "http://localhost:4000";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Request failed.");
  }
  return payload.data as T;
}

export type Event = {
  id: string;
  title: string;
  slug: string;
  description: string;
  venue: string;
  city: string;
  startAt: string;
  endAt: string;
  status: string;
  ticketTypes: TicketType[];
  organizer?: { name: string };
};

export type TicketType = {
  id: string;
  name: string;
  description: string;
  priceKobo: number;
  quantity: number;
  quantityRemaining: number;
};

export type Ticket = {
  id: string;
  code: string;
  qrDataUrl: string;
  checkedIn: boolean;
};

export function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

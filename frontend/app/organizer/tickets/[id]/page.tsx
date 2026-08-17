"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatDate, formatNaira } from "@/lib/api";

type Ticket = { id: string; code: string; qrToken: string; qrDataUrl: string; checkedIn: boolean; checkedInAt?: string | null; createdAt: string; event: { title: string; venue: string; city: string; startAt: string; endAt: string }; ticketType: { name: string; description: string; priceKobo: number }; order: { id: string; status: string; totalKobo: number; paymentReference?: string | null; user: { name: string; email: string } } };

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [ticket, setTicket] = useState<Ticket | null>(null); const [error, setError] = useState("");
  useEffect(() => { params.then(({ id }) => api<Ticket>(`/organizer/tickets/${id}`).then(setTicket).catch((e) => setError(e instanceof Error ? e.message : "Unable to load ticket."))); }, [params]);
  if (error) return <main className="container section"><div className="empty"><h2>Unable to load ticket</h2><p>{error}</p><Link className="btn btn-primary" href="/organizer/tickets">Back to tickets</Link></div></main>;
  if (!ticket) return <main className="container section"><p>Loading ticket…</p></main>;
  return <main className="dashboard"><div className="container"><div className="dashboard-head"><div><div className="eyebrow">Ticket details</div><h1>{ticket.code}</h1></div><Link className="btn btn-secondary" href="/organizer/tickets">Back to tickets</Link></div><div className="grid grid-2"><section className="card"><div className="eyebrow">Ticket holder</div><h2>{ticket.order.user.name}</h2><p>{ticket.order.user.email}</p><div className="eyebrow">Ticket type</div><h3>{ticket.ticketType.name}</h3><p>{formatNaira(ticket.ticketType.priceKobo)}</p><div className="eyebrow">Status</div><p>{ticket.checkedIn ? `Checked in${ticket.checkedInAt ? ` on ${formatDate(ticket.checkedInAt)}` : ""}` : "Valid · not checked in"}</p></section><section className="card"><div className="eyebrow">Event</div><h2>{ticket.event.title}</h2><p>{ticket.event.venue}, {ticket.event.city}</p><p>{formatDate(ticket.event.startAt)} – {formatDate(ticket.event.endAt)}</p><div className="eyebrow">Order</div><p>{ticket.order.id}</p><p>Payment: {ticket.order.paymentReference || "Not available"}</p><p>Order status: {ticket.order.status}</p></section></div><section className="card"><div className="eyebrow">QR code</div><div style={{ display: "grid", placeItems: "center", gap: "1rem" }}><img src={ticket.qrDataUrl} alt={`QR code for ${ticket.code}`} width={260} height={260} /><p className="meta">QR token: {ticket.qrToken}</p></div></section></div></main>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatDate, formatNaira } from "@/lib/api";

type Order = { id: string; status: string; totalKobo: number; currency: string; paymentReference?: string | null; createdAt: string; updatedAt: string; user: { name: string; email: string }; event: { title: string; venue: string; city: string; startAt: string; endAt: string }; items: { id: string; quantity: number; unitPriceKobo: number; ticketType: { name: string } }[]; tickets: { id: string; code: string; checkedIn: boolean; checkedInAt?: string | null; createdAt: string; ticketType: { name: string } }[] };

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null); const [error, setError] = useState("");
  useEffect(() => { params.then(({ id }) => api<Order>(`/organizer/orders/${id}`).then(setOrder).catch((e) => setError(e instanceof Error ? e.message : "Unable to load order."))); }, [params]);
  if (error) return <main className="container section"><div className="empty"><h2>Unable to load order</h2><p>{error}</p><Link className="btn btn-primary" href="/organizer/orders">Back to orders</Link></div></main>;
  if (!order) return <main className="container section"><p>Loading order…</p></main>;
  return <main className="dashboard"><div className="container"><div className="dashboard-head"><div><div className="eyebrow">Order details</div><h1>{order.id}</h1></div><Link className="btn btn-secondary" href="/organizer/orders">Back to orders</Link></div>
    <div className="stats"><div className="stat"><span className="meta">Status</span><strong>{order.status}</strong></div><div className="stat"><span className="meta">Total</span><strong>{formatNaira(order.totalKobo)}</strong></div><div className="stat"><span className="meta">Tickets</span><strong>{order.tickets.length}</strong></div></div>
    <div className="grid grid-2"><section className="card"><div className="eyebrow">Customer</div><h2>{order.user.name}</h2><p>{order.user.email}</p><div className="eyebrow">Payment reference</div><p>{order.paymentReference || "Not available"}</p><div className="eyebrow">Placed</div><p>{formatDate(order.createdAt)}</p></section><section className="card"><div className="eyebrow">Event</div><h2>{order.event.title}</h2><p>{order.event.venue}, {order.event.city}</p><p>{formatDate(order.event.startAt)} – {formatDate(order.event.endAt)}</p></section></div>
    <section className="card"><div className="eyebrow">Order items</div><div className="table-wrap"><table><thead><tr><th>Ticket type</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id}><td>{item.ticketType.name}</td><td>{item.quantity}</td><td>{formatNaira(item.unitPriceKobo)}</td><td>{formatNaira(item.unitPriceKobo * item.quantity)}</td></tr>)}</tbody></table></div></section>
    <section className="card"><div className="eyebrow">Issued tickets</div><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Type</th><th>Check-in</th><th>Issued</th></tr></thead><tbody>{order.tickets.map((ticket) => <tr key={ticket.id}><td><Link href={`/organizer/tickets/${ticket.id}`}><strong>{ticket.code}</strong></Link></td><td>{ticket.ticketType.name}</td><td>{ticket.checkedIn ? `Checked in${ticket.checkedInAt ? ` · ${formatDate(ticket.checkedInAt)}` : ""}` : "Not checked in"}</td><td>{formatDate(ticket.createdAt)}</td></tr>)}</tbody></table></div></section>
  </div></main>;
}

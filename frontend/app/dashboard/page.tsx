"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatDate, formatNaira, Ticket } from "@/lib/api";

type Order = {
  id: string;
  totalKobo: number;
  status: string;
  createdAt: string;
  event: { title: string; venue: string; city: string; startAt: string };
  tickets: Ticket[];
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Order[]>("/orders/me").then(setOrders).catch((e) => {
      setError(e instanceof Error ? e.message : "Please sign in.");
    });
  }, []);

  if (error) return <main className="container section"><div className="empty"><h2>Sign in to view your tickets</h2><p>{error}</p><Link className="btn btn-primary" href="/login">Sign in</Link></div></main>;

  return (
    <main className="dashboard">
      <div className="container">
        <div className="dashboard-head"><div><div className="eyebrow">Attendee dashboard</div><h1 style={{ fontSize: "3rem" }}>Your tickets</h1></div><Link className="btn btn-primary" href="/events">Find an event</Link></div>
        {orders.length === 0 ? <div className="empty">You have not booked an event yet.</div> : orders.map((order) => (
          <section className="panel" style={{ marginBottom: 18 }} key={order.id}>
            <div className="section-head" style={{ marginBottom: 16 }}>
              <div><h3>{order.event.title}</h3><div className="meta">{order.event.venue}, {order.event.city} · {formatDate(order.event.startAt)}</div></div>
              <strong>{formatNaira(order.totalKobo)}</strong>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {order.tickets.map((ticket) => (
                <div className="ticket-card" key={ticket.id}>
                  <div><div className="eyebrow">Digital ticket</div><h3>{ticket.code}</h3><p>Present this QR code at the event entrance.</p><div className="meta">Issued {formatDate(order.createdAt)}</div></div>
                  <img className="qr" src={ticket.qrDataUrl} alt={`QR code for ticket ${ticket.code}`} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatDate, formatNaira, Ticket } from "@/lib/api";

type Order = { id: string; totalKobo: number; status: string; createdAt: string; event: { title: string; venue: string; city: string; startAt: string }; tickets: Ticket[] };

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  async function loadOrders() { const data = await api<Order[]>("/orders/me"); setOrders(data); }
  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams(window.location.search);
        const reference = params.get("reference");
        const payment = params.get("payment");
        if (reference && payment === "return") {
          setPaymentMessage("Confirming your payment…");
          const finalized = await api<{ status: string }>(`/payments/paystack/callback?reference=${encodeURIComponent(reference)}`);
          window.history.replaceState({}, "", "/dashboard");
          setPaymentMessage(finalized.status === "PAID" ? "Payment confirmed. Your digital ticket is ready." : finalized.status === "FAILED" ? "Payment was not completed. Your reserved ticket inventory has been released." : "Payment is still being confirmed. Refresh shortly if your ticket does not appear.");
        }
        await loadOrders();
      } catch (e) { setError(e instanceof Error ? e.message : "Unable to load your dashboard."); }
    }
    load();
  }, []);
  if (error) return <main className="container section"><div className="empty"><h2>Unable to load your tickets</h2><p>{error}</p><Link className="btn btn-primary" href="/login">Sign in</Link></div></main>;
  return <main className="dashboard"><div className="container"><div className="dashboard-head"><div><div className="eyebrow">Attendee dashboard</div><h1 style={{ fontSize: "3rem" }}>Your tickets</h1></div><Link className="btn btn-primary" href="/events">Find an event</Link></div>{paymentMessage && <div className="panel" style={{ marginBottom: 18 }}>{paymentMessage}</div>}{orders.length === 0 ? <div className="empty">You have not booked an event yet.</div> : orders.map((order) => <section className="panel" style={{ marginBottom: 18 }} key={order.id}><div className="section-head" style={{ marginBottom: 16 }}><div><h3>{order.event.title}</h3><div className="meta">{order.event.venue}, {order.event.city} · {formatDate(order.event.startAt)}</div></div><div style={{ textAlign: "right" }}><strong>{formatNaira(order.totalKobo)}</strong><div className="meta">{order.status}</div></div></div>{order.status === "PAID" && order.tickets.length > 0 ? <div style={{ display: "grid", gap: 12 }}>{order.tickets.map((ticket) => <div className="ticket-card" key={ticket.id}><div><div className="eyebrow">Digital ticket</div><h3>{ticket.code}</h3><p>Present this QR code at the event entrance.</p><div className="meta">Issued {formatDate(order.createdAt)}</div></div><img className="qr" src={ticket.qrDataUrl} alt={`QR code for ticket ${ticket.code}`} /></div>)}</div> : <p className="meta">{order.status === "PENDING" ? "Payment is awaiting confirmation." : "This payment was not completed."}</p>}</section>)}</div></main>;
}

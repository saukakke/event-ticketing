"use client";

import Link from "next/link";
import { api, formatDate, formatNaira, Ticket } from "@/lib/api";
import { useEffect, useState } from "react";
import { EventManagementTable } from "@/components/event-management-table";

type Order = {
  id: string;
  totalKobo: number;
  status: string;
  createdAt: string;
  event: { title: string; venue: string; city: string; startAt: string };
  tickets: Ticket[];
};

type OrganizerEvent = {
  id: string;
  title: string;
  city: string;
  status: string;
  startAt: string;
  salesKobo: number;
  ordersCount: number;
  ticketTypes: { id: string; name: string; quantity: number; quantityRemaining: number }[];
};

export function AttendeeOverview() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

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
          setPaymentMessage(finalized.status === "PAID"
            ? "Payment confirmed. Your digital ticket is ready."
            : finalized.status === "FAILED"
              ? "Payment was not completed. Your reserved ticket inventory has been released."
              : "Payment is still being confirmed. Refresh shortly if your ticket does not appear.");
        }
        setOrders(await api<Order[]>("/orders/me"));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load your dashboard.");
      }
    }
    void load();
  }, []);

  if (error) return <DashboardError title="Unable to load your tickets" message={error} />;

  return (
    <main className="dashboard">
      <div className="container">
        <DashboardHead eyebrow="Attendee dashboard" title="Your tickets" action="Find an event" href="/events" />
        {paymentMessage && <div className="panel" style={{ marginBottom: 18 }}>{paymentMessage}</div>}
        {orders.length === 0 ? <div className="empty">You have not booked an event yet.</div> : orders.map((order) => (
          <section className="panel" style={{ marginBottom: 18 }} key={order.id}>
            <div className="section-head" style={{ marginBottom: 16 }}>
              <div><h3>{order.event.title}</h3><div className="meta">{order.event.venue}, {order.event.city} · {formatDate(order.event.startAt)}</div></div>
              <div style={{ textAlign: "right" }}><strong>{formatNaira(order.totalKobo)}</strong><div className="meta">{order.status}</div></div>
            </div>
            {order.status === "PAID" && order.tickets.length > 0 ? (
              <div style={{ display: "grid", gap: 12 }}>
                {order.tickets.map((ticket) => (
                  <div className="ticket-card" key={ticket.id}>
                    <div><div className="eyebrow">Digital ticket</div><h3>{ticket.code}</h3><p>Present this QR code at the event entrance.</p><div className="meta">Issued {formatDate(order.createdAt)}</div></div>
                    <img className="qr" src={ticket.qrDataUrl} alt={`QR code for ticket ${ticket.code}`} />
                  </div>
                ))}
              </div>
            ) : <p className="meta">{order.status === "PENDING" ? "Payment is awaiting confirmation." : "This payment was not completed."}</p>}
          </section>
        ))}
      </div>
    </main>
  );
}

export function OrganizerOverview() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<OrganizerEvent[]>("/organizer/events").then(setEvents).catch((e) => setError(e instanceof Error ? e.message : "Unable to load organizer data."));
  }, []);

  if (error) return <DashboardError title="Unable to load organizer overview" message={error} />;

  const sales = events.reduce((sum, event) => sum + event.salesKobo, 0);
  const orders = events.reduce((sum, event) => sum + event.ordersCount, 0);
  const tickets = events.reduce((sum, event) => sum + event.ticketTypes.reduce((total, ticket) => total + ticket.quantity - ticket.quantityRemaining, 0), 0);

  return (
    <main className="dashboard"><div className="container">
      <DashboardHead eyebrow="Organizer dashboard" title="Manage your events" action="Create event" href="/organizer/new" />
      <ManagementNav organizer />
      <div className="stats"><div className="stat"><span className="meta">Sales</span><strong>{formatNaira(sales)}</strong></div><div className="stat"><span className="meta">Orders</span><strong>{orders}</strong></div><div className="stat"><span className="meta">Tickets sold</span><strong>{tickets}</strong></div></div>
      {events.length === 0 ? <div className="empty">No events have been created yet.</div> : <EventManagementTable initialEvents={events} role="ORGANIZER" />}
    </div></main>
  );
}

export function AdminOverview() {
  const [data, setData] = useState<any>();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<any>("/admin/overview"), api<OrganizerEvent[]>("/organizer/events")])
      .then(([overview, managedEvents]) => { setData(overview); setEvents(managedEvents); })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load admin overview."));
  }, []);

  if (error) return <DashboardError title="Unable to load admin overview" message={error} />;
  if (!data) return <main className="dashboard"><div className="container"><div className="empty">Loading admin dashboard…</div></div></main>;

  const m = data.metrics;
  return (
    <main className="dashboard"><div className="container">
      <DashboardHead eyebrow="Administration" title="Platform overview" />
      <ManagementNav admin />
      <div className="stats"><div className="stat"><span className="meta">Users</span><strong>{m.users}</strong></div><div className="stat"><span className="meta">Organizers</span><strong>{m.organizers}</strong></div><div className="stat"><span className="meta">Events</span><strong>{m.events}</strong></div><div className="stat"><span className="meta">Orders</span><strong>{m.orders}</strong></div><div className="stat"><span className="meta">Tickets</span><strong>{m.tickets}</strong></div><div className="stat"><span className="meta">Gross revenue</span><strong>{formatNaira(m.grossRevenueKobo)}</strong></div><div className="stat"><span className="meta">Refunded</span><strong>{formatNaira(m.refundedKobo)}</strong></div><div className="stat"><span className="meta">Net revenue</span><strong>{formatNaira(m.netRevenueKobo)}</strong></div></div>
      <section className="panel" style={{ marginBottom: 18 }}>
        <div className="section-head"><div><div className="eyebrow">Event management</div><h2>All events</h2></div><Link className="btn btn-secondary" href="/events">Public events</Link></div>
        {events.length === 0 ? <div className="empty">No events are available.</div> : <EventManagementTable initialEvents={events} role="ADMIN" />}
      </section>
      {data.recentOrders?.length ? <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Event</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead><tbody>{data.recentOrders.map((o: any) => <tr key={o.id}><td>{o.id}</td><td>{o.user.name}<div className="meta">{o.user.email}</div></td><td>{o.event.title}</td><td>{o.status}</td><td>{formatNaira(o.totalKobo)}</td><td>{formatDate(o.createdAt)}</td></tr>)}</tbody></table></div> : <div className="empty">No orders have been recorded yet.</div>}
    </div></main>
  );
}

function DashboardHead({ eyebrow, title, action, href }: { eyebrow: string; title: string; action?: string; href?: string }) {
  return <div className="dashboard-head"><div><div className="eyebrow">{eyebrow}</div><h1 style={{ fontSize: "3rem" }}>{title}</h1></div>{action && href && <Link className="btn btn-primary" href={href}>{action}</Link>}</div>;
}

function ManagementNav({ organizer = false, admin = false }: { organizer?: boolean; admin?: boolean }) {
  return <nav className="card" style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.5rem" }} aria-label={admin ? "Administration" : "Management"}>
    {admin ? <><Link className="btn btn-secondary" href="/admin/users">Users</Link><Link className="btn btn-secondary" href="/admin/orders">Orders</Link><Link className="btn btn-secondary" href="/admin/tickets">Tickets</Link><Link className="btn btn-secondary" href="/admin/payments">Payments</Link><Link className="btn btn-secondary" href="/admin/check-in">Check-in</Link><Link className="btn btn-secondary" href="/admin/audit">Audit log</Link></> : organizer ? <><Link className="btn btn-secondary" href="/organizer/orders">Orders</Link><Link className="btn btn-secondary" href="/organizer/tickets">Tickets</Link><Link className="btn btn-secondary" href="/organizer/payments">Payment history</Link><Link className="btn btn-secondary" href="/organizer/check-in">Check-in</Link></> : null}
  </nav>;
}

function DashboardError({ title, message }: { title: string; message: string }) {
  return <main className="container section"><div className="empty"><h2>{title}</h2><p>{message}</p><Link className="btn btn-primary" href="/login">Sign in</Link></div></main>;
}

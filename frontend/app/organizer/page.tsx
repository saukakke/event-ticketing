"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, formatDate, formatNaira } from "@/lib/api";

type EventRow = {
  id: string; title: string; city: string; status: string; startAt: string; salesKobo: number; ordersCount: number;
  ticketTypes: { id: string; name: string; quantity: number; quantityRemaining: number }[];
};

export default function OrganizerPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<EventRow[]>("/organizer/events").then(setEvents).catch((e) => setError(e instanceof Error ? e.message : "Unable to load organizer data."));
  }, []);

  const sales = events.reduce((sum, e) => sum + e.salesKobo, 0);
  const orders = events.reduce((sum, e) => sum + e.ordersCount, 0);
  const tickets = events.reduce((sum, e) => sum + e.ticketTypes.reduce((x, t) => x + t.quantity - t.quantityRemaining, 0), 0);

  if (error) return <main className="container section"><div className="empty"><h2>Organizer access required</h2><p>{error}</p><Link className="btn btn-primary" href="/login">Sign in</Link></div></main>;

  return (
    <main className="dashboard">
      <div className="container">
        <div className="dashboard-head"><div><div className="eyebrow">Organizer</div><h1 style={{ fontSize: "3rem" }}>Manage your events</h1></div><Link className="btn btn-primary" href="/organizer/new">Create event</Link></div>
        <div className="stats">
          <div className="stat"><span className="meta">Sales</span><strong>{formatNaira(sales)}</strong></div>
          <div className="stat"><span className="meta">Orders</span><strong>{orders}</strong></div>
          <div className="stat"><span className="meta">Tickets sold</span><strong>{tickets}</strong></div>
        </div>
        <div className="table-wrap">
          <table><thead><tr><th>Event</th><th>Status</th><th>Date</th><th>Orders</th><th>Sales</th></tr></thead>
          <tbody>{events.map((event) => <tr key={event.id}><td><strong>{event.title}</strong><div className="meta">{event.city}</div></td><td>{event.status}</td><td>{formatDate(event.startAt)}</td><td>{event.ordersCount}</td><td>{formatNaira(event.salesKobo)}</td></tr>)}</tbody></table>
        </div>
      </div>
    </main>
  );
}

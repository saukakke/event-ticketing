"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatDate, formatNaira } from "@/lib/api";

type Order = {
  id: string; status: string; totalKobo: number; currency: string; paymentReference?: string | null; createdAt: string;
  customer: { name: string; email: string };
  event: { title: string; city: string; startAt: string };
  items: { quantity: number; unitPriceKobo: number; ticketType: { name: string } }[];
  ticketCount: number;
};

export default function OrganizerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api<Order[]>("/organizer/orders").then(setOrders).catch((e) => setError(e instanceof Error ? e.message : "Unable to load orders.")); }, []);
  return <main className="dashboard"><div className="container">
    <div className="dashboard-head"><div><div className="eyebrow">Organizer</div><h1>Orders</h1><p className="meta">Orders for your events and payment references.</p></div><Link className="btn btn-secondary" href="/organizer">Back to overview</Link></div>
    {error ? <div className="empty"><h2>Unable to load orders</h2><p>{error}</p></div> : <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Event</th><th>Tickets</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><Link href={`/organizer/orders/${order.id}`}><strong>{order.id}</strong></Link><div className="meta">{order.paymentReference || "No payment reference"}</div></td><td>{order.customer.name}<div className="meta">{order.customer.email}</div></td><td>{order.event.title}</td><td>{order.ticketCount}</td><td>{formatNaira(order.totalKobo)}</td><td>{order.status}</td><td>{formatDate(order.createdAt)}</td></tr>)}</tbody></table>{orders.length === 0 && <div className="empty"><p>No orders found.</p></div>}</div>}
  </div></main>;
}

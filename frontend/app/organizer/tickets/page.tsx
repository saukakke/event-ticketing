"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatDate, formatNaira } from "@/lib/api";

type Ticket = { id: string; code: string; checkedIn: boolean; checkedInAt?: string | null; createdAt: string; event: { title: string; city: string }; ticketType: { name: string; priceKobo: number }; order: { id: string; status: string; paymentReference?: string | null; user: { name: string; email: string } } };

export default function OrganizerTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]); const [error, setError] = useState("");
  useEffect(() => { api<Ticket[]>("/organizer/tickets").then(setTickets).catch((e) => setError(e instanceof Error ? e.message : "Unable to load tickets.")); }, []);
  return <main className="dashboard"><div className="container"><div className="dashboard-head"><div><div className="eyebrow">Organizer</div><h1>Tickets</h1><p className="meta">Issued tickets, holders and check-in status.</p></div><Link className="btn btn-secondary" href="/organizer">Back to overview</Link></div>{error ? <div className="empty"><h2>Unable to load tickets</h2><p>{error}</p></div> : <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Holder</th><th>Event</th><th>Type</th><th>Value</th><th>Order</th><th>Check-in</th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id}><td><Link href={`/organizer/tickets/${ticket.id}`}><strong>{ticket.code}</strong></Link></td><td>{ticket.order.user.name}<div className="meta">{ticket.order.user.email}</div></td><td>{ticket.event.title}</td><td>{ticket.ticketType.name}</td><td>{formatNaira(ticket.ticketType.priceKobo)}</td><td>{ticket.order.id}<div className="meta">{ticket.order.paymentReference || "No reference"}</div></td><td>{ticket.checkedIn ? `Checked in${ticket.checkedInAt ? ` · ${formatDate(ticket.checkedInAt)}` : ""}` : "Not checked in"}</td></tr>)}</tbody></table>{tickets.length === 0 && <div className="empty"><p>No tickets found.</p></div>}</div>}</div></main>;
}

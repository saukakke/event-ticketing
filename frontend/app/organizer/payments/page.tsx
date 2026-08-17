"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatDate, formatNaira } from "@/lib/api";

type Payment = { id: string; status: string; totalKobo: number; currency: string; paymentReference?: string | null; createdAt: string; updatedAt: string; user: { name: string; email: string }; event: { title: string }; ticketCount: number };

export default function OrganizerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]); const [error, setError] = useState("");
  useEffect(() => { api<Payment[]>("/organizer/payments").then(setPayments).catch((e) => setError(e instanceof Error ? e.message : "Unable to load payment history.")); }, []);
  return <main className="dashboard"><div className="container"><div className="dashboard-head"><div><div className="eyebrow">Organizer</div><h1>Payment history</h1><p className="meta">Successful, failed and refunded order payments for your events.</p></div><Link className="btn btn-secondary" href="/organizer">Back to overview</Link></div>{error ? <div className="empty"><h2>Unable to load payments</h2><p>{error}</p></div> : <div className="table-wrap"><table><thead><tr><th>Reference</th><th>Customer</th><th>Event</th><th>Amount</th><th>Status</th><th>Tickets</th><th>Updated</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td><Link href={`/organizer/orders/${payment.id}`}><strong>{payment.paymentReference || payment.id}</strong></Link><div className="meta">Order {payment.id}</div></td><td>{payment.user.name}<div className="meta">{payment.user.email}</div></td><td>{payment.event.title}</td><td>{formatNaira(payment.totalKobo)}</td><td>{payment.status}</td><td>{payment.ticketCount}</td><td>{formatDate(payment.updatedAt)}</td></tr>)}</tbody></table>{payments.length === 0 && <div className="empty"><p>No payment history found.</p></div>}</div>}</div></main>;
}

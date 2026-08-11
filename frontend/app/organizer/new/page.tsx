"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function NewEventPage() {
  const [form, setForm] = useState({ title: "", description: "", venue: "", city: "", startAt: "", endAt: "" });
  const [tickets, setTickets] = useState([{ name: "Regular", description: "General admission.", price: "5000", quantity: "100" }]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateTicket(index: number, key: string, value: string) {
    setTickets((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const event = await api<{ id: string }>("/events", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
          ticketTypes: tickets.map((t) => ({ name: t.name, description: t.description, priceKobo: Math.round(Number(t.price) * 100), quantity: Number(t.quantity) })),
        }),
      });
      await api(`/events/${event.id}/publish`, { method: "POST" });
      window.location.href = "/organizer";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create event.");
    } finally { setBusy(false); }
  }

  return (
    <main className="container">
      <form className="form-card" style={{ width: "min(760px,100%)" }} onSubmit={submit}>
        <Link href="/organizer" className="meta">← Organizer dashboard</Link>
        <div className="eyebrow" style={{ marginTop: 20 }}>New event</div>
        <h1 style={{ fontSize: "3rem" }}>Publish an event</h1>
        <div className="field"><label>Title</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="field"><label>Description</label><textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field"><label>Venue</label><input required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
          <div className="field"><label>City</label><input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div className="field"><label>Starts</label><input required type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} /></div>
          <div className="field"><label>Ends</label><input required type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} /></div>
        </div>
        <h3>Ticket types</h3>
        {tickets.map((ticket, index) => (
          <div className="panel" style={{ marginBottom: 12 }} key={index}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field"><label>Name</label><input required value={ticket.name} onChange={(e) => updateTicket(index, "name", e.target.value)} /></div>
              <div className="field"><label>Price (₦)</label><input required type="number" min="0" value={ticket.price} onChange={(e) => updateTicket(index, "price", e.target.value)} /></div>
              <div className="field"><label>Quantity</label><input required type="number" min="1" value={ticket.quantity} onChange={(e) => updateTicket(index, "quantity", e.target.value)} /></div>
              <div className="field"><label>Description</label><input value={ticket.description} onChange={(e) => updateTicket(index, "description", e.target.value)} /></div>
            </div>
            {tickets.length > 1 && <button className="btn btn-ghost" type="button" onClick={() => setTickets((items) => items.filter((_, i) => i !== index))}>Remove ticket type</button>}
          </div>
        ))}
        <button className="btn btn-secondary" type="button" onClick={() => setTickets([...tickets, { name: "", description: "", price: "0", quantity: "50" }])}>+ Add ticket type</button>
        {error && <p className="error">{error}</p>}
        <div style={{ marginTop: 20 }}><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Publishing…" : "Create and publish"}</button></div>
      </form>
    </main>
  );
}

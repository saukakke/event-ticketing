"use client";

import { useState } from "react";
import { api, Event, formatDate, formatNaira } from "@/lib/api";

export function EventDetail({ event }: { event: Event }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = event.ticketTypes.filter((ticket) => (quantities[ticket.id] || 0) > 0);
  const total = selected.reduce((sum, ticket) => sum + ticket.priceKobo * (quantities[ticket.id] || 0), 0);

  function change(id: string, amount: number, max: number) {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(0, Math.min(max, (current[id] || 0) + amount)),
    }));
  }

  async function checkout() {
    setError("");
    if (!selected.length) {
      setError("Select at least one ticket before continuing.");
      return;
    }

    setBusy(true);
    try {
      const result = await api<{
        orderId: string;
        reference: string;
        authorizationUrl?: string;
        accessCode?: string;
        paymentConfirmed?: boolean;
        status?: string;
      }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          eventId: event.id,
          items: selected.map((ticket) => ({
            ticketTypeId: ticket.id,
            quantity: quantities[ticket.id],
          })),
        }),
      });

      // Normal payment initialization returns a Paystack authorization URL.
      // Redirecting to it is required to complete the customer payment flow.
      if (result.authorizationUrl) {
        window.location.assign(result.authorizationUrl);
        return;
      }

      // The backend can also confirm payment immediately when Paystack returns
      // a successful transaction during initialization.
      if (result.paymentConfirmed) {
        window.location.assign(`/dashboard?payment=return&reference=${encodeURIComponent(result.reference)}`);
        return;
      }

      throw new Error("Payment checkout could not be initialized. Please try again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to complete checkout.");
      setBusy(false);
    }
  }

  return (
    <main>
      <section className="detail-hero">
        <div className="container">
          <div className="eyebrow">{event.city} · {formatDate(event.startAt)}</div>
          <h1 style={{ maxWidth: 850 }}>{event.title}</h1>
          <div className="meta">{event.venue} · Ends {formatDate(event.endAt)} · Organized by {event.organizer?.name}</div>
        </div>
      </section>

      <section className="container detail-grid" style={{ paddingBottom: 80 }}>
        <article className="panel">
          <h2>About this event</h2>
          <p style={{ whiteSpace: "pre-line" }}>{event.description}</p>
        </article>

        <aside className="panel">
          <div className="eyebrow">Tickets</div>
          {event.ticketTypes.map((ticket) => (
            <div className="ticket-row" key={ticket.id}>
              <div>
                <strong>{ticket.name}</strong>
                <div className="meta">{ticket.description}</div>
                <div className="price">{formatNaira(ticket.priceKobo)}</div>
                <div className="meta">{ticket.quantityRemaining} remaining</div>
              </div>
              <div className="qty">
                <button aria-label={`Decrease ${ticket.name}`} onClick={() => change(ticket.id, -1, ticket.quantityRemaining)}>−</button>
                <strong>{quantities[ticket.id] || 0}</strong>
                <button aria-label={`Increase ${ticket.name}`} onClick={() => change(ticket.id, 1, Math.min(ticket.quantityRemaining, 20))}>+</button>
              </div>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 18 }}>
            <div className="meta">Total</div>
            <h2>{formatNaira(total)}</h2>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={!selected.length || busy} onClick={checkout}>
              {busy ? "Redirecting to payment…" : "Get tickets"}
            </button>
            <p style={{ fontSize: ".8rem" }}>Paystack Test Mode is used for the capstone demonstration. No live funds are processed.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

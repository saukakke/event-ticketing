import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { api, Event } from "@/lib/api";

export default async function HomePage() {
  let events: Event[] = [];
  try {
    const result = await api<{ events: Event[] }>("/events?limit=3");
    events = result.events;
  } catch {}

  return (
    <>
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">Digital event ticketing</div>
              <h1>Find something worth showing up for.</h1>
              <p>Discover events, choose your ticket, and keep your admission pass in one place. Built for attendees and organizers who want a simpler event experience.</p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="/events">Explore events</Link>
                <Link className="btn btn-secondary" href="/register">Create an account</Link>
              </div>
            </div>
            <div className="hero-panel" aria-label="EventFlow product preview">
              <div className="eyebrow" style={{ color: "#ff9f89" }}>Your next event</div>
              <h2 style={{ marginTop: 12 }}>Northern Digital Innovation Summit</h2>
              <p>ABU Conference Centre · Zaria</p>
              <div className="event-preview">
                <div className="event-preview-top"><span>15 OCT 2026</span><span>09:00</span></div>
                <h3>Technology, AI, entrepreneurship and the future of work.</h3>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Upcoming</div>
                <h2>Events people are booking</h2>
              </div>
              <Link className="btn btn-secondary" href="/events">View all</Link>
            </div>
            {events.length ? (
              <div className="grid">{events.map((event, i) => <EventCard key={event.id} event={event} index={i} />)}</div>
            ) : (
              <div className="empty">No published events are available yet.</div>
            )}
          </div>
        </section>

        <section className="section" style={{ paddingTop: 20 }}>
          <div className="container">
            <div className="panel">
              <div className="eyebrow">For organizers</div>
              <h2>Publish once. Manage every ticket.</h2>
              <p>Create events, set ticket inventory, publish your listing, and track sales from a single dashboard.</p>
              <Link className="btn btn-primary" href="/register">Become an organizer</Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer"><div className="container">EventFlow · 3MTT Capstone MVP · Built with Next.js and PostgreSQL.</div></footer>
    </>
  );
}

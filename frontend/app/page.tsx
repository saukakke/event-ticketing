"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EventCard } from "@/components/event-card";
import { api, Event } from "@/lib/api";

function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date).toUpperCase();
}

function formatEventTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ events: Event[] }>("/events?limit=3"),
      api<{ events: Event[] }>("/events?upcoming=true&limit=1"),
    ])
      .then(([listing, upcoming]) => {
        setEvents(listing.events ?? []);
        setNextEvent(upcoming.events?.[0] ?? null);
      })
      .catch((error) => setEventsError(error instanceof Error ? error.message : "Unable to load events."))
      .finally(() => setLoadingEvents(false));
  }, []);

  return (
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
          <div className="hero-panel" aria-label="EventFlow next event">
            <div className="eyebrow" style={{ color: "#ff9f89" }}>Your next event</div>
            {loadingEvents ? (
              <div className="empty" aria-live="polite" style={{ marginTop: 16 }}>Loading the next event…</div>
            ) : eventsError ? (
              <div className="empty" role="alert" style={{ marginTop: 16 }}>
                <h3>Unable to load the next event.</h3>
                <p>{eventsError}</p>
              </div>
            ) : nextEvent ? (
              <>
                <h2 style={{ marginTop: 12 }}>{nextEvent.title}</h2>
                <p>{nextEvent.venue} · {nextEvent.city}</p>
                <div className="event-preview">
                  <div className="event-preview-top">
                    <span>{formatEventDate(nextEvent.startAt)}</span>
                    <span>{formatEventTime(nextEvent.startAt)}</span>
                  </div>
                  <h3>{nextEvent.description}</h3>
                </div>
                <Link className="btn btn-primary" href={`/events/${nextEvent.id}`} style={{ marginTop: 16 }}>
                  View event
                </Link>
              </>
            ) : (
              <div className="empty" style={{ marginTop: 16 }}>
                <h3>No upcoming events</h3>
                <p>Published events will appear here automatically when they are scheduled.</p>
              </div>
            )}
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

          {loadingEvents ? (
            <div className="empty" aria-live="polite">Loading the latest events…</div>
          ) : eventsError ? (
            <div className="empty" role="alert">
              <h3>We could not load the latest events.</h3>
              <p>{eventsError}</p>
              <button className="btn btn-secondary" onClick={() => window.location.reload()}>Try again</button>
            </div>
          ) : events.length > 0 ? (
            <div className="grid">{events.map((event, i) => <EventCard key={event.id} event={event} index={i} />)}</div>
          ) : (
            <div className="empty">
              <h3>No published events are available yet.</h3>
              <p>Once an organizer publishes an event, it will appear here automatically.</p>
              <Link className="btn btn-secondary" href="/events">Browse all events</Link>
            </div>
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
  );
}

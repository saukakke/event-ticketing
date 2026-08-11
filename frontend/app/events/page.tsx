import { EventCard } from "@/components/event-card";
import { api, Event } from "@/lib/api";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = params.q ? `&q=${encodeURIComponent(params.q)}` : "";
  let events: Event[] = [];
  try {
    events = (await api<{ events: Event[] }>(`/events?limit=30${q}`)).events;
  } catch {}

  return (
    <main className="section">
      <div className="container">
        <div className="section-head">
          <div><div className="eyebrow">Explore</div><h1 style={{ fontSize: "clamp(2.4rem,5vw,4rem)" }}>Find your next event.</h1></div>
        </div>
        <form style={{ display: "flex", gap: 10, marginBottom: 28 }} action="/events">
          <input name="q" defaultValue={params.q} placeholder="Search events or venues" aria-label="Search events" style={{ flex: 1, minHeight: 46, border: "1px solid var(--line)", borderRadius: 12, padding: "0 14px" }} />
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
        {events.length ? <div className="grid">{events.map((event, i) => <EventCard key={event.id} event={event} index={i} />)}</div> : <div className="empty">No matching events found.</div>}
      </div>
    </main>
  );
}

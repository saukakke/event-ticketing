import Link from "next/link";
import { Event, formatDate, formatNaira } from "@/lib/api";

export function EventCard({ event, index = 0 }: { event: Event; index?: number }) {
  const date = new Date(event.startAt);
  const art = index % 3 === 1 ? "alt" : index % 3 === 2 ? "alt2" : "";
  const lowest = event.ticketTypes[0]?.priceKobo ?? 0;

  return (
    <article className="event-card">
      <div className={`event-art ${art}`}>
        <div className="event-date">
          <small>{date.toLocaleDateString("en-US", { month: "short" })}</small>
          {date.getDate()}
        </div>
      </div>
      <div className="event-body">
        <div className="meta">{event.city} · {formatDate(event.startAt)}</div>
        <h3>{event.title}</h3>
        <p>{event.description.slice(0, 110)}{event.description.length > 110 ? "…" : ""}</p>
        <div className="card-footer">
          <div className="price">From {formatNaira(lowest)}</div>
          <Link className="btn btn-secondary" href={`/api/events/${event.id}`}>View event</Link>
        </div>
      </div>
    </article>
  );
}

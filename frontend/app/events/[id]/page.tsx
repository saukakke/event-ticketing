import { notFound } from "next/navigation";
import { EventDetail } from "@/components/event-detail";
import { api, Event } from "@/lib/api";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // `api()` already prefixes requests with `/api`; do not include it here.
    const event = await api<Event>(`/events/${encodeURIComponent(id)}`);
    return <EventDetail event={event} />;
  } catch (error) {
    // Only turn a genuine backend 404 into Next.js notFound(). Other failures
    // should remain visible instead of being misleadingly rendered as 404s.
    if (error instanceof Error && error.message.includes("(404)")) {
      notFound();
    }

    throw error;
  }
}

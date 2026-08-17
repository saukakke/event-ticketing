import { notFound } from "next/navigation";
import { EventDetail } from "@/components/event-detail";
import { api, ApiError, Event } from "@/lib/api";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const event = await api<Event>(`/events/${encodeURIComponent(id)}`);
    return <EventDetail event={event} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

import { notFound } from "next/navigation";
import { EventDetail } from "@/components/event-detail";
import { api, Event } from "@/lib/api";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const event = await api<Event>(`/api/events/${id}`);
    return <EventDetail event={event} />;
  } catch {
    notFound();
  }
}

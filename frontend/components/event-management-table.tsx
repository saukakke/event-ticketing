"use client";

import Link from "next/link";
import Swal from "sweetalert2";
import { useState } from "react";
import { api, formatDate, formatNaira } from "@/lib/api";

type ManagedEvent = {
  id: string;
  title: string;
  city: string;
  status: string;
  startAt: string;
  salesKobo: number;
  ordersCount: number;
  ticketTypes: { id: string; name: string; quantity: number; quantityRemaining: number }[];
};

export function EventManagementTable({ initialEvents, role }: { initialEvents: ManagedEvent[]; role: "ADMIN" | "ORGANIZER" }) {
  const [events, setEvents] = useState(initialEvents);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function removeEvent(event: ManagedEvent) {
    const result = await Swal.fire({
      title: "Delete this event?",
      text: `“${event.title}” will be permanently deleted if it has no transaction history. Events with orders, tickets or refunds will be cancelled instead to preserve financial records.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, continue",
      cancelButtonText: "Keep event",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    setBusyId(event.id);
    try {
      const response = await api<{ id: string; title: string; deleted: boolean; archived: boolean; message: string }>(`/events/${event.id}`, { method: "DELETE" });
      setEvents((current) => current.filter((item) => item.id !== event.id));
      await Swal.fire({
        title: response.deleted ? "Event deleted" : "Event removed",
        text: response.message,
        icon: response.deleted ? "success" : "info",
        confirmButtonText: "Done",
      });
    } catch (error) {
      await Swal.fire({
        title: "Unable to remove event",
        text: error instanceof Error ? error.message : "The event could not be removed. Please try again.",
        icon: "error",
        confirmButtonText: "Close",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Event</th><th>Status</th><th>Date</th><th>Orders</th><th>Sales</th><th>Actions</th></tr></thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td><Link href={`/events/${event.id}`}><strong>{event.title}</strong></Link><div className="meta">{event.city}</div></td>
              <td>{event.status}</td>
              <td>{formatDate(event.startAt)}</td>
              <td>{event.ordersCount}</td>
              <td>{formatNaira(event.salesKobo)}</td>
              <td>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link className="btn btn-secondary" href={`/events/${event.id}`}>View</Link>
                  <button className="btn btn-danger" type="button" onClick={() => void removeEvent(event)} disabled={busyId === event.id}>
                    {busyId === event.id ? "Removing…" : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {events.length === 0 && <div className="empty">No events are available.</div>}
    </div>
  );
}

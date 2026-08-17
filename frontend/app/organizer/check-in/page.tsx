"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, formatDate } from "@/lib/api";

type CheckInData = {
  totalPaid?: number;
  checkedIn?: number;
  remaining?: number;
  recent?: Array<{
    id: string;
    code: string;
    checkedInAt: string | null;
    order: { user: { name: string } };
    event: { title: string };
    ticketType: { name: string };
  }>;
};

export default function OrganizerCheckIn() {
  const [data, setData] = useState<CheckInData>();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const response = await api<CheckInData>("/organizer/check-in");
      setData(response);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load check-in data.");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initialLoad = async () => {
      try {
        const response = await api<CheckInData>("/organizer/check-in");
        if (!cancelled) setData(response);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Unable to load check-in data.");
      }
    };

    void initialLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await api<{ code: string }>("/organizer/check-in", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setMessage(`Ticket ${response.code} checked in successfully.`);
      setCode("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Check-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container section">
      <div className="eyebrow">Organizer</div>
      <h1>Event check-in</h1>
      <p className="meta">Scan a ticket QR value or enter its ticket code.</p>

      <form onSubmit={submit} style={{ display: "flex", gap: ".75rem", margin: "1.5rem 0" }}>
        <input className="input" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ticket code or QR token" required />
        <button className="btn btn-primary" disabled={busy}>{busy ? "Checking…" : "Check in ticket"}</button>
      </form>

      {message && <div className="empty"><p>{message}</p></div>}

      <div className="stats">
        <div className="stat"><span className="meta">Paid tickets</span><strong>{data?.totalPaid ?? "—"}</strong></div>
        <div className="stat"><span className="meta">Checked in</span><strong>{data?.checkedIn ?? "—"}</strong></div>
        <div className="stat"><span className="meta">Remaining</span><strong>{data?.remaining ?? "—"}</strong></div>
      </div>

      <div className="table-wrap" style={{ marginTop: "1.5rem" }}>
        <table>
          <thead><tr><th>Ticket</th><th>Holder</th><th>Event</th><th>Type</th><th>Time</th></tr></thead>
          <tbody>
            {data?.recent?.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.code}</td>
                <td>{ticket.order.user.name}</td>
                <td>{ticket.event.title}</td>
                <td>{ticket.ticketType.name}</td>
                <td>{formatDate(ticket.checkedInAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

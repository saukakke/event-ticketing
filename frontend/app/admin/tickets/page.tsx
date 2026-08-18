"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api, formatDate } from "@/lib/api";

type Ticket = {
  id: string;
  code: string;
  status: "ACTIVE" | "VOID";
  checkedIn: boolean;
  createdAt: string;
  event: { id: string; title: string };
  ticketType: { name: string };
  order: {
    id: string;
    status: string;
    paymentReference: string | null;
    user: { id: string; name: string; email: string };
  };
};

type TicketResponse = {
  tickets: Ticket[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
};

export default function AdminTickets() {
  const [data, setData] = useState<TicketResponse>();
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setError("");
      const response = await api<TicketResponse>("/admin/tickets?page=1&pageSize=50");
      setData(response);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to load tickets.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateStatus(ticket: Ticket, status: "ACTIVE" | "VOID") {
    if (status === ticket.status) return;

    const action = status === "VOID" ? "void" : "activate";
    const confirmation = await Swal.fire({
      title: `${action === "void" ? "Void" : "Activate"} this ticket?`,
      text: `Ticket ${ticket.code} will be ${action}d.`,
      icon: action === "void" ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: action === "void" ? "Yes, void ticket" : "Yes, activate ticket",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!confirmation.isConfirmed) return;

    setUpdating(ticket.id);
    setMessage("");
    try {
      await api<Ticket>(`/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          reason: `Admin manually changed ticket status to ${status}.`,
        }),
      });
      setMessage(`Ticket ${ticket.code} is now ${status}.`);
      await Swal.fire({
        title: "Ticket updated",
        text: `Ticket ${ticket.code} is now ${status}.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
      await load();
    } catch (value) {
      const detail = value instanceof Error ? value.message : "Unable to update ticket status.";
      setMessage(detail);
      await Swal.fire({
        title: "Unable to update ticket",
        text: detail,
        icon: "error",
        confirmButtonText: "Close",
      });
    } finally {
      setUpdating(null);
    }
  }

  if (error) {
    return (
      <main className="container section">
        <div className="empty">
          <h2>Unable to load tickets</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container section">
      <div className="eyebrow">Administration</div>
      <h1>Tickets</h1>
      <p className="meta" style={{ marginTop: 8 }}>
        Manage ticket validity. Active tickets can be checked in; void tickets cannot be used at the event.
      </p>
      {message && <div className="panel" style={{ marginTop: "1rem" }}>{message}</div>}

      <div className="table-wrap" style={{ marginTop: "1.5rem" }}>
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Holder</th>
              <th>Event</th>
              <th>Type</th>
              <th>Order</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Check-in</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data?.tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td><strong>{ticket.code}</strong></td>
                <td>{ticket.order.user.name}<div className="meta">{ticket.order.user.email}</div></td>
                <td>{ticket.event.title}</td>
                <td>{ticket.ticketType.name}</td>
                <td>{ticket.order.id}</td>
                <td>{ticket.order.paymentReference || "—"}</td>
                <td>{ticket.status}</td>
                <td>{ticket.checkedIn ? "Checked in" : "Not checked in"}</td>
                <td>{formatDate(ticket.createdAt)}</td>
                <td>
                  <select
                    className="input"
                    value={ticket.status}
                    disabled={updating === ticket.id}
                    onChange={(event) => void updateStatus(ticket, event.target.value as "ACTIVE" | "VOID")}
                    aria-label={`Status for ticket ${ticket.code}`}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="VOID">VOID</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

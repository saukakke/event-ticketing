"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api, formatDate, formatNaira } from "@/lib/api";

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: "ATTENDEE" | "ORGANIZER" | "ADMIN";
  createdAt: string;
  _count: { events: number; orders: number; auditLogs: number };
  events: Array<{ id: string; title: string; status: string; createdAt: string }>;
  orders: Array<{ id: string; status: string; totalKobo: number; event: { title: string }; createdAt: string }>;
};

export default function AdminUserDetails({ params }: { params: Promise<{ id: string }> }) {
  const [user, setUser] = useState<UserDetail>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { id } = await params;
      setUser(await api<UserDetail>(`/admin/users/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load user.");
    }
  }

  useEffect(() => { void load(); }, []);

  async function changeRole(role: UserDetail["role"]) {
    if (!user || role === user.role) return;

    const confirmation = await Swal.fire({
      title: "Change user role?",
      text: `Change ${user.name}'s role to ${role}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Change role",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!confirmation.isConfirmed) return;

    setSaving(true);
    setError("");
    try {
      const { id } = await params;
      const updated = await api<UserDetail>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) });
      setUser((current) => current ? { ...current, ...updated } : updated);
      await Swal.fire({
        title: "Role updated",
        text: `${user.name}'s role is now ${role}.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unable to update role.";
      setError(detail);
      await Swal.fire({
        title: "Unable to update role",
        text: detail,
        icon: "error",
        confirmButtonText: "Close",
      });
    } finally {
      setSaving(false);
    }
  }

  if (error) return <main className="container section"><div className="empty"><h2>Unable to load user</h2><p>{error}</p><Link className="btn btn-secondary" href="/admin/users">Back to users</Link></div></main>;
  if (!user) return <main className="container section"><p>Loading user…</p></main>;

  return <main className="container section">
    <div className="dashboard-head"><div><div className="eyebrow">Administration</div><h1>{user.name}</h1><p className="meta">{user.email}</p></div><Link className="btn btn-secondary" href="/admin/users">Back to users</Link></div>
    <div className="stats"><div className="stat"><span className="meta">Role</span><strong>{user.role}</strong></div><div className="stat"><span className="meta">Events</span><strong>{user._count.events}</strong></div><div className="stat"><span className="meta">Orders</span><strong>{user._count.orders}</strong></div><div className="stat"><span className="meta">Joined</span><strong>{formatDate(user.createdAt)}</strong></div></div>
    <section className="card" style={{ marginTop: "1.5rem" }}><h2>Access role</h2><p className="meta">Changing a role takes effect on the user's next authenticated request.</p><select className="input" value={user.role} disabled={saving} onChange={(e) => void changeRole(e.target.value as UserDetail["role"])}><option value="ATTENDEE">Attendee</option><option value="ORGANIZER">Organizer</option><option value="ADMIN">Admin</option></select></section>
    <section style={{ marginTop: "1.5rem" }}><h2>Recent orders</h2><div className="table-wrap"><table><thead><tr><th>Order</th><th>Event</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead><tbody>{user.orders.map((order) => <tr key={order.id}><td>{order.id}</td><td>{order.event.title}</td><td>{order.status}</td><td>{formatNaira(order.totalKobo)}</td><td>{formatDate(order.createdAt)}</td></tr>)}</tbody></table></div></section>
    <section style={{ marginTop: "1.5rem" }}><h2>Recent events</h2><div className="table-wrap"><table><thead><tr><th>Event</th><th>Status</th><th>Created</th></tr></thead><tbody>{user.events.map((event) => <tr key={event.id}><td>{event.title}</td><td>{event.status}</td><td>{formatDate(event.createdAt)}</td></tr>)}</tbody></table></div></section>
  </main>;
}

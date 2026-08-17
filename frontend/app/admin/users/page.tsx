"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ATTENDEE" | "ORGANIZER" | "ADMIN";
  createdAt: string;
  _count: { events: number; orders: number; auditLogs: number };
};
type Response = { users: User[]; pagination: { page: number; pageSize: number; total: number; pages: number } };

export default function AdminUsers() {
  const [data, setData] = useState<Response>();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "50" });
      if (query.trim()) params.set("q", query.trim());
      if (role) params.set("role", role);
      const response = await api<Response>(`/admin/users?${params.toString()}`);
      setData(response);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    }
  }

  useEffect(() => { void load(); }, [role]);

  async function changeRole(user: User, nextRole: User["role"]) {
    if (nextRole === user.role) return;
    if (!window.confirm(`Change ${user.name}'s role to ${nextRole}?`)) return;
    setSaving(user.id);
    setError("");
    setMessage("");
    try {
      await api(`/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ role: nextRole }) });
      setMessage(`${user.name}'s role was updated.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update role.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <main className="container section">
      <div className="dashboard-head">
        <div>
          <div className="eyebrow">Administration</div>
          <h1>Manage users</h1>
          <p className="meta">Manage user roles and review account activity.</p>
        </div>
      </div>
      <div className="card" style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <input className="input" style={{ flex: "1 1 280px" }} placeholder="Search name, email or ID" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(); }} />
        <select className="input" style={{ maxWidth: 200 }} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="ATTENDEE">Attendee</option>
          <option value="ORGANIZER">Organizer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button className="btn btn-primary" type="button" onClick={() => void load()}>Search</button>
      </div>
      {message && <div className="empty" style={{ marginBottom: "1rem" }}><p>{message}</p></div>}
      {error && <div className="empty" style={{ marginBottom: "1rem" }}><h2>Unable to manage users</h2><p>{error}</p></div>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Role</th><th>Events</th><th>Orders</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {data?.users.map((user) => (
              <tr key={user.id}>
                <td><Link href={`/admin/users/${user.id}`}>{user.name}</Link><div className="meta">{user.email}</div></td>
                <td><select className="input" value={user.role} disabled={saving === user.id} onChange={(e) => void changeRole(user, e.target.value as User["role"])}><option value="ATTENDEE">Attendee</option><option value="ORGANIZER">Organizer</option><option value="ADMIN">Admin</option></select></td>
                <td>{user._count.events}</td>
                <td>{user._count.orders}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td><Link className="btn btn-secondary" href={`/admin/users/${user.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <p className="meta" style={{ marginTop: "1rem" }}>Showing {data.users.length} of {data.pagination.total} users.</p>}
    </main>
  );
}

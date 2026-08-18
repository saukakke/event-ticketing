"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api, formatDate } from "@/lib/api";

type User = {
  id: string; name: string; email: string; role: "ATTENDEE" | "ORGANIZER" | "ADMIN";
  suspendedAt: string | null; suspensionReason: string | null; deletedAt: string | null; createdAt: string;
  _count: { events: number; orders: number; auditLogs: number };
};
type Response = { users: User[]; pagination: { page: number; pageSize: number; total: number; pages: number } };
type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED" | "ALL";

function statusOf(user: User): Exclude<AccountStatus, "ALL"> {
  if (user.deletedAt) return "DELETED";
  if (user.suspendedAt) return "SUSPENDED";
  return "ACTIVE";
}

async function confirmAction(title: string, text: string, confirmButtonText: string) {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
  });
  return result.isConfirmed;
}

export default function AdminUsers() {
  const [data, setData] = useState<Response>();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<AccountStatus>("ACTIVE");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "50", status });
      if (query.trim()) params.set("q", query.trim());
      if (role) params.set("role", role);
      const response = await api<Response>(`/admin/users?${params.toString()}`);
      setData(response); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load users."); }
  }

  useEffect(() => { void load(); }, [role, status]);

  async function changeRole(user: User, nextRole: User["role"]) {
    if (nextRole === user.role) return;
    if (!(await confirmAction("Change user role?", `Change ${user.name}'s role to ${nextRole}?`, "Change role"))) return;
    setSaving(user.id); setError(""); setMessage("");
    try {
      await api(`/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ role: nextRole }) });
      setMessage(`${user.name}'s role was updated.`); await load();
      await Swal.fire({ title: "Role updated", text: `${user.name}'s role was updated successfully.`, icon: "success", timer: 1800, showConfirmButton: false });
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update role."); await Swal.fire("Unable to update role", err instanceof Error ? err.message : "An unexpected error occurred.", "error"); }
    finally { setSaving(null); }
  }

  async function accountAction(user: User, action: "suspend" | "restore" | "delete" | "undelete") {
    const labels = { suspend: "suspend", restore: "restore", delete: "soft-delete", undelete: "restore from soft-delete" } as const;
    const confirmed = await confirmAction(
      action === "delete" ? "Soft-delete this account?" : `Confirm ${labels[action]}`,
      `Are you sure you want to ${labels[action]} ${user.name}'s account?`,
      action === "delete" ? "Soft delete" : labels[action].replace(/^./, (c) => c.toUpperCase()),
    );
    if (!confirmed) return;
    let reason: string | undefined;
    if (action === "suspend") {
      const result = await Swal.fire({ title: "Suspension reason", input: "textarea", inputLabel: "Reason (optional)", inputPlaceholder: "Enter a reason for suspension...", showCancelButton: true, confirmButtonText: "Continue" });
      if (!result.isConfirmed) return;
      reason = typeof result.value === "string" && result.value.trim() ? result.value.trim() : undefined;
    }
    setSaving(user.id); setError(""); setMessage("");
    try {
      await api(`/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ action, ...(reason ? { reason } : {}) }) });
      setMessage(`${user.name}'s account was ${labels[action]}.`); await load();
      await Swal.fire({ title: "Account updated", text: `${user.name}'s account was ${labels[action]}.`, icon: "success", timer: 1800, showConfirmButton: false });
    } catch (err) { const detail = err instanceof Error ? err.message : "Unable to update account status."; setError(detail); await Swal.fire("Unable to update account", detail, "error"); }
    finally { setSaving(null); }
  }

  return (
    <main className="container section">
      <div className="dashboard-head"><div><div className="eyebrow">Administration</div><h1>Manage users</h1><p className="meta">Manage roles and account lifecycle without deleting historical user data.</p></div></div>
      <div className="card" style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <input className="input" style={{ flex: "1 1 280px" }} placeholder="Search name, email or ID" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(); }} />
        <select className="input" style={{ maxWidth: 180 }} value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option><option value="ATTENDEE">Attendee</option><option value="ORGANIZER">Organizer</option><option value="ADMIN">Admin</option></select>
        <select className="input" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value as AccountStatus)}><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="DELETED">Deleted</option><option value="ALL">All accounts</option></select>
        <button className="btn btn-primary" type="button" onClick={() => void load()}>Search</button>
      </div>
      {message && <div className="empty" style={{ marginBottom: "1rem" }}><p>{message}</p></div>}
      {error && <div className="empty" style={{ marginBottom: "1rem" }}><h2>Unable to manage users</h2><p>{error}</p></div>}
      <div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Events</th><th>Orders</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>{data?.users.map((user) => {
          const accountStatus = statusOf(user);
          const protectedAdmin = user.role === "ADMIN";
          return <tr key={user.id}>
            <td><Link href={`/admin/users/${user.id}`}>{user.name}</Link><div className="meta">{user.email}</div></td>
            <td><select className="input" value={user.role} disabled={saving === user.id} onChange={(e) => void changeRole(user, e.target.value as User["role"])}><option value="ATTENDEE">Attendee</option><option value="ORGANIZER">Organizer</option><option value="ADMIN">Admin</option></select></td>
            <td>{accountStatus}{user.suspendedAt && <div className="meta">{formatDate(user.suspendedAt)}</div>}</td><td>{user._count.events}</td><td>{user._count.orders}</td><td>{formatDate(user.createdAt)}</td>
            <td style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}><Link className="btn btn-secondary" href={`/admin/users/${user.id}`}>View</Link>{!protectedAdmin && accountStatus === "ACTIVE" && <><button className="btn btn-secondary" disabled={saving === user.id} onClick={() => void accountAction(user, "suspend")}>Suspend</button><button className="btn btn-secondary" disabled={saving === user.id} onClick={() => void accountAction(user, "delete")}>Soft delete</button></>}{!protectedAdmin && accountStatus === "SUSPENDED" && <><button className="btn btn-secondary" disabled={saving === user.id} onClick={() => void accountAction(user, "restore")}>Unsuspend</button><button className="btn btn-secondary" disabled={saving === user.id} onClick={() => void accountAction(user, "delete")}>Soft delete</button></>}{!protectedAdmin && accountStatus === "DELETED" && <button className="btn btn-secondary" disabled={saving === user.id} onClick={() => void accountAction(user, "undelete")}>Restore</button>}</td>
          </tr>;
        })}</tbody>
      </table></div>
      {data && <p className="meta" style={{ marginTop: "1rem" }}>Showing {data.users.length} of {data.pagination.total} users.</p>}
    </main>
  );
}

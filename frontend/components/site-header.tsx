"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type User = { id: string; name: string; email: string; role: "ATTENDEE" | "ORGANIZER" | "ADMIN" };

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api<User>("/auth/me").then(setUser).catch(() => setUser(null));
  }, []);

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      window.location.href = "/";
    }
  }

  return (
    <header className="site-header">
      <div className="container nav">
        <Link className="logo" href="/">
          <span className="logo-mark">EF</span>
          EventFlow
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/events">Explore</Link>
          {user && <Link href="/dashboard">My tickets</Link>}
          {(user?.role === "ORGANIZER" || user?.role === "ADMIN") && <Link href="/organizer">Organizer</Link>}
          {user?.role === "ADMIN" && <Link href="/admin">Admin</Link>}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <span className="meta">{user.name}</span>
              <button className="btn btn-secondary" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <Link className="btn btn-secondary" href="/login">Sign in</Link>
              <Link className="btn btn-primary" href="/register">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

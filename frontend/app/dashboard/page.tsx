"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminOverview, AttendeeOverview, OrganizerOverview } from "@/components/dashboard-overviews";

 type User = { id: string; name: string; email: string; role: "ATTENDEE" | "ORGANIZER" | "ADMIN" };

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to identify the signed-in user."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="dashboard"><div className="container"><div className="empty">Loading your dashboard…</div></div></main>;
  if (error || !user) return <main className="container section"><div className="empty"><h2>Sign in required</h2><p>{error || "Please sign in to access your dashboard."}</p><a className="btn btn-primary" href="/login">Sign in</a></div></main>;

  if (user.role === "ADMIN") return <AdminOverview />;
  if (user.role === "ORGANIZER") return <OrganizerOverview />;
  return <AttendeeOverview />;
}

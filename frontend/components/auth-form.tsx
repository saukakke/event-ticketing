"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const MIN_PASSWORD_LENGTH = 12;

type Role = "ATTENDEE" | "ORGANIZER" | "ADMIN";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ATTENDEE");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/auth/" + mode, {
        method: "POST",
        body: JSON.stringify({
          ...(mode === "register" ? { name, role } : {}),
          email,
          password,
        }),
      });
      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to continue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container">
      <form className="form-card" onSubmit={submit}>
        <div className="eyebrow">{mode === "login" ? "Welcome back" : "Join EventFlow"}</div>
        <h1 style={{ fontSize: "2.5rem" }}>{mode === "login" ? "Sign in" : "Create your account"}</h1>
        <p>{mode === "login" ? "Access your tickets and organizer tools." : "Create your EventFlow account and choose how you will use the platform."}</p>
        {mode === "register" && (
          <>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="role">Account role</label>
              <select id="role" required value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="ATTENDEE">Attendee</option>
                <option value="ORGANIZER">Organizer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </>
        )}
        <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={MIN_PASSWORD_LENGTH} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        <p style={{ textAlign: "center" }}>{mode === "login" ? "New here? " : "Already have an account? "}<Link href={mode === "login" ? "/register" : "/login"} style={{ color: "var(--brand-dark)", fontWeight: 800 }}>{mode === "login" ? "Create an account" : "Sign in"}</Link></p>
      </form>
    </main>
  );
}

"use client";

import { useState } from "react";
import { AuthForm } from "@/components/auth-form";

const demoAccounts = [
  { role: "Admin", email: "admin@eventflow.com", password: "Password123!" },
  { role: "Organizer", email: "organizer@eventflow.com", password: "Password123!" },
  { role: "Organizer 2", email: "organizer2@eventflow.com", password: "Password123!" },
  { role: "Attendee", email: "attendee@eventflow.com", password: "Password123!" },
  { role: "Attendee 2", email: "attendee2@eventflow.com", password: "Password123!" },
  { role: "Attendee 3", email: "attendee3@eventflow.com", password: "Password123!" },
];

export default function LoginPage() {
  const [showAll, setShowAll] = useState(false);
  const visibleAccounts = showAll ? demoAccounts : demoAccounts.slice(0, 3);

  return (
    <>
      <AuthForm mode="login" />
      <section className="container section" style={{ paddingTop: 0 }} aria-labelledby="demo-accounts-title">
        <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="eyebrow">Testing</div>
          <h2 id="demo-accounts-title" style={{ marginBottom: ".5rem" }}>Demo accounts</h2>
          <p className="meta" style={{ marginBottom: "1rem" }}>Use these seeded accounts to test the Admin, Organizer and Attendee workflows.</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Role</th><th>Email</th><th>Password</th></tr></thead>
              <tbody>{visibleAccounts.map((account) => <tr key={account.email}><td>{account.role}</td><td><code>{account.email}</code></td><td><code>{account.password}</code></td></tr>)}</tbody>
            </table>
          </div>
          <button className="btn btn-secondary" type="button" style={{ marginTop: "1rem" }} onClick={() => setShowAll((value) => !value)}>
            {showAll ? "Show primary accounts" : "Show all demo accounts"}
          </button>
        </div>
      </section>
    </>
  );
}

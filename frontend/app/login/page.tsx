"use client";

import { useState } from "react";
import { AuthForm } from "@/components/auth-form";

const demoAccounts = [
  { role: "Admin", email: "admin@eventflow.local", password: "Password123!" },
  { role: "Organizer", email: "organizer@everflow.local", password: "Password123!" },
  { role: "Attendee", email: "attendee@eventflow.local", password: "Password123!" },
];

export default function LoginPage() {
  return (
    <>
      <AuthForm mode="login" />
      <section className="container section" style={{ paddingTop: 0 }} aria-labelledby="demo-accounts-title">
        <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="eyebrow">Testing</div>
          <h2 id="demo-accounts-title" style={{ marginBottom: ".5rem" }}>Demo accounts</h2>
          <p className="meta" style={{ marginBottom: "1rem" }}>
            Use these seeded accounts to test the Admin, Organizer and Attendee workflows.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Role</th><th>Username</th><th>Password</th></tr>
              </thead>
              <tbody>
                {demoAccounts.map((account) => (
                  <tr key={account.email}>
                    <td>{account.role}</td>
                    <td><code>{account.email}</code></td>
                    <td><code>{account.password}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

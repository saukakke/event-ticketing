"use client";

import { useEffect, useState } from "react";
import { api, formatDate, formatNaira } from "@/lib/api";

type OrdersResponse = {
  data: Array<{
    id: string;
    status: string;
    totalKobo: number;
    paymentReference: string | null;
    createdAt: string;
    user: { name: string; email: string };
    event: { title: string };
  }>;
  pagination: { page: number; pageSize: number; total: number; pages: number };
};

export default function AdminOrders() {
  const [data, setData] = useState<OrdersResponse>();
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = async (search = query) => {
    try {
      const response = await api<OrdersResponse>(`/admin/orders?page=1&pageSize=50${search ? `&q=${encodeURIComponent(search)}` : ""}`);
      setData(response);
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load orders.");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initialLoad = async () => {
      try {
        const response = await api<OrdersResponse>("/admin/orders?page=1&pageSize=50");
        if (!cancelled) setData(response);
      } catch (error) {
        if (!cancelled) setError(error instanceof Error ? error.message : "Unable to load orders.");
      }
    };

    void initialLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="container section">
      <div className="dashboard-head">
        <div><div className="eyebrow">Administration</div><h1>Orders</h1></div>
      </div>
      <input
        className="input"
        placeholder="Search order, customer or event"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter") void load(); }}
      />
      {error && <div className="empty" style={{ marginTop: "1rem" }}><h2>Unable to load orders</h2><p>{error}</p></div>}
      <div className="table-wrap" style={{ marginTop: "1.5rem" }}>
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Event</th><th>Status</th><th>Amount</th><th>Payment</th><th>Date</th></tr></thead>
          <tbody>
            {data?.data.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.user.name}<div className="meta">{order.user.email}</div></td>
                <td>{order.event.title}</td>
                <td>{order.status}</td>
                <td>{formatNaira(order.totalKobo)}</td>
                <td>{order.paymentReference || "—"}</td>
                <td>{formatDate(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

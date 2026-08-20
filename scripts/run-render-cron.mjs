const backendUrl = process.env.BACKEND_URL?.trim().replace(/\/$/, "");
const cronSecret = process.env.CRON_SECRET?.trim();

if (!backendUrl) throw new Error("BACKEND_URL is required.");
if (!cronSecret) throw new Error("CRON_SECRET is required.");

const response = await fetch(`${backendUrl}/api/cron/cleanup-orders`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${cronSecret}`,
    Accept: "application/json",
  },
});

const body = await response.text();
console.log(`Cron response (${response.status}): ${body}`);

if (!response.ok) {
  process.exitCode = 1;
}

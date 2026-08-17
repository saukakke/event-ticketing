import crypto from "node:crypto";

const PAYSTACK_API_URL = "https://api.paystack.co";

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    throw new Error("PAYSTACK_SECRET_KEY must start with sk_test_ or sk_live_.");
  }
  return key;
}

export type PaystackTransaction = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata?: unknown;
};

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

export async function initializePaystackTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}) {
  const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as PaystackResponse<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>;

  if (!response.ok || !payload.status || !payload.data?.authorization_url) {
    throw new Error(payload.message || "Paystack transaction initialization failed.");
  }

  return payload.data;
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(
    `${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
      },
      cache: "no-store",
    }
  );

  const payload = (await response.json()) as PaystackResponse<PaystackTransaction>;

  if (!response.ok || !payload.status || !payload.data) {
    throw new Error(payload.message || "Paystack transaction verification failed.");
  }

  return payload.data;
}

export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha512", getSecretKey())
    .update(rawBody, "utf8")
    .digest("hex");

  const received = Buffer.from(signature, "utf8");
  const calculated = Buffer.from(expected, "utf8");

  return received.length === calculated.length && crypto.timingSafeEqual(received, calculated);
}

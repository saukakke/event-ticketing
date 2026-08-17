import { NextRequest, NextResponse } from "next/server";
import { finalizePaystackOrder, handlePaystackReversal } from "@/lib/order-payment";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  try {
    if (!verifyPaystackWebhookSignature(rawBody, request.headers.get("x-paystack-signature"))) {
      return NextResponse.json({ error: { code: "INVALID_SIGNATURE", message: "Invalid Paystack webhook signature." } }, { status: 401 });
    }

    let payload: { event?: string; data?: { reference?: string; status?: string } };
    try {
      payload = JSON.parse(rawBody) as { event?: string; data?: { reference?: string; status?: string } };
    } catch {
      return NextResponse.json({ error: { code: "INVALID_WEBHOOK", message: "Webhook payload is not valid JSON." } }, { status: 400 });
    }

    const reference = payload.data?.reference;
    if (!reference) return NextResponse.json({ error: { code: "INVALID_WEBHOOK", message: "Payment reference is missing." } }, { status: 400 });

    if (payload.event === "charge.success") {
      await finalizePaystackOrder(reference);
    } else if (payload.event === "charge.failed" || payload.event === "charge.reversed") {
      await handlePaystackReversal(reference);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: { code: "WEBHOOK_PROCESSING_FAILED", message: "Webhook processing failed." } }, { status: 500 });
  }
}

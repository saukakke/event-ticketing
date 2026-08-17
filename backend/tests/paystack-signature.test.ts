import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyPaystackWebhookSignature } from "../lib/paystack";
const secret = "sk_test_eventflow_test_secret";
const body = JSON.stringify({ event: "charge.success", data: { reference: "EVF-TEST-001" } });
test("Paystack webhook signature accepts a valid HMAC SHA-512 signature", () => { process.env.PAYSTACK_SECRET_KEY = secret; const signature = crypto.createHmac("sha512", secret).update(body, "utf8").digest("hex"); assert.equal(verifyPaystackWebhookSignature(body, signature), true); });
test("Paystack webhook signature rejects an invalid signature", () => { process.env.PAYSTACK_SECRET_KEY = secret; assert.equal(verifyPaystackWebhookSignature(body, "invalid-signature"), false); });
test("Paystack webhook signature rejects a missing signature", () => { process.env.PAYSTACK_SECRET_KEY = secret; assert.equal(verifyPaystackWebhookSignature(body, null), false); });

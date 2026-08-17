import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema, createEventSchema, orderSchema } from "../lib/validation";
test("registration normalizes email and accepts a valid password", () => { const result = registerSchema.parse({ name: "  Event User  ", email: "  USER@Example.COM ", password: "CorrectHorseBattery12!" }); assert.equal(result.name, "Event User"); assert.equal(result.email, "user@example.com"); });
test("registration rejects passwords shorter than 12 characters", () => { assert.throws(() => registerSchema.parse({ name: "Event User", email: "user@example.com", password: "short" })); });
test("login normalizes email", () => { const result = loginSchema.parse({ email: " USER@EXAMPLE.COM ", password: "CorrectHorseBattery12!" }); assert.equal(result.email, "user@example.com"); });
test("event validation requires end time after start time", () => { assert.throws(() => createEventSchema.parse({ title: "A Valid Event Title", description: "This description is long enough to satisfy validation.", venue: "Main Hall", city: "Zaria", startAt: "2026-09-01T10:00:00Z", endAt: "2026-09-01T09:00:00Z", ticketTypes: [{ name: "Regular", priceKobo: 50000, quantity: 100 }] })); });
test("order validation limits each ticket quantity to 20", () => { assert.throws(() => orderSchema.parse({ eventId: "event-1", items: [{ ticketTypeId: "ticket-1", quantity: 21 }] })); });

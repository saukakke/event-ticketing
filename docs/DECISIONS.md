# Architecture Decisions

## ADR-001: Next.js for both application layers

Next.js is used for the frontend and API service to keep the capstone stack coherent and approachable while still separating presentation from backend business logic.

## ADR-002: PostgreSQL

Ticket inventory, orders, users, and event relationships are transactional and relational. PostgreSQL is therefore preferred over a document database.

## ADR-003: Integer money

Prices are stored as Kobo integers to prevent floating-point rounding errors.

## ADR-004: JWT in HTTP-only cookie

A signed short-lived-ish session token in an HTTP-only cookie provides a simple authentication mechanism for the MVP while avoiding localStorage token storage.

## ADR-005: Demo checkout

A complete payment-provider integration requires merchant credentials, webhooks, verification, refunds, and reconciliation. The capstone MVP therefore implements a clearly labelled demo checkout while keeping order/payment references in the domain model so a real provider can be integrated without redesigning ticketing.

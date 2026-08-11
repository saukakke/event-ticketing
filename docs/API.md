# API Reference

Base URL:

```text
http://localhost:4000/api
```

## Authentication

### POST `/auth/register`

Body:

```json
{
  "name": "Amina Yusuf",
  "email": "amina@example.com",
  "password": "Password123!"
}
```

Creates an attendee account and sets the authentication cookie.

### POST `/auth/login`

Body:

```json
{
  "email": "amina@example.com",
  "password": "Password123!"
}
```

### POST `/auth/logout`

Clears the authentication cookie.

### GET `/auth/me`

Returns the authenticated user.

## Events

### GET `/events`

Query parameters:

- `q`
- `city`
- `page`
- `limit`

Returns published events.

### GET `/events/:id`

Returns one published event with ticket types.

### POST `/events`

Organizer/admin only.

Body:

```json
{
  "title": "Northern Tech Summit",
  "description": "Technology conference.",
  "venue": "ABU Conference Centre",
  "city": "Zaria",
  "startAt": "2026-10-15T09:00:00.000Z",
  "endAt": "2026-10-15T17:00:00.000Z",
  "ticketTypes": [
    {
      "name": "Regular",
      "priceKobo": 500000,
      "quantity": 100
    }
  ]
}
```

### PATCH `/events/:id`

Organizer/admin only. Updates event details.

### POST `/events/:id/publish`

Organizer/admin only. Publishes the event.

## Orders

### POST `/orders`

Authenticated users only.

Body:

```json
{
  "eventId": "event-id",
  "items": [
    {
      "ticketTypeId": "ticket-type-id",
      "quantity": 2
    }
  ]
}
```

Creates a demo-paid order and issues tickets.

### GET `/orders/me`

Returns the current user's orders and tickets.

## Organizer

### GET `/organizer/events`

Organizer/admin only. Returns organizer events with sales aggregates.

## Response conventions

Success responses use:

```json
{
  "data": {}
}
```

Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": {}
  }
}
```

## HTTP status conventions

- `200`: successful read/update.
- `201`: successful creation.
- `400`: invalid request.
- `401`: unauthenticated.
- `403`: insufficient role.
- `404`: resource not found.
- `409`: conflict such as insufficient stock.
- `500`: unexpected server error.

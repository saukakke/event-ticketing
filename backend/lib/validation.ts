import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
});

const ticketTypeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional().default(""),
  priceKobo: z.number().int().min(0).max(100_000_000_00),
  quantity: z.number().int().min(1).max(1_000_000),
});

const eventBaseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(5000),
  venue: z.string().trim().min(2).max(160),
  city: z.string().trim().min(2).max(80),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  ticketTypes: z.array(ticketTypeSchema).min(1).max(20),
});

export const createEventSchema = eventBaseSchema.refine(
  (value) => value.endAt > value.startAt,
  {
    message: "End time must be after start time.",
    path: ["endAt"],
  }
);

export const updateEventSchema = eventBaseSchema
  .omit({ ticketTypes: true })
  .partial()
  .refine(
    (value) => {
      if (value.startAt && value.endAt) {
        return value.endAt > value.startAt;
      }

      return true;
    },
    {
      message: "End time must be after start time.",
      path: ["endAt"],
    }
  );

export const orderSchema = z.object({
  eventId: z.string().min(1),
  items: z.array(z.object({
    ticketTypeId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(10),
});

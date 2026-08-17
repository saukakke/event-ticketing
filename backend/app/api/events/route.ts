import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createEventSchema } from "@/lib/validation";
import { handleError, ok, errorResponse } from "@/lib/http";
import { slugify } from "@/lib/slug";

function positiveInteger(value: string | null, fallback: number, maximum: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const city = searchParams.get("city")?.trim();
    const page = positiveInteger(searchParams.get("page"), 1, 10_000);
    const limit = positiveInteger(searchParams.get("limit"), 12, 30);

    const where = {
      status: "PUBLISHED" as const,
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { venue: { contains: q, mode: "insensitive" as const } }] } : {}),
      ...(city ? { city: { equals: city, mode: "insensitive" as const } } : {}),
    };

    const [events, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        include: { ticketTypes: { orderBy: { priceKobo: "asc" }, take: 1 } },
        // Public listings are shown by creation date so the landing page's
        // "most recent" section is deterministic and does not depend on the
        // event date being farthest/nearest in the future.
        orderBy: [{ createdAt: "desc" }, { startAt: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return ok({ events, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["ORGANIZER", "ADMIN"]);
    const input = createEventSchema.parse(await request.json());

    const baseSlug = slugify(input.title);
    let slug = baseSlug;
    let suffix = 2;
    while (await prisma.event.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const event = await prisma.event.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        venue: input.venue,
        city: input.city,
        startAt: input.startAt,
        endAt: input.endAt,
        organizerId: user.id,
        ticketTypes: {
          create: input.ticketTypes.map((ticketType) => ({
            name: ticketType.name,
            description: ticketType.description,
            priceKobo: ticketType.priceKobo,
            quantity: ticketType.quantity,
            quantityRemaining: ticketType.quantity,
          })),
        },
      },
      include: { ticketTypes: true },
    });

    return ok(event, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (error instanceof Error && error.message === "FORBIDDEN") return errorResponse("FORBIDDEN", "Organizer access required.", 403);
    return handleError(error);
  }
}

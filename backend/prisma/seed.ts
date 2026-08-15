import { PrismaClient, UserRole, EventStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@eventflow.com" },
    update: { passwordHash, role: UserRole.ORGANIZER, name: "EventFlow Organizer" },
    create: { email: "organizer@eventflow.com", passwordHash, role: UserRole.ORGANIZER, name: "EventFlow Organizer" },
  });

  await prisma.user.upsert({
    where: { email: "attendee@eventflow.com" },
    update: { passwordHash, role: UserRole.ATTENDEE, name: "Demo Attendee" },
    create: { email: "attendee@eventflow.com", passwordHash, role: UserRole.ATTENDEE, name: "Demo Attendee" },
  });

  await prisma.user.upsert({
    where: { email: "admin@eventflow.com" },
    update: { passwordHash, role: UserRole.ADMIN, name: "EventFlow Admin" },
    create: { email: "admin@eventflow.com", passwordHash, role: UserRole.ADMIN, name: "EventFlow Admin" },
  });

  const existing = await prisma.event.findFirst({ where: { organizerId: organizer.id } });
  if (!existing) {
    await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: "Northern Digital Innovation Summit",
        slug: "northern-digital-innovation-summit",
        description: "A practical technology summit connecting developers, founders, students, educators, and digital professionals around software, AI, entrepreneurship, and the future of work.",
        venue: "ABU Conference Centre",
        city: "Zaria",
        startAt: new Date("2026-10-15T09:00:00.000Z"),
        endAt: new Date("2026-10-15T17:00:00.000Z"),
        status: EventStatus.PUBLISHED,
        ticketTypes: {
          create: [
            { name: "Regular", description: "General admission.", priceKobo: 500000, quantity: 250, quantityRemaining: 250 },
            { name: "VIP", description: "Priority seating and networking access.", priceKobo: 1500000, quantity: 50, quantityRemaining: 50 },
          ],
        },
      },
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

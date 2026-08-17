const { PrismaClient, UserRole, EventStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

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

  const events = [
    {
      title: "Northern Digital Innovation Summit",
      slug: "northern-digital-innovation-summit",
      description: "A practical technology summit connecting developers, founders, students, educators, and digital professionals around software, AI, entrepreneurship, and the future of work.",
      venue: "ABU Conference Centre",
      city: "Zaria",
      startAt: new Date("2026-10-15T09:00:00.000Z"),
      endAt: new Date("2026-10-15T17:00:00.000Z"),
      ticketTypes: [
        { name: "Regular", description: "General admission.", priceKobo: 500000, quantity: 250, quantityRemaining: 250 },
        { name: "VIP", description: "Priority seating and networking access.", priceKobo: 1500000, quantity: 50, quantityRemaining: 50 },
      ],
    },
    {
      title: "Zaria Software Developers Meetup",
      slug: "zaria-software-developers-meetup",
      description: "A hands-on developer meetup covering modern web development, APIs, databases, cloud deployment, testing, and practical engineering workflows.",
      venue: "Zaria Tech Hub",
      city: "Zaria",
      startAt: new Date("2026-11-07T10:00:00.000Z"),
      endAt: new Date("2026-11-07T16:00:00.000Z"),
      ticketTypes: [
        { name: "General Admission", description: "Access to all meetup sessions and practical workshops.", priceKobo: 200000, quantity: 150, quantityRemaining: 150 },
        { name: "Workshop Pass", description: "Includes the hands-on workshop and developer networking session.", priceKobo: 500000, quantity: 50, quantityRemaining: 50 },
      ],
    },
    {
      title: "Northern Entrepreneurship & Startup Forum",
      slug: "northern-entrepreneurship-startup-forum",
      description: "A startup-focused forum bringing together entrepreneurs, innovators, students, investors, and technology professionals to explore product development, funding, and sustainable business growth.",
      venue: "Kaduna International Conference Centre",
      city: "Kaduna",
      startAt: new Date("2026-12-05T09:30:00.000Z"),
      endAt: new Date("2026-12-05T18:00:00.000Z"),
      ticketTypes: [
        { name: "Standard", description: "Full-day access to the startup forum.", priceKobo: 300000, quantity: 300, quantityRemaining: 300 },
        { name: "Founder Pass", description: "Premium access with founder networking and dedicated sessions.", priceKobo: 1000000, quantity: 75, quantityRemaining: 75 },
      ],
    },
  ];

  for (const event of events) {
    const existingEvent = await prisma.event.findUnique({ where: { slug: event.slug } });

    if (!existingEvent) {
      await prisma.event.create({
        data: {
          organizerId: organizer.id,
          title: event.title,
          slug: event.slug,
          description: event.description,
          venue: event.venue,
          city: event.city,
          startAt: event.startAt,
          endAt: event.endAt,
          status: EventStatus.PUBLISHED,
          ticketTypes: {
            create: event.ticketTypes,
          },
        },
      });
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

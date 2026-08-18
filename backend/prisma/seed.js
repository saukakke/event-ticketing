const { PrismaClient, UserRole, EventStatus, OrderStatus, TicketStatus, RefundStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");

const prisma = new PrismaClient();
const PASSWORD = "Password123!";
const DEMO_REFERENCE_PREFIX = "DEMO-";

function iso(daysFromNow, hour = 10) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

async function upsertUser({ email, name, role, passwordHash }) {
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash },
    create: { email, name, role, passwordHash },
  });
}

async function upsertEvent(organizerId, definition) {
  const event = await prisma.event.upsert({
    where: { slug: definition.slug },
    update: {
      organizerId,
      title: definition.title,
      description: definition.description,
      venue: definition.venue,
      city: definition.city,
      startAt: definition.startAt,
      endAt: definition.endAt,
      status: definition.status,
    },
    create: {
      organizerId,
      title: definition.title,
      slug: definition.slug,
      description: definition.description,
      venue: definition.venue,
      city: definition.city,
      startAt: definition.startAt,
      endAt: definition.endAt,
      status: definition.status,
    },
  });

  const ticketTypes = {};
  for (const type of definition.ticketTypes) {
    let ticketType = await prisma.ticketType.findFirst({
      where: { eventId: event.id, name: type.name },
    });

    if (!ticketType) {
      ticketType = await prisma.ticketType.create({
        data: {
          eventId: event.id,
          name: type.name,
          description: type.description,
          priceKobo: type.priceKobo,
          quantity: type.quantity,
          quantityRemaining: type.quantity,
        },
      });
    } else {
      ticketType = await prisma.ticketType.update({
        where: { id: ticketType.id },
        data: {
          description: type.description,
          priceKobo: type.priceKobo,
          quantity: type.quantity,
        },
      });
    }

    ticketTypes[type.name] = ticketType;
  }

  return { event, ticketTypes };
}

async function createSeedOrder({ reference, userId, eventId, status, ticketType, quantity, checkedIn = false, refund }) {
  const existing = await prisma.order.findUnique({ where: { paymentReference: reference } });
  if (existing) return existing;

  const totalKobo = ticketType.priceKobo * quantity;
  const order = await prisma.order.create({
    data: {
      userId,
      eventId,
      status,
      totalKobo,
      currency: "NGN",
      paymentReference: reference,
      items: { create: { ticketTypeId: ticketType.id, quantity, unitPriceKobo: ticketType.priceKobo } },
    },
  });

  if (status === OrderStatus.PAID || status === OrderStatus.REFUNDED) {
    for (let index = 0; index < quantity; index += 1) {
      const code = `DEMO-${reference}-${index + 1}`;
      const qrToken = `demo-qr-${reference}-${index + 1}`;
      const qrDataUrl = await QRCode.toDataURL(qrToken, { width: 240, margin: 1 });
      await prisma.ticket.create({
        data: {
          orderId: order.id, eventId, ticketTypeId: ticketType.id, code, qrToken, qrDataUrl,
          status: status === OrderStatus.REFUNDED ? TicketStatus.VOID : TicketStatus.ACTIVE,
          checkedIn: status === OrderStatus.PAID && checkedIn && index === 0,
          checkedInAt: status === OrderStatus.PAID && checkedIn && index === 0 ? new Date() : null,
        },
      });
    }
  }

  if (refund) {
    await prisma.refund.create({
      data: {
        orderId: order.id, eventId, requestedById: refund.requestedById, amountKobo: totalKobo,
        currency: "NGN", status: refund.status, providerReference: refund.providerReference, reason: refund.reason,
      },
    });
  }
  return order;
}

async function syncDemoInventory() {
  const demoOrders = await prisma.order.findMany({
    where: { paymentReference: { startsWith: DEMO_REFERENCE_PREFIX } }, include: { items: true },
  });
  const usage = new Map();
  for (const order of demoOrders) {
    const consumesInventory = order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID;
    if (!consumesInventory) continue;
    for (const item of order.items) usage.set(item.ticketTypeId, (usage.get(item.ticketTypeId) || 0) + item.quantity);
  }
  const ticketTypes = await prisma.ticketType.findMany({ where: { id: { in: Array.from(usage.keys()) } } });
  for (const ticketType of ticketTypes) {
    await prisma.ticketType.update({
      where: { id: ticketType.id },
      data: { quantityRemaining: Math.max(0, ticketType.quantity - (usage.get(ticketType.id) || 0)) },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const organizer = await upsertUser({ email: "organizer@eventflow.com", name: "EventFlow Organizer", role: UserRole.ORGANIZER, passwordHash });
  const organizerTwo = await upsertUser({ email: "organizer2@eventflow.com", name: "Northern Events Organizer", role: UserRole.ORGANIZER, passwordHash });
  const attendee = await upsertUser({ email: "attendee@eventflow.com", name: "Demo Attendee", role: UserRole.ATTENDEE, passwordHash });
  const attendeeTwo = await upsertUser({ email: "attendee2@eventflow.com", name: "Second Demo Attendee", role: UserRole.ATTENDEE, passwordHash });
  const attendeeThree = await upsertUser({ email: "attendee3@eventflow.com", name: "Third Demo Attendee", role: UserRole.ATTENDEE, passwordHash });
  const admin = await upsertUser({ email: "admin@eventflow.com", name: "EventFlow Admin", role: UserRole.ADMIN, passwordHash });

  const eventDefinitions = [
    {
      title: "Northern Digital Innovation Summit", slug: "northern-digital-innovation-summit",
      description: "Technology, AI, software engineering and digital entrepreneurship summit.", venue: "ABU Conference Centre", city: "Zaria",
      startAt: iso(60, 9), endAt: iso(60, 17), status: EventStatus.PUBLISHED, organizerId: organizer.id,
      ticketTypes: [{ name: "Regular", description: "General admission.", priceKobo: 500000, quantity: 250 }, { name: "VIP", description: "Priority seating and networking access.", priceKobo: 1500000, quantity: 50 }],
    },
    {
      title: "Zaria Software Developers Meetup", slug: "zaria-software-developers-meetup",
      description: "Hands-on developer meetup covering modern web development, APIs and cloud deployment.", venue: "Zaria Tech Hub", city: "Zaria",
      startAt: iso(90, 10), endAt: iso(90, 16), status: EventStatus.PUBLISHED, organizerId: organizer.id,
      ticketTypes: [{ name: "General Admission", description: "All meetup sessions.", priceKobo: 200000, quantity: 150 }, { name: "Workshop Pass", description: "Includes the practical workshop.", priceKobo: 500000, quantity: 50 }],
    },
    {
      title: "Northern Entrepreneurship & Startup Forum", slug: "northern-entrepreneurship-startup-forum",
      description: "Startup, funding, product and sustainable business growth forum.", venue: "Kaduna International Conference Centre", city: "Kaduna",
      startAt: iso(120, 9), endAt: iso(120, 18), status: EventStatus.PUBLISHED, organizerId: organizer.id,
      ticketTypes: [{ name: "Standard", description: "Full-day forum access.", priceKobo: 300000, quantity: 300 }, { name: "Founder Pass", description: "Premium founder networking access.", priceKobo: 1000000, quantity: 75 }],
    },
    {
      title: "Draft Event - Organizer Workspace Demo", slug: "draft-event-organizer-workspace-demo",
      description: "Draft event used to test organizer event-management workflows.", venue: "EventFlow Demo Venue", city: "Zaria",
      startAt: iso(150, 10), endAt: iso(150, 14), status: EventStatus.DRAFT, organizerId: organizer.id,
      ticketTypes: [{ name: "Early Access", description: "Draft event ticket type.", priceKobo: 100000, quantity: 100 }],
    },
    {
      title: "Cancelled Community Technology Forum", slug: "cancelled-community-technology-forum",
      description: "Cancelled event used to test cancelled-event handling.", venue: "Kaduna Community Hall", city: "Kaduna",
      startAt: iso(30, 11), endAt: iso(30, 15), status: EventStatus.CANCELLED, organizerId: organizer.id,
      ticketTypes: [{ name: "General", description: "Cancelled-event demonstration ticket.", priceKobo: 150000, quantity: 100 }],
    },
    {
      title: "Northern Community Builders Meetup", slug: "northern-community-builders-meetup",
      description: "Demo event owned by a second organizer to test organizer isolation.", venue: "Kaduna Tech Space", city: "Kaduna",
      startAt: iso(75, 11), endAt: iso(75, 16), status: EventStatus.PUBLISHED, organizerId: organizerTwo.id,
      ticketTypes: [{ name: "Community Pass", description: "General access.", priceKobo: 250000, quantity: 120 }],
    },
    {
      title: "Abuja Product & Design Conference", slug: "abuja-product-design-conference",
      description: "A practical conference for product managers, UX designers, researchers and digital builders exploring product strategy and user-centred design.", venue: "International Conference Centre Abuja", city: "Abuja",
      startAt: iso(45, 9), endAt: iso(45, 17), status: EventStatus.PUBLISHED, organizerId: organizerTwo.id,
      ticketTypes: [{ name: "Standard", description: "Full conference access.", priceKobo: 750000, quantity: 300 }, { name: "Premium", description: "Conference access plus networking reception.", priceKobo: 1500000, quantity: 80 }],
    },
    {
      title: "Kaduna Creative Arts & Culture Festival", slug: "kaduna-creative-arts-culture-festival",
      description: "A two-day celebration of northern creativity featuring music, visual arts, crafts, fashion and cultural performances.", venue: "Kaduna Polo Club", city: "Kaduna",
      startAt: iso(105, 12), endAt: iso(106, 20), status: EventStatus.PUBLISHED, organizerId: organizer.id,
      ticketTypes: [{ name: "Festival Pass", description: "General festival admission.", priceKobo: 400000, quantity: 500 }, { name: "VIP Pass", description: "VIP viewing area and hospitality access.", priceKobo: 1200000, quantity: 100 }],
    },
    {
      title: "Kano Business & Technology Expo", slug: "kano-business-technology-expo",
      description: "Business leaders, technology companies and entrepreneurs connect at this regional expo focused on innovation, trade and digital transformation.", venue: "Kano International Trade Fair Complex", city: "Kano",
      startAt: iso(135, 9), endAt: iso(136, 18), status: EventStatus.PUBLISHED, organizerId: organizerTwo.id,
      ticketTypes: [{ name: "Expo Pass", description: "Two-day expo access.", priceKobo: 250000, quantity: 600 }, { name: "Business Pass", description: "Expo access and business networking sessions.", priceKobo: 900000, quantity: 120 }],
    },
  ];

  const events = {};
  for (const definition of eventDefinitions) events[definition.slug] = await upsertEvent(definition.organizerId, definition);

  const demoEvent = events["northern-digital-innovation-summit"];
  const meetupEvent = events["zaria-software-developers-meetup"];
  const startupEvent = events["northern-entrepreneurship-startup-forum"];
  const regular = demoEvent.ticketTypes.Regular;
  const vip = demoEvent.ticketTypes.VIP;
  const general = meetupEvent.ticketTypes["General Admission"];
  const workshop = meetupEvent.ticketTypes["Workshop Pass"];
  const standard = startupEvent.ticketTypes.Standard;

  await createSeedOrder({ reference: "DEMO-PAID-CHECKED-IN-001", userId: attendee.id, eventId: demoEvent.event.id, status: OrderStatus.PAID, ticketType: regular, quantity: 2, checkedIn: true });
  await createSeedOrder({ reference: "DEMO-PAID-ACTIVE-002", userId: attendeeTwo.id, eventId: demoEvent.event.id, status: OrderStatus.PAID, ticketType: vip, quantity: 1 });
  await createSeedOrder({ reference: "DEMO-PENDING-003", userId: attendeeThree.id, eventId: meetupEvent.event.id, status: OrderStatus.PENDING, ticketType: general, quantity: 2 });
  await createSeedOrder({ reference: "DEMO-FAILED-004", userId: attendee.id, eventId: meetupEvent.event.id, status: OrderStatus.FAILED, ticketType: workshop, quantity: 1 });
  await createSeedOrder({ reference: "DEMO-REFUNDED-005", userId: attendeeTwo.id, eventId: startupEvent.event.id, status: OrderStatus.REFUNDED, ticketType: standard, quantity: 2, refund: { requestedById: admin.id, status: RefundStatus.PROCESSED, providerReference: "DEMO-REFUND-PROCESSED-005", reason: "Demo processed refund" } });
  await createSeedOrder({ reference: "DEMO-REFUND-PENDING-006", userId: attendeeThree.id, eventId: startupEvent.event.id, status: OrderStatus.PAID, ticketType: standard, quantity: 1, refund: { requestedById: admin.id, status: RefundStatus.PENDING, providerReference: null, reason: "Demo pending refund" } });
  await createSeedOrder({ reference: "DEMO-REFUND-PROCESSING-007", userId: attendee.id, eventId: startupEvent.event.id, status: OrderStatus.PAID, ticketType: standard, quantity: 1, refund: { requestedById: organizer.id, status: RefundStatus.PROCESSING, providerReference: "DEMO-REFUND-PROCESSING-007", reason: "Demo processing refund" } });
  await createSeedOrder({ reference: "DEMO-REFUND-FAILED-008", userId: attendeeTwo.id, eventId: meetupEvent.event.id, status: OrderStatus.PAID, ticketType: general, quantity: 1, refund: { requestedById: organizer.id, status: RefundStatus.FAILED, providerReference: "DEMO-REFUND-FAILED-008", reason: "Demo failed refund" } });

  await syncDemoInventory();

  const checkedInTicket = await prisma.ticket.findUnique({ where: { code: "DEMO-DEMO-PAID-CHECKED-IN-001-1" } });
  const auditEvents = [
    [admin.id, "SEED_PAYMENT_VERIFIED", "Order", "DEMO-PAID-CHECKED-IN-001"],
    [admin.id, "SEED_REFUND_PROCESSED", "Order", "DEMO-REFUNDED-005"],
  ];
  if (checkedInTicket) auditEvents.push([organizer.id, "SEED_TICKET_CHECKED_IN", "Ticket", checkedInTicket.id]);
  for (const [actorId, action, entity, entityId] of auditEvents) {
    const existing = await prisma.auditLog.findFirst({ where: { actorId, action, entity, entityId } });
    if (!existing) await prisma.auditLog.create({ data: { actorId, action, entity, entityId, metadata: { seeded: true } } });
  }

  console.log("Seed completed with comprehensive demo data.");
  console.log("Demo login password for all seeded users: Password123!");
  console.log("Users: 1 admin, 2 organizers, 3 attendees.");
  console.log("Events: 9 total — 7 published, 1 draft and 1 cancelled.");
  console.log("Orders: PENDING, PAID, FAILED and REFUNDED.");
  console.log("Tickets: ACTIVE and VOID, including a checked-in ticket.");
  console.log("Refunds: PENDING, PROCESSING, PROCESSED and FAILED.");
  console.log("Audit logs include seeded payment, refund and check-in activity.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

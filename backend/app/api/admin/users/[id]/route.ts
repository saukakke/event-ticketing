import { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

const ROLES = ["ATTENDEE", "ORGANIZER", "ADMIN"] as const;
type Role = (typeof ROLES)[number];
const ACTIONS = ["suspend", "restore", "delete", "undelete"] as const;
type Action = (typeof ACTIONS)[number];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAuthUser();
    if (!actor) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (actor.role !== "ADMIN") return errorResponse("FORBIDDEN", "Admin access required.", 403);
    const { id } = await params;
    const data = await prisma.user.findUnique({
      where: { id: id as never },
      select: {
        id: true, name: true, email: true, role: true, suspendedAt: true, suspensionReason: true, deletedAt: true, createdAt: true, updatedAt: true,
        events: { select: { id: true, title: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 },
        orders: { select: { id: true, status: true, totalKobo: true, event: { select: { title: true } }, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 },
        _count: { select: { events: true, orders: true, auditLogs: true } },
      },
    });
    if (!data) return errorResponse("NOT_FOUND", "User not found.", 404);
    return ok(data);
  } catch (error) { return handleError(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAuthUser();
    if (!actor) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (actor.role !== "ADMIN") return errorResponse("FORBIDDEN", "Admin access required.", 403);
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const action = body?.action as Action | undefined;
    const role = body?.role as Role | undefined;

    if (role !== undefined) {
      if (!ROLES.includes(role)) return errorResponse("VALIDATION_ERROR", "A valid user role is required.", 422);
      if (id === actor.id && role !== "ADMIN") return errorResponse("SELF_ACCOUNT_PROTECTION", "You cannot demote your own administrator account.", 409);

      try {
        const updated = await prisma.$transaction(async (tx) => {
          const target = await tx.user.findUnique({ where: { id: id as never }, select: { id: true, name: true, role: true } });
          if (!target) throw new Error("USER_NOT_FOUND");

          if (target.role === "ADMIN" && role !== "ADMIN") {
            const otherActiveAdminCount = await tx.user.count({
              where: {
                role: "ADMIN",
                id: { not: id as never },
                suspendedAt: null,
                deletedAt: null,
              },
            });
            if (otherActiveAdminCount === 0) throw new Error("LAST_ADMIN_PROTECTION");
          }

          const next = await tx.user.update({ where: { id: id as never }, data: { role }, select: { id: true, name: true, email: true, role: true, suspendedAt: true, deletedAt: true, createdAt: true, updatedAt: true } });
          await tx.auditLog.create({ data: { actorId: actor.id, action: "USER_ROLE_CHANGED", entity: "User", entityId: id, metadata: { previousRole: target.role, newRole: role } } });
          return next;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return ok(updated, "User role updated successfully.");
      } catch (error) {
        if (error instanceof Error && error.message === "USER_NOT_FOUND") return errorResponse("NOT_FOUND", "User not found.", 404);
        if (error instanceof Error && error.message === "LAST_ADMIN_PROTECTION") return errorResponse("LAST_ADMIN_PROTECTION", "The last active administrator cannot be demoted.", 409);
        throw error;
      }
    }

    if (!action || !ACTIONS.includes(action)) return errorResponse("VALIDATION_ERROR", "A valid user action is required.", 422);
    if (id === actor.id) return errorResponse("SELF_ACCOUNT_PROTECTION", "You cannot suspend, delete or restore your own administrator account.", 409);

    const target = await prisma.user.findUnique({ where: { id: id as never }, select: { id: true, name: true, role: true, suspendedAt: true, deletedAt: true } });
    if (!target) return errorResponse("NOT_FOUND", "User not found.", 404);
    if (target.role === "ADMIN") return errorResponse("ADMIN_PROTECTION", "Administrator accounts cannot be suspended or deleted.", 409);

    if (action === "suspend" && target.suspendedAt) return errorResponse("ALREADY_SUSPENDED", "User is already suspended.", 409);
    if (action === "restore" && !target.suspendedAt) return errorResponse("NOT_SUSPENDED", "User is not suspended.", 409);
    if (action === "delete" && target.deletedAt) return errorResponse("ALREADY_DELETED", "User is already soft-deleted.", 409);
    if (action === "undelete" && !target.deletedAt) return errorResponse("NOT_DELETED", "User is not soft-deleted.", 409);

    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : null;
    const result = await prisma.$transaction(async (tx) => {
      let data;
      let auditAction: string;
      switch (action) {
        case "suspend":
          data = { suspendedAt: new Date(), suspensionReason: reason || "Suspended by administrator." };
          auditAction = "USER_SUSPENDED";
          break;
        case "restore":
          data = { suspendedAt: null, suspensionReason: null };
          auditAction = "USER_UNSUSPENDED";
          break;
        case "delete":
          data = { deletedAt: new Date() };
          auditAction = "USER_SOFT_DELETED";
          break;
        default:
          data = { deletedAt: null };
          auditAction = "USER_RESTORED";
      }
      const updated = await tx.user.update({ where: { id: id as never }, data, select: { id: true, name: true, email: true, role: true, suspendedAt: true, suspensionReason: true, deletedAt: true, createdAt: true, updatedAt: true } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: auditAction, entity: "User", entityId: id, metadata: { reason: reason || null } } });
      return updated;
    });

    return ok(result, `User ${action} operation completed successfully.`);
  } catch (error) { return handleError(error); }
}

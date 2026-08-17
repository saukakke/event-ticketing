import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, handleError, ok } from "@/lib/http";

const ROLES = ["ATTENDEE", "ORGANIZER", "ADMIN"] as const;
type Role = (typeof ROLES)[number];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAuthUser();
    if (!actor) return errorResponse("UNAUTHENTICATED", "Sign in required.", 401);
    if (actor.role !== "ADMIN") return errorResponse("FORBIDDEN", "Admin access required.", 403);
    const { id } = await params;
    const data = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, suspendedAt: true, suspensionReason: true, deletedAt: true, createdAt: true, updatedAt: true, events: { select: { id: true, title: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 }, orders: { select: { id: true, status: true, totalKobo: true, event: { select: { title: true } }, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 }, _count: { select: { events: true, orders: true, auditLogs: true } } } });
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
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, role: true, suspendedAt: true, deletedAt: true } });
    if (!target) return errorResponse("NOT_FOUND", "User not found.", 404);

    const action = body?.action as string | undefined;
    const role = body?.role as Role | undefined;
    if (id === actor.id && (action === "suspend" || action === "delete" || (role && role !== "ADMIN"))) return errorResponse("SELF_ACCOUNT_PROTECTION", "You cannot suspend, delete, or demote your own administrator account.", 409);

    if (role) {
      if (!ROLES.includes(role)) return errorResponse("VALIDATION_ERROR", "A valid user role is required.", 422);
      const updated = await prisma.$transaction(async (tx) => {
        const next = await tx.user.update({ where: { id }, data: { role }, select: { id: true, name: true, email: true, role: true, suspendedAt: true, deletedAt: true, createdAt: true, updatedAt: true } });
        await tx.auditLog.create({ data: { actorId: actor.id, action: "USER_ROLE_CHANGED", entity: "User", entityId: id, metadata: { previousRole: target.role, newRole: role } } });
        return next;
      });
      return ok(updated, "User role updated successfully.");
    }

    if (!["suspend", "restore", "delete", "undelete"].includes(action || "")) return errorResponse("VALIDATION_ERROR", "Specify a valid user management action.", 422);
    if ((action === "suspend" || action === "delete") && target.role === "ADMIN") return errorResponse("ADMIN_ACCOUNT_PROTECTED", "Administrator accounts cannot be suspended or deleted through this action.", 409);
    if ((action === "restore" || action === "undelete") && action === "restore" && target.deletedAt) return errorResponse("ACCOUNT_DELETED", "Restore the deleted account before removing its suspension.", 409);

    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : null;
    const data = action === "suspend" ? { suspendedAt: new Date(), suspensionReason: reason || "Suspended by administrator" } : action === "restore" ? { suspendedAt: null, suspensionReason: null } : action === "delete" ? { deletedAt: new Date(), suspendedAt: null, suspensionReason: null } : { deletedAt: null };
    const auditAction = action === "suspend" ? "USER_SUSPENDED" : action === "restore" ? "USER_RESTORED" : action === "delete" ? "USER_SOFT_DELETED" : "USER_UNDELETED";

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, suspendedAt: true, suspensionReason: true, deletedAt: true, createdAt: true, updatedAt: true } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: auditAction, entity: "User", entityId: id, metadata: { reason } } });
      return next;
    });
    return ok(updated, `User ${action} completed successfully.`);
  } catch (error) { return handleError(error); }
}

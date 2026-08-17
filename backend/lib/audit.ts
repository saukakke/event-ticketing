import { prisma } from "./db";

export async function audit(actorId: string, action: string, entity: string, entityId: string, metadata?: unknown) {
  return prisma.auditLog.create({ data: { actorId, action, entity, entityId, metadata: metadata === undefined ? undefined : JSON.parse(JSON.stringify(metadata)) } });
}

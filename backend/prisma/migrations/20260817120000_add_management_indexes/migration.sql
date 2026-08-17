CREATE INDEX "Order_eventId_createdAt_idx" ON "Order"("eventId", "createdAt");
CREATE INDEX "Order_status_updatedAt_idx" ON "Order"("status", "updatedAt");
CREATE INDEX "Ticket_eventId_createdAt_idx" ON "Ticket"("eventId", "createdAt");

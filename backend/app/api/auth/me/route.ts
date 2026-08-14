import { getAuthUser } from "@/lib/auth";
import { ok, errorResponse } from "@/lib/http";

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return errorResponse(
      "UNAUTHENTICATED",
      "You are not signed in.",
      401
    );
  }

  return ok(user);
}

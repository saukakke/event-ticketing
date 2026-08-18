"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { AuthFooter } from "@/components/auth-footer";

const AUTHENTICATED_PREFIXES = ["/dashboard", "/admin", "/organizer"];

export function FooterSwitcher() {
  const pathname = usePathname();
  const isAuthenticatedArea = AUTHENTICATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return isAuthenticatedArea ? <AuthFooter /> : <SiteFooter />;
}

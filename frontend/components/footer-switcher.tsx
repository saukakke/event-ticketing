"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { AuthFooter } from "@/components/auth-footer";

const AUTHENTICATED_AREAS = ["/dashboard", "/admin", "/organizer", "/events"];

export function FooterSwitcher() {
  const pathname = usePathname();
  const isAlwaysAuthenticatedArea = ["/dashboard", "/admin", "/organizer"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const [authenticated, setAuthenticated] = useState(isAlwaysAuthenticatedArea);

  useEffect(() => {
    let active = true;

    if (isAlwaysAuthenticatedArea) {
      setAuthenticated(true);
      return () => {
        active = false;
      };
    }

    if (!AUTHENTICATED_AREAS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      setAuthenticated(false);
      return () => {
        active = false;
      };
    }

    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (active) setAuthenticated(Boolean(payload?.data?.user));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      });

    return () => {
      active = false;
    };
  }, [pathname, isAlwaysAuthenticatedArea]);

  return authenticated ? <AuthFooter /> : <SiteFooter />;
}

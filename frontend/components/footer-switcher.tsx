"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { SiteFooter } from "@/components/site-footer";
import { AuthFooter } from "@/components/auth-footer";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ATTENDEE" | "ORGANIZER" | "ADMIN";
};

const AUTHENTICATED_AREAS = ["/dashboard", "/admin", "/organizer", "/events"];
const ALWAYS_AUTHENTICATED_AREAS = ["/dashboard", "/admin", "/organizer"];

export function FooterSwitcher() {
  const pathname = usePathname();
  const isAlwaysAuthenticatedArea = ALWAYS_AUTHENTICATED_AREAS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthenticatedCheckArea = AUTHENTICATED_AREAS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const [authenticated, setAuthenticated] = useState<boolean | null>(
    isAlwaysAuthenticatedArea ? true : isAuthenticatedCheckArea ? null : false,
  );

  useEffect(() => {
    let active = true;

    if (isAlwaysAuthenticatedArea) {
      setAuthenticated(true);
      return () => {
        active = false;
      };
    }

    if (!isAuthenticatedCheckArea) {
      setAuthenticated(false);
      return () => {
        active = false;
      };
    }

    // Event listing and event-detail pages are public, so determine the
    // footer from the actual authenticated session rather than the URL.
    api<User>("/auth/me")
      .then(() => {
        if (active) setAuthenticated(true);
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      });

    return () => {
      active = false;
    };
  }, [isAlwaysAuthenticatedArea, isAuthenticatedCheckArea, pathname]);

  // Avoid briefly rendering the visitor footer while the event-page session
  // check is in progress. The footer is rendered only after authentication is
  // known for /events and /events/:id.
  if (authenticated === null) return null;

  return authenticated ? <AuthFooter /> : <SiteFooter />;
}

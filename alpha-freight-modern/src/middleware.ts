import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_PANEL_PATH,
  adminRoute,
  isAdminLoginPath,
  isAdminPanelPath,
  isLegacyAdminPath,
} from "@/lib/admin-path";
import { userHasAdminAccess } from "@/lib/admin-session";
import { createSupabaseMiddlewareClient } from "@/lib/supabase-middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isLegacyAdminPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (!isAdminPanelPath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddlewareClient(request, response);

  if (isAdminLoginPath(pathname)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && (await userHasAdminAccess(supabase, user))) {
      return NextResponse.redirect(new URL(ADMIN_PANEL_PATH, request.url));
    }

    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL(adminRoute("/login"), request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdmin = await userHasAdminAccess(supabase, user);
  if (!isAdmin) {
    await supabase.auth.signOut();
    const loginUrl = new URL(adminRoute("/login"), request.url);
    loginUrl.searchParams.set("error", "access_denied");
    return NextResponse.redirect(loginUrl);
  }

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/ops-af-7x9k2/:path*"],
};

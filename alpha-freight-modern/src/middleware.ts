import { NextResponse, type NextRequest } from "next/server";



import {

  ADMIN_PANEL_PATH,

  adminRoute,

  isAdminLoginPath,

  isAdminPanelPath,

  isLegacyAdminPath,

} from "@/lib/admin-path";

import {
  COMMERCIAL_DIRECTOR_PANEL_PATH,
  commercialDirectorRoute,
  isCommercialDirectorLoginPath,
  isCommercialDirectorPanelPath,
} from "@/lib/commercial-director-path";
import { userHasAdminAccess } from "@/lib/admin-session";
import { userHasCommercialDirectorAccess } from "@/lib/commercial-director-session";
import { isEmployeeMetadata } from "@/lib/employee-auth-utils";
import { EMPLOYEE_ONBOARDING_COOKIE } from "@/lib/employee-onboarding";

import {

  EMPLOYEE_PANEL_PATH,

  employeeOnboardingPath,

  employeeRoute,

  isEmployeeLoginPath,

  isEmployeeOnboardingPath,

  isEmployeePolicyPath,

  isEmployeePanelPath,

  isEmployeeSignupPath,

  isLegacyEmployeePath,

} from "@/lib/employee-path";

import {
  isPathAllowedInWarningMode,
  isPlatformWarningOnlyMode,
  OFFICIAL_PUBLIC_WARNING_PATH,
} from "@/lib/platform-public-mode";
import {
  createSupabaseMiddlewareClient,
  getMiddlewareSessionUser,
} from "@/lib/supabase-middleware";



function employeeOnboardingCookie(request: NextRequest) {
  return request.cookies.get(EMPLOYEE_ONBOARDING_COOKIE)?.value ?? null;
}



export async function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl;

  if (isPlatformWarningOnlyMode() && !isPathAllowedInWarningMode(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "unavailable",
          message: "Alpha Freight public platform is locked. Read the official public warning.",
          warningPath: OFFICIAL_PUBLIC_WARNING_PATH,
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const warningUrl = request.nextUrl.clone();
    warningUrl.pathname = OFFICIAL_PUBLIC_WARNING_PATH;
    warningUrl.search = "";
    return NextResponse.redirect(warningUrl);
  }

  if (isLegacyAdminPath(pathname)) {

    return new NextResponse(null, { status: 404 });

  }



  if (isLegacyEmployeePath(pathname)) {

    return new NextResponse(null, { status: 404 });

  }



  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/commercial-director")) {

    return NextResponse.next();

  }



  if (isCommercialDirectorPanelPath(pathname)) {

    const response = NextResponse.next({ request });

    const supabase = createSupabaseMiddlewareClient(request, response);



    if (isCommercialDirectorLoginPath(pathname)) {

      const user = await getMiddlewareSessionUser(supabase);



      if (user && (await userHasCommercialDirectorAccess(supabase, user))) {

        return NextResponse.redirect(new URL(COMMERCIAL_DIRECTOR_PANEL_PATH, request.url));

      }



      return response;

    }



    const user = await getMiddlewareSessionUser(supabase);



    if (!user) {

      const loginUrl = new URL(commercialDirectorRoute("/login"), request.url);

      loginUrl.searchParams.set("redirect", pathname);

      return NextResponse.redirect(loginUrl);

    }



    const allowed = await userHasCommercialDirectorAccess(supabase, user);

    if (!allowed) {

      await supabase.auth.signOut();

      const loginUrl = new URL(commercialDirectorRoute("/login"), request.url);

      loginUrl.searchParams.set("error", "access_denied");

      return NextResponse.redirect(loginUrl);

    }



    response.headers.set("X-Frame-Options", "DENY");

    response.headers.set("X-Content-Type-Options", "nosniff");

    response.headers.set("Referrer-Policy", "same-origin");

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");



    return response;

  }



  if (isEmployeePanelPath(pathname)) {

    const response = NextResponse.next({ request });

    const supabase = createSupabaseMiddlewareClient(request, response);

    const user = await getMiddlewareSessionUser(supabase);



    if (isEmployeeLoginPath(pathname) || isEmployeeSignupPath(pathname)) {
      return response;
    }



    if (!user) {

      const loginUrl = new URL(employeeRoute("/login"), request.url);

      loginUrl.searchParams.set("redirect", pathname);

      return NextResponse.redirect(loginUrl);

    }



    if (!isEmployeeMetadata(user)) {

      const loginUrl = new URL(employeeRoute("/login"), request.url);

      loginUrl.searchParams.set("error", "access_denied");

      return NextResponse.redirect(loginUrl);

    }



    const onboarded = employeeOnboardingCookie(request) === user.id;



    if (isEmployeeOnboardingPath(pathname) || isEmployeePolicyPath(pathname)) {

      if (onboarded && isEmployeeOnboardingPath(pathname)) {

        return NextResponse.redirect(new URL(EMPLOYEE_PANEL_PATH, request.url));

      }

      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

      return response;

    }



    if (!onboarded) {

      return NextResponse.redirect(new URL(employeeOnboardingPath(), request.url));

    }



    response.headers.set("X-Frame-Options", "DENY");

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

    return response;

  }



  if (!isAdminPanelPath(pathname)) {

    return NextResponse.next();

  }



  const response = NextResponse.next({ request });

  const supabase = createSupabaseMiddlewareClient(request, response);



  if (isAdminLoginPath(pathname)) {

    const user = await getMiddlewareSessionUser(supabase);



    if (user && (await userHasAdminAccess(supabase, user))) {

      return NextResponse.redirect(new URL(ADMIN_PANEL_PATH, request.url));

    }



    return response;

  }



  const user = await getMiddlewareSessionUser(supabase);



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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};

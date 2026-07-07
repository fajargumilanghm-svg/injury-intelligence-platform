import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Role-based route restrictions
const roleRestrictedPaths: Record<string, string[]> = {
  "/dashboard/admin": ["administrator"],
  "/dashboard/team-intelligence": ["coach", "physiotherapist", "sport_scientist", "administrator"],
  "/dashboard/predictive-ai": ["coach", "physiotherapist", "sport_scientist", "administrator"],
  "/dashboard/predictive-analytics": ["coach", "physiotherapist", "sport_scientist", "administrator"],
  "/dashboard/reports": ["coach", "physiotherapist", "sport_scientist", "administrator"],
  "/dashboard/physical-screening": ["physiotherapist", "sport_scientist", "administrator"],
  "/dashboard/assessments": ["physiotherapist", "sport_scientist"],
};

function getRequiredRoles(pathname: string): string[] | null {
  for (const [path, roles] of Object.entries(roleRestrictedPaths)) {
    if (pathname.startsWith(path)) return roles;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const protectedPaths = ["/dashboard"];
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  const authPaths = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));

  // Unauthenticated user hitting protected route
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting auth page
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role-based access control for protected routes
  if (user && isProtected) {
    const requiredRoles = getRequiredRoles(pathname);
    if (requiredRoles && requiredRoles.length > 0) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!profile || !requiredRoles.includes(profile.role)) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*))"],
};

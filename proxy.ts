import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * An ad click lands with ?fbclid= before the pixel has set _fbc.
 * Meta's click id format is fb.1.{creationTimeMs}.{fbclid}.
 */
export function proxy(request: NextRequest) {
  const fbclid = request.nextUrl.searchParams.get("fbclid");
  const response = NextResponse.next();
  if (fbclid && !request.cookies.get("_fbc")) {
    response.cookies.set("_fbc", `fb.1.${Date.now()}.${fbclid}`, {
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

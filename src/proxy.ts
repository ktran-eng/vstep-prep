import { NextResponse, type NextRequest } from "next/server";

/**
 * Passes the requested path to server code so that, when a visitor without a sign-in name is sent
 * to /start, they can be returned to the page they wanted afterwards.
 */
export function proxy(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-vstep-path", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|audio/|api/|favicon.ico|robots.txt).*)"],
};

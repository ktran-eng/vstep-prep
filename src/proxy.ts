import { NextResponse, type NextRequest } from "next/server";
import { LEARNER_COOKIE, UUID_RE, sign, verify } from "@/lib/signing";

/**
 * Assigns every browser an anonymous, signed learner id (no accounts by design).
 * The id is created here because cookies cannot be set while rendering Server Components.
 */
export async function proxy(req: NextRequest) {
  const current = await verify(req.cookies.get(LEARNER_COOKIE)?.value);
  if (current && UUID_RE.test(current)) return NextResponse.next();

  const id = crypto.randomUUID();
  const value = await sign(id);
  // Make the new id visible to this same request's server code.
  req.cookies.set(LEARNER_COOKIE, value);
  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set(LEARNER_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|audio/|favicon.ico|robots.txt).*)"],
};

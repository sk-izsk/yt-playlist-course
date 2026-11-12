import { NextResponse, type NextRequest } from "next/server";

// Reading the app is public; only Settings (agent tokens) is a page that makes no sense logged out.
// Optimistic only: the real check is requireUser() in every write route.
// (Cookie name duplicated from server/auth/cookies.ts to keep next/headers out of the proxy bundle.)
const ACCESS_COOKIE = "tw_at";

export const proxy = (req: NextRequest) => {
  if (req.cookies.has(ACCESS_COOKIE)) return NextResponse.next();
  const login = new URL("/login", req.nextUrl);
  login.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(login);
};

export const config = { matcher: ["/settings"] };

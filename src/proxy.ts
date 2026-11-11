import { NextResponse, type NextRequest } from "next/server";

// Optimistic only: no cookie → login page. The real check is requireUser() in every API route.
// (Name duplicated from server/auth/cookies.ts to keep next/headers out of the proxy bundle.)
const ACCESS_COOKIE = "tw_at";

export const proxy = (req: NextRequest) => {
  if (req.cookies.has(ACCESS_COOKIE)) return NextResponse.next();
  const login = new URL("/login", req.nextUrl);
  const next = req.nextUrl.pathname + req.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
};

export const config = {
  // Pages only: not the API (it answers 401 JSON), the login page, Next assets or files with an extension.
  matcher: ["/((?!api|login|_next/static|_next/image|.*\\..*).*)"],
};

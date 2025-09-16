import { NextResponse, NextRequest } from "next/server";

const privatePaths = ["/manage"];
const unAuthPaths = ["/login"];

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  //pathname: /manage/dashboard
  const isAuth = Boolean(request.cookies.get("accessToken")?.value);
  if (privatePaths.some((path) => pathname.startsWith(path) && !isAuth)) {
    //If not logged in and request a private page, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
  //Logged in but still go to login page, do not allow to go to login page anymore
  if (unAuthPaths.some((path) => pathname.startsWith(path) && isAuth)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manage/:path*", "/login"],
};

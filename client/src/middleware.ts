import { NextResponse, NextRequest } from "next/server";

const privatePaths = ["/manage"];
const unAuthPaths = ["/login"];

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  //pathname: /manage/dashboard
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  //If not logged in and request a private page, redirect to login
  if (privatePaths.some((path) => pathname.startsWith(path) && !refreshToken)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("clearTokens", "true");
    return NextResponse.redirect(url);
  }
  //Logged in but still go to login page, do not allow to go to login page anymore
  if (unAuthPaths.some((path) => pathname.startsWith(path) && refreshToken)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  //Case of logged in but accessToken expired
  if (
    privatePaths.some(
      (path) => pathname.startsWith(path) && !accessToken && refreshToken
    )
  ) {
    const url = new URL("/refresh-token", request.url);
    url.searchParams.set("refreshToken", refreshToken ?? "");
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manage/:path*", "/login"],
};

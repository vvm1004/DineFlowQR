import { NextResponse, NextRequest } from "next/server";
import { decodeToken } from "./lib/utils";
import { Role } from "./constants/type";

const managePaths = ["/manage"];
const guestPaths = ["/guest"];
const privatePaths = [...managePaths, ...guestPaths];
const unAuthPaths = ["/login"];

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  //pathname: /manage/dashboard
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  //1. If not logged in and request a private page, redirect to login
  if (privatePaths.some((path) => pathname.startsWith(path) && !refreshToken)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("clearTokens", "true");
    return NextResponse.redirect(url);
  }

  //2.Case of logged in
  if (refreshToken) {
    //2.1: If you intentionally enter the login page, it will redirect to the home page.
    if (unAuthPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    //2.2: Case of logged in but accessToken expired
    if (
      privatePaths.some((path) => pathname.startsWith(path) && !accessToken)
    ) {
      const url = new URL("/refresh-token", request.url);
      url.searchParams.set("refreshToken", refreshToken ?? "");
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    //2.3: Incorrect role, redirected to home page
    const role = decodeToken(refreshToken).role;
    //Guest but trying to access the owner route
    const isGuestGoToManagePath =
      role === Role.Guest &&
      managePaths.some((path) => pathname.startsWith(path));
    //Not Guest but trying to access guest route
    const isNotGuestGoToGuestPath =
      role !== Role.Guest &&
      guestPaths.some((path) => pathname.startsWith(path));

    if (isGuestGoToManagePath || isNotGuestGoToGuestPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/manage/:path*", "/login", "/guest/:path*"],
};

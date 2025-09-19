"use client ";

import { checkAndRefreshToken } from "@/lib/utils";
import { useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

//The following pages will not check refresh token
const UNAUTHENTICATED_PATHS = ["/login", "/logout", "/refresh-token"];

export default function RefreshToken() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (UNAUTHENTICATED_PATHS.includes(pathname)) return;
    let interval: any = null;
    //Must be called the first time, because the interval will run after the TIMEOUT time
    checkAndRefreshToken({
      onError: () => {
        clearInterval(interval);
        router.push("/login");
      },
    });
    //Timeout interval must be less than access token expiration time
    //For example, if access token expiration time is 10s, then I will check once every 1s
    const TIMEOUT = 1000;
    interval = setInterval(
      () =>
        checkAndRefreshToken({
          onError: () => {
            clearInterval(interval);
            router.push("/login");
          },
        }),
      TIMEOUT
    );
    return () => clearInterval(interval);
  }, [pathname, router]);
  return null;
}

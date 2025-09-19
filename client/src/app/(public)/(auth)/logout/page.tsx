"use client";
import { useAppContext } from "@/components/app.provider";
import {
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage,
} from "@/lib/utils";
import { useLogoutMutation } from "@/queries/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function LogoutPage() {
  const { mutateAsync } = useLogoutMutation();
  const ref = useRef<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const refreshTokenFromUrl = searchParams.get("refreshToken");
  const accessTokenFromUrl = searchParams.get("accessToken");
  const { setIsAuth } = useAppContext();

  useEffect(() => {
    if (
      !ref.current ||
      (refreshTokenFromUrl &&
        refreshTokenFromUrl === getRefreshTokenFromLocalStorage()) ||
      (accessTokenFromUrl &&
        accessTokenFromUrl === getAccessTokenFromLocalStorage())
    ) {
      ref.current = mutateAsync;
      mutateAsync().then((res) => {
        setTimeout(() => {
          ref.current = null;
        }, 1000);
        setIsAuth(false);
        router.push("/login");
      });
    } else {
      router.push("/");
    }
  }, [mutateAsync, router, refreshTokenFromUrl, accessTokenFromUrl]);
  return <div>Logging out...</div>;
}

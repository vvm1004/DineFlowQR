import { toast } from "@/components/ui/use-toast";
import { clsx, type ClassValue } from "clsx";
import { UseFormSetError } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { EntityError } from "./http";
import jwt from "jsonwebtoken";
import authApiRequest from "@/apiRequests/auth";
import { on } from "events";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Remove the first `/` character of the path
 */
export const normalizePath = (path: string) => {
  return path.startsWith("/") ? path.slice(1) : path;
};

export const handleErrorApi = ({
  error,
  setError,
  duration,
}: {
  error: any;
  setError?: UseFormSetError<any>;
  duration?: number;
}) => {
  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((item) => {
      setError(item.field, {
        type: "server",
        message: item.message,
      });
    });
  } else {
    toast({
      title: "Error",
      description: error?.payload?.message ?? "Unknown error",
      variant: "destructive",
      duration: duration ?? 5000,
    });
  }
};
const isBrowser = typeof window !== "undefined";

export const getAccessTokenFromLocalStorage = () =>
  isBrowser ? localStorage.getItem("accessToken") : null;

export const getRefreshTokenFromLocalStorage = () =>
  isBrowser ? localStorage.getItem("refreshToken") : null;

export const setAccessTokenToLocalStorage = (accessToken: string) => {
  isBrowser && localStorage.setItem("accessToken", accessToken);
};
export const setRefreshTokenToLocalStorage = (refreshToken: string) => {
  isBrowser && localStorage.setItem("refreshToken", refreshToken);
};

export const removeTokensFromLocalStorage = () => {
  isBrowser && localStorage.removeItem("accessToken");
  isBrowser && localStorage.removeItem("refreshToken");
};
export const checkAndRefreshToken = async (params?: {
  onError?: () => void;
  onSuccess?: () => void;
}) => {
  const accessToken = getAccessTokenFromLocalStorage();
  const refreshToken = getRefreshTokenFromLocalStorage();
  //If not logged in, it will not run
  if (!accessToken || !refreshToken) {
    return;
  }
  const decodedAccessToken = jwt.decode(accessToken) as {
    exp: number;
    iat: number;
  };
  const decodedRefreshToken = jwt.decode(refreshToken) as {
    exp: number;
    iat: number;
  };

  //The token's expiration time is calculated by epoch time (s)
  //When you use the new Date().getTime() syntax, it will give epoch time (ms)
  const now = new Date().getTime() / 1000 - 1;
  //Case refresh token expires, then logout
  if (decodedRefreshToken.exp <= now) {
    removeTokensFromLocalStorage();
    return params?.onError && params.onError();
  }
  //For example, our access token has an expiration time of 10s
  //then I will check if there is 1/3 of the time left (3s) then I will refresh the token
  //The remaining time will be calculated based on the formula: decodedAccessToken.exp - now
  //The expiration time of the access token is based on the formula: decodedAccessToken.exp - decodedAccessToken.iat
  if (
    decodedAccessToken.exp - now <
    (decodedAccessToken.exp - decodedAccessToken.iat) / 3
  ) {
    //Call API refresh token
    try {
      const res = await authApiRequest.refreshToken();
      setAccessTokenToLocalStorage(res.payload.data.accessToken);
      setRefreshTokenToLocalStorage(res.payload.data.refreshToken);
      params?.onSuccess && params.onSuccess();
    } catch (error) {
      params?.onError && params.onError();
    }
  }
};

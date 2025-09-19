"use client";

import { useAppContext } from "@/components/app.provider";
import { getAccessTokenFromLocalStorage } from "@/lib/utils";
import Link from "next/link";
import { use, useEffect, useState } from "react";

const menuItems = [
  { title: "Món ăn", href: "/menu" },
  { title: "Đơn hàng", href: "/orders", authRequired: true },
  { title: "Đăng nhập", href: "/login", authRequired: false },
  { title: "Quản lý", href: "/manage/dashboard", authRequired: true },
];

export default function NavItems({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { isAuth } = useAppContext();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid rendering on the server / pre-hydration to prevent mismatches
  if (!mounted) return null;

  return (
    <>
      {menuItems.map((item) => {
        if (
          (item.authRequired === false && isAuth) ||
          (item.authRequired === true && !isAuth)
        ) {
          return null;
        }
        return (
          <Link href={item.href} key={item.href} className={className}>
            {item.title}
          </Link>
        );
      })}
    </>
  );
}

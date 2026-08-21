"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { clearAdmin2FA } from "@/actions/admin";

export default function Clear2faOnLeave() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && !pathname.startsWith('/admin')) {
      clearAdmin2FA();
    }
  }, [pathname]);

  return null;
}

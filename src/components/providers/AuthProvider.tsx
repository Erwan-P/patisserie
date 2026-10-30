"use client";

import { SessionProvider } from "next-auth/react";
import { MotionConfig } from "framer-motion";

export function AuthProvider({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return <SessionProvider><MotionConfig nonce={nonce}>{children}</MotionConfig></SessionProvider>;
}

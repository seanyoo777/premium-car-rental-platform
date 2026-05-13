"use client";

import { DemoDataProvider } from "@/context/demo-data-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <DemoDataProvider>{children}</DemoDataProvider>;
}

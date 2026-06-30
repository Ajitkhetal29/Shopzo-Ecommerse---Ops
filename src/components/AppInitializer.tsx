"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { initializeApp } from "@/services/appInit";

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Skip initialization on login page
    if (pathname === "/login") {
      setIsInitialized(true);
      return;
    }

    const init = async () => {
      await initializeApp();
      setIsInitialized(true);
    };


    init();
  }, [pathname]);

  // Show loading only on first mount (not on login page)
  if (!isInitialized && pathname !== "/login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shop-surface">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-shop-accent border-t-transparent" />
          <p className="text-base font-medium text-shop-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { Provider } from "react-redux";
import { ThemeProvider } from "@/app/components/theme-provider";
import { store } from "@/store";
import AppInitializer from "@/components/AppInitializer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <AppInitializer>{children}</AppInitializer>
      </Provider>
    </ThemeProvider>
  );
}

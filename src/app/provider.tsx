"use client";

import axios from "axios";
import { Provider } from "react-redux";
import { ThemeProvider } from "@/app/components/theme-provider";
import { store } from "@/store";
import AppInitializer from "@/components/AppInitializer";

axios.defaults.headers.common["X-Shopzo-Panel"] = "ops";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <AppInitializer>{children}</AppInitializer>
      </Provider>
    </ThemeProvider>
  );
}

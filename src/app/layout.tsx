import type { Metadata } from "next";
import ThemeInit from "./components/ThemeInit";
import AppChrome from "./components/AppChrome";
import Providers from "./provider";
import "./globals.css";


export const metadata: Metadata = {
  title: "Shopzo Ops",
  description: "Shopzo operations dashboard",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
      <ThemeInit />
      <Providers>
        <AppChrome>{children}</AppChrome>
      </Providers>


      </body>
    </html>
  );
}

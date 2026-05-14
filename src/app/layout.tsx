import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business CMD Dashboard",
  description: "A personal business command dashboard for clear execution.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

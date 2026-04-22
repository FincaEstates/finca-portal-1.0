import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FINCA Portal",
  description: "Admin and tenant property operations portal.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

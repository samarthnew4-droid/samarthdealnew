import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAMARTH DEALS",
  description: "SAMARTH DEALS curated product offers and deals.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

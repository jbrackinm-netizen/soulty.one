import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoulT AI Council",
  description: "Council dashboard — projects, documents, Q&A, meetings, and tasks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soulty One — Structural Editor",
  description: "Soulty modular structural building platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

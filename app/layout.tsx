import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const taglineSerif = Newsreader({
  variable: "--font-tagline-serif",
  subsets: ["latin"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: "World Time Lab | Meridian",
  description: "Learn the world's time zones, one clock at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${taglineSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NavBar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}

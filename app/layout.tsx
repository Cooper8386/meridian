import type { Metadata } from "next";
import { Encode_Sans_Expanded, Inter_Tight, JetBrains_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-neutral-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono-numeric",
  subsets: ["latin"],
});

const displayExpanded = Encode_Sans_Expanded({
  variable: "--font-display-expanded",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meridian",
  description: "Learn the world's time zones, one clock at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${jetBrainsMono.variable} ${displayExpanded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <NavBar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "brandonbybran",
    template: "%s | brandonbybran",
  },
  description: "brandonbybran — sitio personal y proyectos",
  keywords: ["brandonbybran"],
  authors: [{ name: "brandonbybran" }],
  creator: "brandonbybran",
  openGraph: {
    title: "brandonbybran",
    description: "brandonbybran — sitio personal y proyectos",
    siteName: "brandonbybran",
  },
  twitter: {
    card: "summary",
    title: "brandonbybran",
    description: "brandonbybran — sitio personal y proyectos",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
      <Analytics />
      <SpeedInsights />
    </html>
  );
}

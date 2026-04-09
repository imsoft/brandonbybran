import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

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
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ThemeToggle />
          {children}
        </ThemeProvider>
      </body>
      <Analytics />
      <SpeedInsights />
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  metadataBase: new URL("https://brandonbybran.com"),
  title: {
    default: "brandonbybran",
    template: "%s | brandonbybran",
  },
  description: "brandonbybran — sitio personal y proyectos",
  authors: [{ name: "brandonbybran" }],
  creator: "brandonbybran",
  openGraph: {
    title: "brandonbybran",
    description: "brandonbybran — sitio personal y proyectos",
    siteName: "brandonbybran",
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "brandonbybran",
    description: "brandonbybran — sitio personal y proyectos",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
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

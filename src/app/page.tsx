import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  description:
    "Creador de contenido y desarrollo web. Minijuegos: Clicker, Ping Pong y Laser Terror — brandonbybran.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "brandonbybran",
    description:
      "Creador de contenido y desarrollo web. Minijuegos: Clicker, Ping Pong y Laser Terror.",
    url: "/",
  },
  twitter: {
    title: "brandonbybran",
    description:
      "Creador de contenido y desarrollo web. Minijuegos: Clicker, Ping Pong y Laser Terror.",
  },
};

const links = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/brandonbybran/",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@brandonbybran",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@brandonbybran",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  },
];

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "brandonbybran",
    url: "https://brandonbybran.com",
    sameAs: [
      "https://www.instagram.com/brandonbybran/",
      "https://www.youtube.com/@brandonbybran",
      "https://www.tiktok.com/@brandonbybran"
    ],
    jobTitle: "Content Creator & Developer",
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex w-full max-w-md flex-col items-center gap-12 px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          @brandonbybran
        </h1>

        <nav className="flex w-full flex-row justify-center gap-3" aria-label="Redes sociales">
          {links.map(({ name, href, icon }) => (
            <Button
              key={name}
              asChild
              variant="outline"
              size="lg"
              className="h-14 w-14 rounded-xl p-0"
            >
              <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              title={name}
              >
                {icon}
              </a>
            </Button>
          ))}
        </nav>

        <Card className="w-full rounded-xl">
          <CardContent className="flex flex-row gap-3 pt-4">
            <Button asChild variant="outline" size="lg" className="h-auto flex-1 flex-col gap-1.5 rounded-xl py-4">
              <Link href="/clicker">
                <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                </svg>
                <span className="text-sm font-medium">Clicker</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto flex-1 flex-col gap-1.5 rounded-xl py-4">
              <Link href="/pingpong">
                <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="2" y="8" width="3" height="8" rx="1" />
                  <rect x="19" y="8" width="3" height="8" rx="1" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                <span className="text-sm font-medium">Ping Pong</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto flex-1 flex-col gap-1.5 rounded-xl py-4">
              <Link href="/laser">
                <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="6" cy="12" r="3" />
                  <line x1="9" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="19" y1="9" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="19" y1="15" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="text-sm font-medium">Laser Terror</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

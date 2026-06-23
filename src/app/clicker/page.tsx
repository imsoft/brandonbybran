import type { Metadata } from "next";
import { ClickerGame } from "./clicker-game";

export const metadata: Metadata = {
  title: "Clicker",
  description:
    "Mini clicker con mejoras automáticas y tienda. Ideas: juego @DarkatterDash, tienda @JDFURYEX.",
  alternates: { canonical: "/clicker" },
  openGraph: {
    title: "Clicker",
    description:
      "Mini clicker con mejoras automáticas y tienda. Ideas: @DarkatterDash (juego), @JDFURYEX (tienda).",
    url: "/clicker",
  },
  twitter: {
    title: "Clicker",
    description:
      "Mini clicker con mejoras automáticas y tienda. Ideas: @DarkatterDash (juego), @JDFURYEX (tienda).",
  },
};

export default function ClickerPage() {
  return <ClickerGame />;
}

import type { Metadata } from "next";
import { LaserGame } from "./laser-game";

export const metadata: Metadata = {
  title: "Laser Terror",
  description:
    "Survival con láser y salida por kills. Idea del juego: @rukieleven — youtube.com/@rukieleven.",
  alternates: { canonical: "/laser" },
  openGraph: {
    title: "Laser Terror",
    description:
      "Survival con láser y salida bloqueada hasta cumplir kills. Idea: @rukieleven.",
    url: "/laser",
  },
  twitter: {
    title: "Laser Terror",
    description:
      "Survival con láser y salida bloqueada hasta cumplir kills. Idea: @rukieleven.",
  },
};

export default function LaserPage() {
  return <LaserGame />;
}

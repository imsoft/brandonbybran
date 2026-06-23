import type { Metadata } from "next";
import PingPongGame from "./pingpong-game";

export const metadata: Metadata = {
  title: "Ping Pong",
  description:
    "Ping Pong local dos jugadores en el navegador. Idea: @brandonbybran.",
  alternates: { canonical: "/pingpong" },
  openGraph: {
    title: "Ping Pong",
    description:
      "Ping Pong local dos jugadores. Idea del juego: @brandonbybran.",
    url: "/pingpong",
  },
  twitter: {
    title: "Ping Pong",
    description:
      "Ping Pong local dos jugadores. Idea del juego: @brandonbybran.",
  },
};

export default function PingPongPage() {
  return <PingPongGame />;
}

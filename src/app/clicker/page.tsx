import type { Metadata } from "next";
import { ClickerGame } from "./clicker-game";

export const metadata: Metadata = {
  title: "Clicker",
  description: "Mini clicker de la comunidad brandonbybran",
};

export default function ClickerPage() {
  return <ClickerGame />;
}

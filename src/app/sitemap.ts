import type { MetadataRoute } from "next";

const baseUrl = "https://brandonbybran.com";

type Freq = NonNullable<MetadataRoute.Sitemap[0]["changeFrequency"]>;

const routes: { path: string; priority: number; changeFrequency: Freq }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/clicker", priority: 0.8, changeFrequency: "monthly" },
  { path: "/laser", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pingpong", priority: 0.8, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority, changeFrequency }) => ({
    url: path ? `${baseUrl}${path}` : baseUrl,
    changeFrequency,
    priority,
  }));
}

import { MetadataRoute } from "next";
import { archivePage } from "@/lib/flags";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.localcitywalks.com";

  // Define your main routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // Only expose /explore to crawlers when the archive feature is enabled.
  const exploreEnabled = await archivePage();
  if (exploreEnabled) {
    routes.push({
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  return routes;
}

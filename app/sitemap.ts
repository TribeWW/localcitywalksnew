import { MetadataRoute } from "next";
import { archivePage } from "@/lib/flags";

/**
 * Build the sitemap entries for https://www.localcitywalks.com, conditionally including the /explore route when the archive feature is enabled.
 *
 * @returns The sitemap as a MetadataRoute.Sitemap — an array of entries each with `url`, `lastModified`, `changeFrequency`, and `priority`. Includes an `/explore` entry when the archive feature is enabled.
 */
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

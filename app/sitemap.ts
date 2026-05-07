import { MetadataRoute } from "next";

/**
 * Build the sitemap entries for https://www.localcitywalks.com.
 *
 * @returns The sitemap as a MetadataRoute.Sitemap — an array of entries each with `url`, `lastModified`, `changeFrequency`, and `priority`.
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
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  return routes;
}

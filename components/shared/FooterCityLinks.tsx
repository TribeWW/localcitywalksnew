import { getFooterCityLinkItems } from "@/lib/footer-city-links";
import { FooterCityLinksView } from "./FooterCityLinksView";

export { FooterCityLinksView } from "./FooterCityLinksView";

export default async function FooterCityLinks() {
  const items = await getFooterCityLinkItems();
  return <FooterCityLinksView items={items} />;
}

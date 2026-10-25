import { type SchemaTypeDefinition } from "sanity";
import { city } from "./city";
import { country } from "./country";
import { faqItem } from "./faqItem";
import { homeSpotlight } from "./homeSpotlight";
import { page } from "./page";
import { promoBanner } from "./promoBanner";
import { region } from "./region";
import { review } from "./review";
import { tourSeoMetadata } from "./tourSeoMetaData";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    city,
    country,
    faqItem,
    homeSpotlight,
    page,
    promoBanner,
    region,
    review,
    tourSeoMetadata,
  ],
};

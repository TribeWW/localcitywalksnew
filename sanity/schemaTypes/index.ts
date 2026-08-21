import { type SchemaTypeDefinition } from "sanity";
import { city } from "./city";
import { country } from "./country";
import { faqItem } from "./faqItem";
import { homeSpotlight } from "./homeSpotlight";
import { promoBanner } from "./promoBanner";
import { review } from "./review";
import { tourSeoMetadata } from "./tourSeoMetaData";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    city,
    country,
    faqItem,
    homeSpotlight,
    promoBanner,
    review,
    tourSeoMetadata,
  ],
};

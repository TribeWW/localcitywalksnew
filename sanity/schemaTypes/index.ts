import { type SchemaTypeDefinition } from "sanity";
import { city } from "./city";
import { country } from "./country";
import { homeSpotlight } from "./homeSpotlight";
import { review } from "./review";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [city, country, homeSpotlight, review],
};

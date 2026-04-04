import { type SchemaTypeDefinition } from "sanity";
import { city } from "./city";
import { country } from "./country";
import { review } from "./review";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [city, country, review],
};

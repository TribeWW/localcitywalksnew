import { type SchemaTypeDefinition } from "sanity";
import { city } from "./city";
import { country } from "./country";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [city, country],
};

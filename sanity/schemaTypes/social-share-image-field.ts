/**
 * Shared Social Share Image field for Sanity SEO sections.
 */

import { defineField } from "sanity";
import type { FieldDefinition, ImageValue, ValidationContext } from "sanity";
import { apiVersion } from "../env";
import { PAGE_SEO_FIELDSET_NAME } from "./page-seo-fields.helpers";
import {
  validateSocialShareImageAlt,
  validateSocialShareImageSize,
} from "./social-share-image-field.helpers";

type DefineSocialShareImageFieldOptions = {
  /** When true, assigns the field to the shared SEO fieldset. */
  useFieldset?: boolean;
};

async function fetchAssetDimensions(
  context: ValidationContext,
  assetRef: string,
): Promise<{ width?: number; height?: number } | null> {
  const client = context.getClient({ apiVersion });
  return client.fetch(`*[_id == $id][0].metadata.dimensions{width, height}`, {
    id: assetRef,
  });
}

/**
 * Builds the Social Share Image field (hotspot + alt, with size/alt warnings).
 */
export function defineSocialShareImageField(
  options?: DefineSocialShareImageFieldOptions,
): FieldDefinition {
  const useFieldset = options?.useFieldset ?? true;

  return defineField({
    name: "socialShareImage",
    title: "Social Share Image",
    type: "image",
    ...(useFieldset ? { fieldset: PAGE_SEO_FIELDSET_NAME } : {}),
    description: "Image for social media previews (recommended 1200×630 px).",
    options: {
      hotspot: true,
    },
    fields: [
      defineField({
        name: "alt",
        title: "Alt text",
        type: "string",
        description: "Short description of the image.",
        validation: (rule) =>
          rule
            .custom((alt, context) => {
              const parent = context.parent as
                | { asset?: { _ref?: string } }
                | undefined;
              const hasImageAsset = Boolean(parent?.asset?._ref);
              return validateSocialShareImageAlt(alt, hasImageAsset);
            })
            .warning(),
      }),
    ],
    validation: (rule) =>
      rule
        .custom(async (value, context) => {
          const image = value as ImageValue | undefined;
          const assetRef = image?.asset?._ref;
          if (!assetRef) return true;

          const dimensions = await fetchAssetDimensions(context, assetRef);
          return validateSocialShareImageSize(dimensions);
        })
        .warning(),
  });
}

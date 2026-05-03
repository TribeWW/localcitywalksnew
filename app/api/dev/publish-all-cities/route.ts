import { buildPublishedCityPayloadFromDraft } from "@/lib/dev/publish-city-draft-helpers";
import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

/**
 * Dev / ops: publish every `city` document that currently exists only as a draft
 * (`drafts.*`). Copies content to the published id, then removes the draft.
 *
 * GET /api/dev/publish-all-cities?confirm=yes
 * Requires SANITY_WRITE_TOKEN (same as other write routes).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("confirm") !== "yes") {
    return NextResponse.json(
      {
        error:
          "Add ?confirm=yes to confirm publishing all draft city documents.",
      },
      { status: 400 },
    );
  }

  try {
    const drafts = await writeClient.fetch<
      Array<{
        _id: string;
        _type: string;
        _rev?: string;
        _createdAt?: string;
        _updatedAt?: string;
        [key: string]: unknown;
      }>
    >(
      `*[_type == "city" && _id in path("drafts.**")]`,
      {},
      { perspective: "raw", next: { revalidate: 0 } },
    );

    if (drafts.length === 0) {
      return NextResponse.json({
        success: true,
        published: 0,
        message: "No draft city documents to publish.",
      });
    }

    const publishedIds: string[] = [];
    const errors: string[] = [];
    const BATCH = 25;

    for (let i = 0; i < drafts.length; i += BATCH) {
      const batch = drafts.slice(i, i + BATCH);
      const tx = writeClient.transaction();
      const batchPublishedIds: string[] = [];

      for (const doc of batch) {
        const built = buildPublishedCityPayloadFromDraft(doc);
        if (!built.ok) {
          errors.push(`skip invalid _id: ${doc._id}`);
          continue;
        }

        tx.createOrReplace(
          built.payload as { _id: string; _type: "city"; [key: string]: unknown },
        );
        tx.delete(built.draftId);
        batchPublishedIds.push(built.publishedId);
      }

      if (batchPublishedIds.length === 0) {
        continue;
      }

      try {
        await tx.commit();
        publishedIds.push(...batchPublishedIds);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown batch commit error";
        errors.push(`batch ${Math.floor(i / BATCH) + 1}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      published: publishedIds.length,
      ids: publishedIds,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("[publish-all-cities]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

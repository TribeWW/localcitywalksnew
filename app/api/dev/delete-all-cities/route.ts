import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

/**
 * Dev-only: delete all city documents from Sanity (draft and published).
 * GET /api/dev/delete-all-cities?confirm=yes
 * Requires ?confirm=yes to avoid accidental calls.
 * Uses write client + perspective 'raw' so drafts are included (read client only returns published).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("confirm") !== "yes") {
    return NextResponse.json(
      { error: "Add ?confirm=yes to confirm deletion of all city documents." },
      { status: 400 }
    );
  }

  try {
    const ids = await writeClient.fetch<string[]>(
      `*[_type == "city"]._id`,
      {},
      { perspective: "raw", next: { revalidate: 0 } }
    );

    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: "No city documents to delete.",
      });
    }

    const transaction = writeClient.transaction();
    for (const id of ids) {
      transaction.delete(id);
    }
    await transaction.commit();

    return NextResponse.json({
      success: true,
      deleted: ids.length,
      ids,
    });
  } catch (error) {
    console.error("[delete-all-cities]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

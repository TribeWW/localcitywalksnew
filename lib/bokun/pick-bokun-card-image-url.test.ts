import { describe, expect, it } from "vitest";
import { pickBokunCardImageUrl } from "@/lib/bokun/pick-bokun-card-image-url";

describe("pickBokunCardImageUrl", () => {
  it("prefers large derived images and upsizes for sharper cards", () => {
    const url = pickBokunCardImageUrl({
      derived: [
        {
          name: "preview",
          url: "https://imgcdn.bokun.tools/example.jpg?w=300&h=300",
        },
        {
          name: "large",
          url: "https://imgcdn.bokun.tools/example.jpg?w=660&h=660",
        },
      ],
    });

    expect(url).toBe("https://imgcdn.bokun.tools/example.jpg?w=960&h=960");
  });
});

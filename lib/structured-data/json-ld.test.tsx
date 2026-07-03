/**
 * structured-data/json-ld — unit tests for the JsonLd script component.
 */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd } from "@/lib/structured-data/json-ld";

describe("JsonLd", () => {
  it("renders a script tag with serialized JSON-LD", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "LocalCityWalks",
    };

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).not.toBeNull();
    expect(script?.textContent).toBe(JSON.stringify(data));
  });

  it("serializes an array of schema objects", () => {
    const data = [
      { "@context": "https://schema.org", "@type": "Organization", name: "A" },
      { "@context": "https://schema.org", "@type": "WebSite", name: "B" },
    ];

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script?.textContent).toBe(JSON.stringify(data));
  });
});

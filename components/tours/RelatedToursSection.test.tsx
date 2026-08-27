/**
 * RelatedToursView — presentational related-tours section tests.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tours/related-tours/get-related-tours", () => ({
  getRelatedTours: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { RelatedToursView } from "@/components/tours/RelatedToursSection";
import type { CityCardData } from "@/types/bokun";

function card(
  partial: Pick<CityCardData, "id" | "title"> &
    Partial<Omit<CityCardData, "id" | "title">>,
): CityCardData {
  return {
    image: "/img.jpg",
    ...partial,
  };
}

const FOUR_CARDS: CityCardData[] = [
  card({
    id: "1",
    title: "Aix Walk",
    citySlug: "aix-en-provence",
    slug: "aix-walk-1",
    cityName: "Aix-en-Provence",
  }),
  card({
    id: "2",
    title: "Arles Walk",
    citySlug: "arles",
    slug: "arles-walk-2",
    cityName: "Arles",
  }),
  card({
    id: "4",
    title: "Avignon Story",
    citySlug: "avignon",
    slug: "avignon-story-4",
    cityName: "Avignon",
  }),
  card({
    id: "5",
    title: "Bordeaux Walk",
    citySlug: "bordeaux",
    slug: "bordeaux-walk-5",
    cityName: "Bordeaux",
  }),
];

describe("RelatedToursView", () => {
  it("renders the heading and four tour links", () => {
    render(
      <RelatedToursView
        heading="Explore more of Provence"
        cards={FOUR_CARDS}
        cardsWidgetUpdate={false}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Explore more of Provence",
      }),
    ).toHaveAttribute("id", "related-tours-heading");

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAttribute("href", "/tours/aix-en-provence/aix-walk-1");
    expect(links[1]).toHaveAttribute("href", "/tours/arles/arles-walk-2");
    expect(links[2]).toHaveAttribute("href", "/tours/avignon/avignon-story-4");
    expect(links[3]).toHaveAttribute("href", "/tours/bordeaux/bordeaux-walk-5");

    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-labelledby",
      "related-tours-heading",
    );
  });

  it("returns null when cards are empty", () => {
    const { container } = render(
      <RelatedToursView
        heading="Explore more of Provence"
        cards={[]}
        cardsWidgetUpdate={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("passes cardsWidgetUpdate through to CityCard", () => {
    const { container } = render(
      <RelatedToursView
        heading="Popular with other travellers"
        cards={FOUR_CARDS.slice(0, 1)}
        cardsWidgetUpdate={true}
      />,
    );

    expect(
      container.querySelector('[data-cards-widget-update="true"]'),
    ).toBeInTheDocument();
  });
});

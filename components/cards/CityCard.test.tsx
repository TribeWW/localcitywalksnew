/**
 * CityCard — flag-driven listing prices (LOC-1053).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CityCard from "@/components/cards/CityCard";
import type { CityCardData } from "@/types/bokun";

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

const baseCity: CityCardData = {
  id: "1079932",
  title: "Hello Toledo: Private 2-Hour Intro City Walk with Local Guide",
  cityName: "Toledo",
  image: "/placeholder-city.jpg",
  slug: "hello-toledo-1079932",
  citySlug: "toledo",
};

describe("CityCard", () => {
  it("shows legacy layout without From price when flag is off", () => {
    render(
      <CityCard
        cities={[
          {
            ...baseCity,
            displayPricePerPerson: 124,
            displayPriceCurrency: "EUR",
          },
        ]}
        cardsWidgetUpdate={false}
      />,
    );

    expect(
      screen.getByText("Hello Toledo: Private 2-Hour Intro City Walk with Local Guide"),
    ).toBeInTheDocument();
    expect(screen.getByText("Private tour")).toBeInTheDocument();
    expect(screen.queryByText(/From/i)).not.toBeInTheDocument();
  });

  it("shows From price on minimal card when flag is on and enrichment succeeded", () => {
    render(
      <CityCard
        cities={[
          {
            ...baseCity,
            displayPricePerPerson: 124,
            displayPriceCurrency: "EUR",
          },
        ]}
        cardsWidgetUpdate
      />,
    );

    expect(
      screen.getByText("Hello Toledo: Private 2-Hour Intro City Walk with Local Guide"),
    ).toBeInTheDocument();
    expect(screen.getByText(/From/i)).toBeInTheDocument();
    expect(screen.getByText("€124")).toBeInTheDocument();
    expect(screen.getByText(/\/ adult/i)).toBeInTheDocument();
  });

  it("falls back to Private tour when flag is on but price enrichment is missing", () => {
    render(<CityCard cities={[baseCity]} cardsWidgetUpdate />);

    expect(screen.getByText("Private tour")).toBeInTheDocument();
    expect(screen.queryByText(/From/i)).not.toBeInTheDocument();
  });
});

/**
 * TourImageGallery: lightbox opens on the clicked photo (scroll strip sync).
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TourImageGallery from "@/components/tours/tour-image-gallery";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

const images = [
  "/photo-1.jpg",
  "/photo-2.jpg",
  "/photo-3.jpg",
  "/photo-4.jpg",
  "/photo-5.jpg",
  "/photo-6.jpg",
  "/photo-7.jpg",
];

const bokunImages = [
  "https://imgcdn.bokun.tools/a.jpg?w=660&h=660",
  "https://imgcdn.bokun.tools/b.jpg?w=660&h=660",
  "https://imgcdn.bokun.tools/c.jpg?w=660&h=660",
  "https://imgcdn.bokun.tools/d.jpg?w=660&h=660",
  "https://imgcdn.bokun.tools/e.jpg?w=660&h=660",
];

describe("TourImageGallery lightbox open index", () => {
  const trackWidth = 800;
  let scrollToMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollToMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return trackWidth;
      },
    });
    HTMLElement.prototype.scrollTo = scrollToMock;
    HTMLElement.prototype.scrollBy = scrollToMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scrolls the snap strip to the clicked photo on open (instant)", async () => {
    render(<TourImageGallery images={images} title="Mulhouse walk" />);

    fireEvent.click(screen.getByLabelText("Open image 3 fullscreen"));

    await waitFor(() => {
      expect(screen.getByText("3 / 7")).toBeTruthy();
    });

    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalledWith({
        left: 2 * trackWidth,
        behavior: "instant",
      });
    });
  });

  it("opens photo 4 from the extra photos badge", async () => {
    render(<TourImageGallery images={images} title="Mulhouse walk" />);

    fireEvent.click(
      screen.getByLabelText(
        "Open gallery fullscreen, 3 more photos not shown in preview",
      ),
    );

    await waitFor(() => {
      expect(screen.getByText("4 / 7")).toBeTruthy();
    });
  });

  it("advances one photo on next after opening mid gallery", async () => {
    render(<TourImageGallery images={images} title="Mulhouse walk" />);

    fireEvent.click(screen.getByLabelText("Open image 3 fullscreen"));
    await waitFor(() => {
      expect(screen.getByText("3 / 7")).toBeTruthy();
    });

    scrollToMock.mockClear();
    fireEvent.click(screen.getByLabelText("Next image"));

    await waitFor(() => {
      expect(screen.getByText("4 / 7")).toBeTruthy();
    });
    expect(scrollToMock).toHaveBeenCalledWith({
      left: 3 * trackWidth,
      behavior: "smooth",
    });
  });

  it("keeps the target counter during smooth next while scroll is still mid move", async () => {
    render(<TourImageGallery images={images} title="Mulhouse walk" />);

    fireEvent.click(screen.getByLabelText("Open image 3 fullscreen"));
    await waitFor(() => {
      expect(screen.getByText("3 / 7")).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText("Next image"));
    await waitFor(() => {
      expect(screen.getByText("4 / 7")).toBeTruthy();
    });

    const track = document.querySelector(".snap-x");
    expect(track).toBeTruthy();

    Object.defineProperty(track as HTMLElement, "scrollLeft", {
      configurable: true,
      value: 2 * trackWidth,
    });
    fireEvent.scroll(track as Element);

    expect(screen.getByText("4 / 7")).toBeTruthy();
    expect(screen.queryByText("3 / 7")).toBeNull();
  });

  it("wraps from last to first with an instant strip jump", async () => {
    render(<TourImageGallery images={images} title="Mulhouse walk" />);

    fireEvent.click(screen.getByLabelText("Open image 3 fullscreen"));
    await waitFor(() => {
      expect(screen.getByText("3 / 7")).toBeTruthy();
    });

    // Jump to last via thumbnail, then next wraps.
    fireEvent.click(screen.getByLabelText("Go to image 7"));
    await waitFor(() => {
      expect(screen.getByText("7 / 7")).toBeTruthy();
    });

    scrollToMock.mockClear();
    fireEvent.click(screen.getByLabelText("Next image"));

    await waitFor(() => {
      expect(screen.getByText("1 / 7")).toBeTruthy();
    });
    expect(scrollToMock).toHaveBeenCalledWith({
      left: 0,
      behavior: "instant",
    });
  });

  it("jumps instantly when a far thumbnail is clicked", async () => {
    render(<TourImageGallery images={images} title="Mulhouse walk" />);

    fireEvent.click(screen.getByLabelText("Open image 3 fullscreen"));
    await waitFor(() => {
      expect(screen.getByText("3 / 7")).toBeTruthy();
    });

    scrollToMock.mockClear();
    fireEvent.click(screen.getByLabelText("Go to image 7"));

    await waitFor(() => {
      expect(screen.getByText("7 / 7")).toBeTruthy();
    });
    expect(scrollToMock).toHaveBeenCalledWith({
      left: 6 * trackWidth,
      behavior: "instant",
    });
  });

  it("keeps a failed photo in the count and does not remove its URL", async () => {
    render(<TourImageGallery images={images} title="Mulhouse walk" />);

    fireEvent.click(screen.getByLabelText("Open image 3 fullscreen"));
    await waitFor(() => {
      expect(screen.getByText("3 / 7")).toBeTruthy();
    });

    const mainPhoto = screen
      .getAllByAltText("Mulhouse walk image 3")
      .find((node) => node.hasAttribute("data-photo-chrome"));
    expect(mainPhoto).toBeTruthy();
    fireEvent.error(mainPhoto as HTMLElement);

    expect(screen.getByText("3 / 7")).toBeTruthy();
    expect(screen.getByLabelText("Go to image 3")).toBeTruthy();
  });

  it("does not set the booking stacked overlay marker", async () => {
    render(<TourImageGallery images={images} title="Mulhouse walk" />);

    fireEvent.click(screen.getByLabelText("Open image 3 fullscreen"));
    await waitFor(() => {
      expect(screen.getByText("3 / 7")).toBeTruthy();
    });

    expect(
      document.querySelector("[data-booking-stacked-overlay]"),
    ).toBeNull();
    expect(screen.getByLabelText("Close photos")).toBeTruthy();
    expect(screen.getByText("Tour photos")).toBeTruthy();
  });

  it("loads small Bókun addresses on desktop thumbnails", async () => {
    render(<TourImageGallery images={bokunImages} title="Mulhouse walk" />);

    fireEvent.click(screen.getByLabelText("Open image 3 fullscreen"));
    await waitFor(() => {
      expect(screen.getByText("3 / 5")).toBeTruthy();
    });

    const thumb = document.querySelector(
      'img[src*="w=160"][src*="h=112"]',
    ) as HTMLImageElement | null;
    expect(thumb).toBeTruthy();
    expect(thumb?.src).toContain("imgcdn.bokun.tools");
  });

  it("scrolls the overflowing thumbnail row after openAt", async () => {
    const scrollByMock = vi.fn();
    HTMLElement.prototype.scrollBy = scrollByMock;

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const label = this.getAttribute("aria-label") ?? "";
        const thumbMatch = label.match(/^Go to image (\d+)$/);
        if (thumbMatch) {
          const index = Number(thumbMatch[1]) - 1;
          const left = index * 88;
          return {
            x: left,
            y: 0,
            left,
            top: 0,
            width: 80,
            height: 56,
            right: left + 80,
            bottom: 56,
            toJSON() {
              return {};
            },
          } as DOMRect;
        }

        if (
          this.classList.contains("gap-2") &&
          this.classList.contains("overflow-x-auto")
        ) {
          return {
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            width: 200,
            height: 56,
            right: 200,
            bottom: 56,
            toJSON() {
              return {};
            },
          } as DOMRect;
        }

        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          right: 0,
          bottom: 0,
          toJSON() {
            return {};
          },
        } as DOMRect;
      },
    );

    render(<TourImageGallery images={images} title="Mulhouse walk" />);

    fireEvent.click(screen.getByLabelText("Open image 3 fullscreen"));

    await waitFor(() => {
      expect(screen.getByText("3 / 7")).toBeTruthy();
    });

    await waitFor(() => {
      expect(scrollByMock).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: "instant",
          left: expect.any(Number),
        }),
      );
    });

    const thumbCentreCall = scrollByMock.mock.calls.find(
      (call) =>
        call[0]?.behavior === "instant" && typeof call[0]?.left === "number",
    );
    expect(thumbCentreCall?.[0].left).not.toBe(0);
  });
});

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
});

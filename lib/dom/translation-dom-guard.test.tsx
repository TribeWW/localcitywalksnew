import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { installTranslationDomGuard } from "@/lib/dom/translation-dom-guard";

const originalRemoveChild = Node.prototype.removeChild;

function restoreNodePrototype() {
  Node.prototype.removeChild = originalRemoveChild;
  delete (Node.prototype as unknown as Record<symbol, unknown>)[
    Symbol.for("lcw.translationDomGuard")
  ];
}

function ToursFound({ loading }: { loading: boolean }) {
  return <p data-testid="label">{loading ? "Loading" : null} tours found</p>;
}

/** Mimic Chrome translation: swap each text node for a `<font>` wrapper. */
function translateTextNodes(element: HTMLElement) {
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const font = document.createElement("font");
    font.textContent = `[de] ${node.textContent}`;
    element.replaceChild(font, node);
  }
}

function renderTranslatedAndRemoveText() {
  const { getByTestId, rerender } = render(<ToursFound loading />);
  translateTextNodes(getByTestId("label"));
  act(() => {
    rerender(<ToursFound loading={false} />);
  });
}

describe("installTranslationDomGuard", () => {
  afterEach(() => {
    restoreNodePrototype();
    vi.restoreAllMocks();
  });

  it("reproduces the removeChild NotFoundError without the guard", () => {
    expect(renderTranslatedAndRemoveText).toThrow(/not a child/i);
  });

  it("lets React remove a translated text node without throwing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    installTranslationDomGuard();

    expect(renderTranslatedAndRemoveText).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("still removes nodes that are real children", () => {
    installTranslationDomGuard();
    const parent = document.createElement("div");
    const child = parent.appendChild(document.createElement("span"));

    expect(parent.removeChild(child)).toBe(child);
    expect(parent.childNodes).toHaveLength(0);
  });

  it("patches the prototype only once", () => {
    installTranslationDomGuard();
    const patched = Node.prototype.removeChild;
    installTranslationDomGuard();

    expect(Node.prototype.removeChild).toBe(patched);
  });
});

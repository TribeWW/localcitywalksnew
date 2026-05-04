import { describe, expect, it, vi } from "vitest";

// Mock the external flag SDK modules before importing flags
vi.mock("@flags-sdk/vercel", () => ({
  vercelAdapter: vi.fn(() => ({ type: "vercel" })),
}));

vi.mock("flags/next", () => ({
  flag: vi.fn((config: Record<string, unknown>) => {
    // Return a callable that returns the default value, and expose the config
    const fn = Object.assign(
      async () => config.defaultValue,
      { flagConfig: config },
    );
    return fn;
  }),
}));

describe("lib/flags", () => {
  it("exports archivePage flag", async () => {
    const flagsModule = await import("./flags");
    expect(flagsModule.archivePage).toBeDefined();
    expect(typeof flagsModule.archivePage).toBe("function");
  });

  it("does NOT export a reviews flag", async () => {
    const flagsModule = await import("./flags");
    expect((flagsModule as Record<string, unknown>).reviews).toBeUndefined();
  });

  it("archivePage flag has key 'archive-page'", async () => {
    const { flag } = await import("flags/next");
    const { archivePage } = await import("./flags");
    void archivePage;

    const flagMock = vi.mocked(flag);
    const callArg = flagMock.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;
    expect(callArg?.key).toBe("archive-page");
  });

  it("archivePage flag has defaultValue of false", async () => {
    const { flag } = await import("flags/next");
    const { archivePage } = await import("./flags");
    void archivePage;

    const flagMock = vi.mocked(flag);
    const callArg = flagMock.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;
    expect(callArg?.defaultValue).toBe(false);
  });

  it("archivePage flag has two options: Off and On", async () => {
    const { flag } = await import("flags/next");
    const { archivePage } = await import("./flags");
    void archivePage;

    const flagMock = vi.mocked(flag);
    const callArg = flagMock.mock.calls[0]?.[0] as
      | { options?: Array<{ value: boolean; label: string }> }
      | undefined;
    expect(callArg?.options).toHaveLength(2);
    expect(callArg?.options?.[0]).toEqual({ value: false, label: "Off" });
    expect(callArg?.options?.[1]).toEqual({ value: true, label: "On" });
  });

  it("archivePage flag uses vercelAdapter", async () => {
    const { vercelAdapter } = await import("@flags-sdk/vercel");
    const { archivePage } = await import("./flags");
    void archivePage;

    expect(vi.mocked(vercelAdapter)).toHaveBeenCalled();
  });
});
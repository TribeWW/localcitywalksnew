import { afterEach, describe, expect, it, vi } from "vitest";

const PostHog = vi.hoisted(() =>
  vi.fn(function MockPostHog() {
    return { capture: vi.fn(), flush: vi.fn() };
  }),
);

vi.mock("posthog-node", () => ({
  PostHog,
}));

async function loadGetPostHogClient() {
  vi.resetModules();
  const posthogServer = await import("./posthog-server");
  return posthogServer.getPostHogClient;
}

describe("getPostHogClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    PostHog.mockClear();
  });

  it("returns and caches null in development when PostHog env is missing", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    const getPostHogClient = await loadGetPostHogClient();

    expect(getPostHogClient()).toBeNull();

    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");

    expect(getPostHogClient()).toBeNull();
    expect(PostHog).not.toHaveBeenCalled();
  });

  it("returns and caches null outside development when the host is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    const getPostHogClient = await loadGetPostHogClient();

    expect(getPostHogClient()).toBeNull();
    expect(getPostHogClient()).toBeNull();
    expect(PostHog).not.toHaveBeenCalled();
  });

  it("creates and caches a client when the token and host are configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");
    const getPostHogClient = await loadGetPostHogClient();

    const first = getPostHogClient();
    const second = getPostHogClient();

    expect(first).toBe(second);
    expect(first).not.toBeNull();
    expect(PostHog).toHaveBeenCalledOnce();
    expect(PostHog).toHaveBeenCalledWith("phc_test", {
      host: "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
      enableExceptionAutocapture: true,
    });
  });
});

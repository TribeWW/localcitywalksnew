import { afterEach, describe, expect, it, vi } from "vitest";

const { setGlobalLoggerProvider, LoggerProvider } = vi.hoisted(() => ({
  setGlobalLoggerProvider: vi.fn(),
  LoggerProvider: vi.fn(function MockLoggerProvider() {
    return { forceFlush: vi.fn() };
  }),
}));

vi.mock("@opentelemetry/api-logs", () => ({
  logs: {
    getLogger: () => ({ emit: vi.fn() }),
    setGlobalLoggerProvider,
  },
}));

vi.mock("@opentelemetry/exporter-logs-otlp-http", () => ({
  OTLPLogExporter: vi.fn(function MockOTLPLogExporter() {}),
}));

vi.mock("@opentelemetry/resources", () => ({
  resourceFromAttributes: vi.fn(() => ({})),
}));

vi.mock("@opentelemetry/sdk-logs", () => ({
  BatchLogRecordProcessor: vi.fn(function MockBatchLogRecordProcessor() {}),
  LoggerProvider,
}));

async function loadRegister() {
  vi.resetModules();
  const instrumentation = await import("./instrumentation");
  return instrumentation.register;
}

describe("register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    setGlobalLoggerProvider.mockReset();
    LoggerProvider.mockClear();
  });

  it("warns and returns in development when the PostHog token is missing", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const register = await loadRegister();

    expect(() => register()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"),
    );
    expect(LoggerProvider).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("warns and returns in development when the PostHog host is missing", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const register = await loadRegister();

    expect(() => register()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_POSTHOG_HOST"),
    );
    expect(LoggerProvider).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("returns without a warning outside development when PostHog env is missing", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const register = await loadRegister();

    expect(() => register()).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
    expect(LoggerProvider).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("creates the logger provider when the token and host are configured", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");
    const register = await loadRegister();

    register();

    expect(LoggerProvider).toHaveBeenCalledOnce();
    expect(setGlobalLoggerProvider).toHaveBeenCalledOnce();
  });
});

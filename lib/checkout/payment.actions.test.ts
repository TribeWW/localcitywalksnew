import { beforeEach, describe, expect, it, vi } from "vitest";

const afterMock = vi.fn();
const headersMock = vi.fn();
const runInitiateCheckoutPaymentMock = vi.fn();
const resolveCheckoutOriginMock = vi.fn();

vi.mock("next/server", () => ({
  after: (task: () => Promise<void>) => afterMock(task),
}));

vi.mock("next/headers", () => ({
  headers: () => headersMock(),
}));

vi.mock("@/lib/checkout/initiate-checkout-payment", () => ({
  runInitiateCheckoutPayment: (...args: unknown[]) =>
    runInitiateCheckoutPaymentMock(...args),
}));

vi.mock("@/lib/stripe/checkout-origin", () => ({
  resolveCheckoutOrigin: (...args: unknown[]) =>
    resolveCheckoutOriginMock(...args),
}));

import { initiateCheckoutPayment } from "@/lib/checkout/payment.actions";

describe("initiateCheckoutPayment", () => {
  beforeEach(() => {
    afterMock.mockReset();
    headersMock.mockReset();
    runInitiateCheckoutPaymentMock.mockReset();
    resolveCheckoutOriginMock.mockReset();
    headersMock.mockResolvedValue(new Headers());
    resolveCheckoutOriginMock.mockReturnValue("https://www.localcitywalks.com");
  });

  it("registers both telemetry tasks with after() without starting them", async () => {
    const tasks = [vi.fn(() => Promise.resolve()), vi.fn(() => Promise.resolve())];
    runInitiateCheckoutPaymentMock.mockImplementation(
      async (
        _input: unknown,
        options: {
          scheduleAfterResponse?: (task: () => Promise<void>) => void;
        },
      ) => {
        tasks.forEach((task) => options.scheduleAfterResponse?.(task));
        return {
          success: true,
          redirectUrl: "https://checkout.stripe.test/cs_test_123",
        };
      },
    );

    await expect(initiateCheckoutPayment({ handoffToken: "token" })).resolves.toEqual({
      success: true,
      redirectUrl: "https://checkout.stripe.test/cs_test_123",
    });

    expect(tasks[0]).not.toHaveBeenCalled();
    expect(tasks[1]).not.toHaveBeenCalled();
    expect(afterMock).toHaveBeenCalledTimes(2);
    expect(afterMock).toHaveBeenNthCalledWith(1, tasks[0]);
    expect(afterMock).toHaveBeenNthCalledWith(2, tasks[1]);
    expect(runInitiateCheckoutPaymentMock).toHaveBeenCalledWith(
      { handoffToken: "token" },
      {
        checkoutOrigin: "https://www.localcitywalks.com",
        scheduleAfterResponse: expect.any(Function),
      },
    );
  });
});

/**
 * booking-widget email senders — red/green TDD specs (LOC-1055).
 *
 * Critical invariants:
 * - Transporter must verify before send
 * - Team email uses support inbox + replyTo customer + from support
 * - Customer email goes to submitter with from support
 * - Orchestrator sends team first, then customer
 * - Failures surface with actionable error messages
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingWidgetEmailContent } from "@/lib/nodemailer/booking-widget-email";

const { sendMailMock, verifyMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn(),
  verifyMock: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      verify: verifyMock,
      sendMail: sendMailMock,
    }),
  },
}));

vi.mock("@/lib/config", () => ({
  config: {
    email: {
      supportEmail: "support@localcitywalks.com",
      supportPassword: "test-password",
    },
  },
}));

import { resetBookingWidgetEmailDeliveryLedger } from "@/lib/nodemailer/booking-widget-email-delivery-ledger";
import {
  sendBookingWidgetRequestEmails,
  sendBookingWidgetTeamEmail,
  sendTourRequestConfirmationEmail,
} from "@/lib/nodemailer/index";

const samplePayload: BookingWidgetEmailContent = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  consent: true,
  city: "Toledo",
  productId: "1079932",
  productTitle: "Hello Toledo Private Walk",
  date: "2026-07-15",
  startTimeId: 12345,
  startTimeLabel: "11:00",
  adults: 2,
  youth: 0,
  children: 0,
  infants: 0,
  totalAmount: 248,
  currency: "EUR",
};

describe("sendBookingWidgetTeamEmail", () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    verifyMock.mockReset();
    verifyMock.mockResolvedValue(true);
    sendMailMock.mockResolvedValue({ messageId: "team-1" });
  });

  it("routing invariant: sends from support to support with replyTo customer", async () => {
    await sendBookingWidgetTeamEmail(samplePayload);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const options = sendMailMock.mock.calls[0]![0];
    expect(options.from).toBe("support@localcitywalks.com");
    expect(options.to).toBe("support@localcitywalks.com");
    expect(options.replyTo).toBe("jane@example.com");
    expect(options.subject).toContain("Hello Toledo Private Walk");
    expect(options.html).toContain("1079932");
    expect(options.html).toContain("€248");
  });

  it("verification invariant: rejects when transporter verify fails", async () => {
    verifyMock.mockResolvedValue(false);

    await expect(sendBookingWidgetTeamEmail(samplePayload)).rejects.toThrow(
      "Failed to send booking widget team email",
    );
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});

describe("sendTourRequestConfirmationEmail", () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    verifyMock.mockReset();
    verifyMock.mockResolvedValue(true);
    sendMailMock.mockResolvedValue({ messageId: "customer-1" });
  });

  it("routing invariant: sends from support to customer", async () => {
    await sendTourRequestConfirmationEmail(samplePayload);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const options = sendMailMock.mock.calls[0]![0];
    expect(options.from).toBe("support@localcitywalks.com");
    expect(options.to).toBe("jane@example.com");
    expect(options.subject).toContain("Toledo");
    expect(options.html).toContain("Thanks for your tour request");
  });
});

describe("sendBookingWidgetRequestEmails", () => {
  beforeEach(() => {
    resetBookingWidgetEmailDeliveryLedger();
    sendMailMock.mockReset();
    verifyMock.mockReset();
    verifyMock.mockResolvedValue(true);
    sendMailMock.mockResolvedValue({ messageId: "ok" });
  });

  it("order invariant: sends team email then customer confirmation", async () => {
    await sendBookingWidgetRequestEmails(samplePayload);

    expect(sendMailMock).toHaveBeenCalledTimes(2);
    expect(sendMailMock.mock.calls[0]![0].to).toBe(
      "support@localcitywalks.com",
    );
    expect(sendMailMock.mock.calls[1]![0].to).toBe("jane@example.com");
  });

  it("failure invariant: propagates team email failures before customer send", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("SMTP rejected"));

    await expect(sendBookingWidgetRequestEmails(samplePayload)).rejects.toThrow(
      "Failed to send booking widget team email",
    );
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it("failure invariant: propagates customer email failures", async () => {
    sendMailMock
      .mockResolvedValueOnce({ messageId: "team-1" })
      .mockRejectedValueOnce(new Error("SMTP rejected"));

    await expect(sendBookingWidgetRequestEmails(samplePayload)).rejects.toThrow(
      "Failed to send booking widget confirmation email",
    );
  });

  it("idempotency invariant: retry after partial failure skips already-delivered team email", async () => {
    sendMailMock
      .mockResolvedValueOnce({ messageId: "team-1" })
      .mockRejectedValueOnce(new Error("SMTP rejected"));

    await expect(sendBookingWidgetRequestEmails(samplePayload)).rejects.toThrow(
      "Failed to send booking widget confirmation email",
    );
    expect(sendMailMock).toHaveBeenCalledTimes(2);

    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue({ messageId: "customer-1" });

    await sendBookingWidgetRequestEmails(samplePayload);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock.mock.calls[0]![0].to).toBe("jane@example.com");
  });

  it("concurrency invariant: parallel submits for the same booking send each leg once", async () => {
    sendMailMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ messageId: "ok" }), 15);
        }),
    );

    await Promise.all([
      sendBookingWidgetRequestEmails(samplePayload),
      sendBookingWidgetRequestEmails(samplePayload),
    ]);

    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });
});

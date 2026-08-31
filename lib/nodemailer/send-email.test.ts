/**
 * sendEmail — server-side consent guard for the contact form.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { sendEmail } from "@/lib/nodemailer/index";

const sampleContactEmail = {
  name: "Alex Walker",
  email: "alex.walker@example.com",
  subject: "General Inquiry",
  message: "Hello there",
  consent: true as const,
};

describe("sendEmail", () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    verifyMock.mockReset();
    verifyMock.mockResolvedValue(true);
    sendMailMock.mockResolvedValue({ messageId: "contact-1" });
  });

  it("rejects when consent is false before verifying or sending", async () => {
    await expect(
      sendEmail({ ...sampleContactEmail, consent: false }),
    ).rejects.toThrow("Consent is required to submit the contact form");

    expect(verifyMock).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("sends when consent is true", async () => {
    await sendEmail(sampleContactEmail);

    expect(verifyMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});

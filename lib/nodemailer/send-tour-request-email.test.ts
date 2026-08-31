/**
 * sendTourRequestEmail — HTML escaping for user-controlled fields.
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

import { sendTourRequestEmail } from "@/lib/nodemailer/index";

describe("sendTourRequestEmail", () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    verifyMock.mockReset();
    verifyMock.mockResolvedValue(true);
    sendMailMock.mockResolvedValue({ messageId: "tour-request-1" });
  });

  it("escapes user-controlled values in the HTML body", async () => {
    await sendTourRequestEmail({
      fullName: `<img onerror=alert(1)>`,
      email: "jane@example.com",
      city: "Barcelona<script>",
      message: "<b>hello</b> & more",
      phoneNumber: "+34 & co",
      adults: 2,
      youth: 0,
      children: 0,
      infants: 0,
      preferredDate: new Date("2026-08-15T12:00:00Z"),
      preferredTime: "11:00 AM",
      tourDuration: "2 hours",
      language: "Other",
      otherLanguage: `"<evil>`,
      consent: true,
    });

    const html = sendMailMock.mock.calls[0]?.[0]?.html as string;

    expect(html).toContain("&lt;img onerror=alert(1)&gt;");
    expect(html).toContain("Barcelona&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;hello&lt;/b&gt; &amp; more");
    expect(html).toContain("+34 &amp; co");
    expect(html).toContain("&quot;&lt;evil&gt;");
    expect(html).not.toMatch(/<script/i);
  });
});

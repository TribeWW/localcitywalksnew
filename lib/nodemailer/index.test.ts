import { describe, expect, it, vi, beforeEach } from "vitest";

const mockVerify = vi.fn();
const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn(() => ({
  verify: mockVerify,
  sendMail: mockSendMail,
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

vi.mock("@/lib/config", () => ({
  config: {
    email: {
      supportEmail: "support@test.com",
      supportPassword: "test-password",
    },
  },
}));

// Import after mocks are set up
const { sendEmail, sendTourRequestEmail } = await import("./index");

const validEmailData = {
  subject: "Test Subject",
  email: "user@example.com",
  name: "Test User",
  message: "Hello there",
  consent: true,
};

const validTourRequestData = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  city: "Athens",
  message: "I'd love a tour",
  phoneNumber: "+1234567890",
  adults: 2,
  youth: 1,
  children: 0,
  preferredDate: new Date("2025-06-15"),
  preferredTime: "10:00",
  tourDuration: "2 hours",
  consent: true,
};

describe("sendEmail", () => {
  beforeEach(() => {
    mockVerify.mockReset();
    mockSendMail.mockReset();
  });

  it("returns { success: true } when transporter verifies and mail sends", async () => {
    mockVerify.mockResolvedValueOnce(true);
    mockSendMail.mockResolvedValueOnce({ messageId: "abc123" });

    const result = await sendEmail(validEmailData);

    expect(result).toEqual({ success: true });
  });

  it("throws when transporter verification fails", async () => {
    mockVerify.mockResolvedValueOnce(false);

    await expect(sendEmail(validEmailData)).rejects.toThrow(
      "Email transporter verification failed",
    );
  });

  it("calls sendMail with correct from/to/subject fields", async () => {
    mockVerify.mockResolvedValueOnce(true);
    mockSendMail.mockResolvedValueOnce({});

    await sendEmail(validEmailData);

    expect(mockSendMail).toHaveBeenCalledOnce();
    const mailOptions = mockSendMail.mock.calls[0]?.[0] as {
      from: string;
      to: string;
      subject: string;
      replyTo: string;
    };
    expect(mailOptions.from).toBe("support@test.com");
    expect(mailOptions.to).toBe("support@test.com");
    expect(mailOptions.subject).toBe("Test Subject");
    expect(mailOptions.replyTo).toBe("user@example.com");
  });

  it("throws with descriptive message when sendMail fails", async () => {
    mockVerify.mockResolvedValueOnce(true);
    const smtpError = Object.assign(new Error("ECONNREFUSED"), {
      code: "ECONNREFUSED",
      command: "CONN",
    });
    mockSendMail.mockRejectedValueOnce(smtpError);

    await expect(sendEmail(validEmailData)).rejects.toThrow(
      "Failed to send email: ECONNREFUSED",
    );
  });

  it("does NOT log SMTP credentials (password) before sending", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    mockVerify.mockResolvedValueOnce(true);
    mockSendMail.mockResolvedValueOnce({});

    await sendEmail(validEmailData);

    const loggedValues = consoleSpy.mock.calls
      .flat()
      .map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
    const passwordLogged = loggedValues.some((v) =>
      v.includes("supportPassword") || v.includes("SMTP pass"),
    );
    expect(passwordLogged).toBe(false);

    consoleSpy.mockRestore();
  });

  it("handles verification throwing an error (verify rejects)", async () => {
    mockVerify.mockRejectedValueOnce(new Error("Connection refused"));

    // verifyTransporter catches and returns false, then sendEmail throws
    await expect(sendEmail(validEmailData)).rejects.toThrow(
      "Email transporter verification failed",
    );
  });
});

describe("sendTourRequestEmail", () => {
  beforeEach(() => {
    mockVerify.mockReset();
    mockSendMail.mockReset();
  });

  it("returns { success: true } when transporter verifies and mail sends", async () => {
    mockVerify.mockResolvedValueOnce(true);
    mockSendMail.mockResolvedValueOnce({ messageId: "tour-abc" });

    const result = await sendTourRequestEmail(validTourRequestData);

    expect(result).toEqual({ success: true });
  });

  it("throws when transporter verification fails", async () => {
    mockVerify.mockResolvedValueOnce(false);

    await expect(
      sendTourRequestEmail(validTourRequestData),
    ).rejects.toThrow("Email transporter verification failed");
  });

  it("calls sendMail with subject containing the city name", async () => {
    mockVerify.mockResolvedValueOnce(true);
    mockSendMail.mockResolvedValueOnce({});

    await sendTourRequestEmail(validTourRequestData);

    expect(mockSendMail).toHaveBeenCalledOnce();
    const mailOptions = mockSendMail.mock.calls[0]?.[0] as { subject: string };
    expect(mailOptions.subject).toContain("Athens");
  });

  it("calls sendMail with correct from/to/replyTo fields", async () => {
    mockVerify.mockResolvedValueOnce(true);
    mockSendMail.mockResolvedValueOnce({});

    await sendTourRequestEmail(validTourRequestData);

    const mailOptions = mockSendMail.mock.calls[0]?.[0] as {
      from: string;
      to: string;
      replyTo: string;
    };
    expect(mailOptions.from).toBe("support@test.com");
    expect(mailOptions.to).toBe("support@test.com");
    expect(mailOptions.replyTo).toBe("jane@example.com");
  });

  it("throws with descriptive message when sendMail fails", async () => {
    mockVerify.mockResolvedValueOnce(true);
    const smtpError = Object.assign(new Error("AUTH failed"), {
      code: "EAUTH",
      command: "AUTH",
    });
    mockSendMail.mockRejectedValueOnce(smtpError);

    await expect(
      sendTourRequestEmail(validTourRequestData),
    ).rejects.toThrow("Failed to send tour request email: AUTH failed");
  });

  it("includes participant totals (adults + youth + children) in HTML body", async () => {
    mockVerify.mockResolvedValueOnce(true);
    mockSendMail.mockResolvedValueOnce({});

    await sendTourRequestEmail({ ...validTourRequestData, adults: 3, youth: 1, children: 2 });

    const mailOptions = mockSendMail.mock.calls[0]?.[0] as { html: string };
    // Total participants = 3+1+2 = 6
    expect(mailOptions.html).toContain("6");
  });

  it("handles optional phoneNumber being absent", async () => {
    mockVerify.mockResolvedValueOnce(true);
    mockSendMail.mockResolvedValueOnce({});

    const dataWithoutPhone = { ...validTourRequestData };
    delete dataWithoutPhone.phoneNumber;

    await expect(
      sendTourRequestEmail(dataWithoutPhone),
    ).resolves.toEqual({ success: true });

    const mailOptions = mockSendMail.mock.calls[0]?.[0] as { html: string };
    expect(mailOptions.html).toContain("Not provided");
  });

  it("does NOT log SMTP credentials before sending", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    mockVerify.mockResolvedValueOnce(true);
    mockSendMail.mockResolvedValueOnce({});

    await sendTourRequestEmail(validTourRequestData);

    const loggedValues = consoleSpy.mock.calls
      .flat()
      .map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
    const credentialsLogged = loggedValues.some((v) =>
      v.includes("supportPassword") || v.includes("SMTP pass") || v.includes("SMTP user"),
    );
    expect(credentialsLogged).toBe(false);

    consoleSpy.mockRestore();
  });
});

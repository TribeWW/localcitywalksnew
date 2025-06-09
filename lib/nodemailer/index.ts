"use server";
import nodemailer from "nodemailer";

interface EmailContent {
  subject: string;
  email: string;
  name: string;
  message: string;
}

interface EmailError {
  name?: string;
  message?: string;
  stack?: string;
  code?: string;
  command?: string;
}

// Verify transporter configuration
async function verifyTransporter(transporter: nodemailer.Transporter) {
  try {
    const verification = await transporter.verify();
    return verification;
  } catch (error) {
    console.error("Transporter verification failed:", error);
    return false;
  }
}

const transporter = nodemailer.createTransport({
  host: "mail.localcitywalks.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SUPPORT_EMAIL,
    pass: process.env.SUPPORT_PASSWORD,
  },
});

export async function sendEmail(data: EmailContent) {
  try {
    // Verify transporter before sending
    const isVerified = await verifyTransporter(transporter);
    if (!isVerified) {
      throw new Error("Email transporter verification failed");
    }

    // Email to support team
    const supportMailOptions = {
      from: process.env.SUPPORT_EMAIL,
      replyTo: data.email,
      to: process.env.SUPPORT_EMAIL,
      subject: data.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${data.name} (${data.email})</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${data.message}</p>
        </div>
      `,
    };

    //const supportResult = await transporter.sendMail(supportMailOptions);

    return { success: true };
  } catch (error) {
    const emailError = error as EmailError;
    console.error("Detailed email error:", {
      name: emailError.name,
      message: emailError.message,
      stack: emailError.stack,
      code: emailError.code,
      command: emailError.command,
    });
    throw new Error(`Failed to send email: ${emailError.message}`);
  }
}

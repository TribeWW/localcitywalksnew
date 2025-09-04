/* Its is important to make a password in Freshdesk to trigger the email flow! This password has to be the same as the one in the .env file */

"use server";
import nodemailer from "nodemailer";

interface EmailContent {
  subject: string;
  email: string;
  name: string;
  message: string;
  consent: boolean;
}

interface TourRequestEmailContent {
  fullName: string;
  email: string;
  city: string;
  message: string;
  consent: boolean;
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
  host: "ams39.siteground.eu",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SUPPORT_EMAIL,
    pass: process.env.SUPPORT_PASSWORD,
  },
});

export async function sendEmail(data: EmailContent) {
  try {
    console.log("SMTP user:", process.env.SUPPORT_EMAIL);
    console.log("SMTP pass defined:", Boolean(process.env.SUPPORT_PASSWORD));
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
          <p><strong>Consent:</strong> ${data.consent}</p>
        </div>
      `,
    };

    const supportResult = await transporter.sendMail(supportMailOptions);
    console.log("Support email sent:", supportResult);

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

export async function sendTourRequestEmail(data: TourRequestEmailContent) {
  try {
    console.log("SMTP user:", process.env.SUPPORT_EMAIL);
    console.log("SMTP pass defined:", Boolean(process.env.SUPPORT_PASSWORD));

    // Verify transporter before sending
    const isVerified = await verifyTransporter(transporter);
    if (!isVerified) {
      throw new Error("Email transporter verification failed");
    }

    // Email to support team for tour request
    const tourRequestMailOptions = {
      from: process.env.SUPPORT_EMAIL,
      replyTo: data.email,
      to: process.env.SUPPORT_EMAIL,
      subject: `Tour Request: ${data.city}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff5500; border-bottom: 2px solid #ff5500; padding-bottom: 10px;">
            🚶‍♂️ New Tour Request
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Tour Details</h3>
            <p><strong>🏙️ City:</strong> ${data.city}</p>
            <p><strong>👤 Requested by:</strong> ${data.fullName}</p>
            <p><strong>📧 Email:</strong> ${data.email}</p>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin-top: 0;">Tour Preferences</h4>
            <p style="background: #fff; padding: 15px; border-radius: 5px; margin: 0;">${
              data.message
            }</p>
          </div>
          
          <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <p style="margin: 0; color: #0c5460;">
              <strong>✅ Consent given:</strong> ${data.consent ? "Yes" : "No"}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px;">
              This is an automated notification from LocalCityWalks tour request form.
            </p>
          </div>
        </div>
      `,
    };

    const tourRequestResult = await transporter.sendMail(
      tourRequestMailOptions
    );
    console.log("Tour request email sent:", tourRequestResult);

    return { success: true };
  } catch (error) {
    const emailError = error as EmailError;
    console.error("Detailed tour request email error:", {
      name: emailError.name,
      message: emailError.message,
      stack: emailError.stack,
      code: emailError.code,
      command: emailError.command,
    });
    throw new Error(`Failed to send tour request email: ${emailError.message}`);
  }
}

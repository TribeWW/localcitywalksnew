/**
 * Booking widget email templates and formatters (LOC-1055).
 *
 * Pure functions for team + customer HTML bodies and subjects. Used by
 * `sendBookingWidgetTeamEmail`, `sendTourRequestConfirmationEmail`, and
 * `sendBookingWidgetRequestEmails` in `lib/nodemailer/index.ts`.
 *
 * Totals must come from the server-verified quote (LOC-1056), not `clientQuote`.
 */

import { formatCataloguePriceAmount } from "@/lib/utils/format-catalogue-price";
import { formatBokunLanguage } from "@/lib/utils/format-bokun-language";

/** One priced line in the optional email breakdown section. */
export interface BookingWidgetEmailBreakdownLine {
  categoryLabel: string;
  count: number;
  lineTotal: number;
  currency: string;
}

/**
 * Normalized payload for widget booking emails.
 * Built by `submitTourBookingRequest` (LOC-1056) after server quote verification.
 */
export interface BookingWidgetEmailContent {
  fullName: string;
  email: string;
  phoneNumber?: string;
  message?: string;
  consent: boolean;
  city: string;
  productId: string;
  productTitle: string;
  /** Selected tour date `YYYY-MM-DD`. */
  date: string;
  startTimeId: number;
  /** Display label for the chosen start time (e.g. `"11:00"`). */
  startTimeLabel: string;
  language?: string;
  durationText?: string;
  adults: number;
  youth: number;
  children: number;
  infants: number;
  /** Server-verified total from `calculateBookingQuote`. */
  totalAmount: number;
  currency: string;
  breakdown?: BookingWidgetEmailBreakdownLine[];
}

/**
 * Escapes user-controlled strings for safe HTML interpolation in email bodies.
 *
 * @param value - Raw user or API string
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Formats an ISO date for email copy (long weekday style).
 *
 * @param isoDate - `YYYY-MM-DD` calendar date
 */
export function formatBookingWidgetEmailDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Builds a readable participant summary for email (e.g. `"2 adults, 1 infant"`).
 *
 * @param participants - Widget counter values
 */
export function formatBookingParticipantSummary(participants: {
  adults: number;
  youth: number;
  children: number;
  infants: number;
}): string {
  const parts: string[] = [];

  if (participants.adults > 0) {
    parts.push(
      `${participants.adults} adult${participants.adults === 1 ? "" : "s"}`,
    );
  }
  if (participants.youth > 0) {
    parts.push(`${participants.youth} youth`);
  }
  if (participants.children > 0) {
    parts.push(
      `${participants.children} child${participants.children === 1 ? "" : "ren"}`,
    );
  }
  if (participants.infants > 0) {
    parts.push(
      `${participants.infants} infant${participants.infants === 1 ? "" : "s"}`,
    );
  }

  return parts.join(", ");
}

/**
 * Returns total participant count across all categories.
 *
 * @param participants - Widget counter values
 */
export function totalParticipantCount(participants: {
  adults: number;
  youth: number;
  children: number;
  infants: number;
}): number {
  return (
    participants.adults +
    participants.youth +
    participants.children +
    participants.infants
  );
}

/**
 * Subject line for the support team booking-widget notification.
 *
 * @param data - Verified booking email payload
 */
export function buildBookingWidgetTeamSubject(
  data: BookingWidgetEmailContent,
): string {
  const formattedTotal = formatCataloguePriceAmount(
    data.totalAmount,
    data.currency,
  );
  const totalSuffix = formattedTotal ? ` — ${formattedTotal}` : "";
  return `Booking request: ${data.productTitle} (${data.city})${totalSuffix}`;
}

/**
 * Subject line for the customer booking confirmation email.
 *
 * @param data - Verified booking email payload
 */
export function buildBookingWidgetCustomerSubject(
  data: BookingWidgetEmailContent,
): string {
  return `Your LocalCityWalks tour request — ${data.city}`;
}

function renderBreakdownHtml(
  breakdown: BookingWidgetEmailBreakdownLine[] | undefined,
): string {
  if (!breakdown?.length) {
    return "";
  }

  const lines = breakdown
    .filter((line) => line.count > 0)
    .map((line) => {
      const formatted =
        line.lineTotal === 0
          ? "Free"
          : formatCataloguePriceAmount(line.lineTotal, line.currency);
      if (!formatted) return "";

      return `<p style="margin: 4px 0;"><strong>${escapeHtml(line.categoryLabel)} × ${line.count}:</strong> ${escapeHtml(formatted)}</p>`;
    })
    .filter(Boolean)
    .join("");

  if (!lines) {
    return "";
  }

  return `
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ccc;">
      <p style="margin: 0 0 8px; font-weight: 600;">Price breakdown</p>
      ${lines}
    </div>
  `;
}

function renderScheduleSection(data: BookingWidgetEmailContent): string {
  const dateLabel = escapeHtml(formatBookingWidgetEmailDate(data.date));
  const timeLabel = escapeHtml(data.startTimeLabel);
  const languageLabel = data.language?.trim()
    ? escapeHtml(formatBokunLanguage(data.language))
    : null;
  const durationLabel = data.durationText?.trim()
    ? escapeHtml(data.durationText)
    : null;

  return `
    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
      <h3 style="color: #333; margin-top: 0;">Tour schedule</h3>
      <p><strong>Date:</strong> ${dateLabel}</p>
      <p><strong>Time:</strong> ${timeLabel}</p>
      ${languageLabel ? `<p><strong>Language:</strong> ${languageLabel}</p>` : ""}
      ${durationLabel ? `<p><strong>Duration:</strong> ${durationLabel}</p>` : ""}
    </div>
  `;
}

function renderParticipantsSection(data: BookingWidgetEmailContent): string {
  const total = totalParticipantCount(data);
  const summary = formatBookingParticipantSummary(data);

  return `
    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
      <h3 style="color: #333; margin-top: 0;">Participants</h3>
      <p><strong>Adults (18+):</strong> ${data.adults}</p>
      <p><strong>Youth (13–17):</strong> ${data.youth}</p>
      <p><strong>Children (3–12):</strong> ${data.children}</p>
      <p><strong>Infants (0–2):</strong> ${data.infants}</p>
      <p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ccc;">
        <strong>Total:</strong> ${total} participant${total === 1 ? "" : "s"}
        ${summary ? ` (${escapeHtml(summary)})` : ""}
      </p>
    </div>
  `;
}

function renderPricingSection(data: BookingWidgetEmailContent): string {
  const formattedTotal =
    formatCataloguePriceAmount(data.totalAmount, data.currency) ?? "—";

  return `
    <div style="background: #fff8e6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff5500;">
      <h3 style="color: #333; margin-top: 0;">Pricing</h3>
      <p style="font-size: 18px; margin: 0 0 8px;"><strong>Total:</strong> ${escapeHtml(formattedTotal)}</p>
      <p style="margin: 0; color: #6c757d; font-size: 14px;">Price includes all taxes and fees.</p>
      ${renderBreakdownHtml(data.breakdown)}
    </div>
  `;
}

function renderMessageSection(message: string | undefined): string {
  const trimmed = message?.trim();
  if (!trimmed) {
    return "";
  }

  return `
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h4 style="color: #856404; margin-top: 0;">Message</h4>
      <p style="background: #fff; padding: 15px; border-radius: 5px; margin: 0;">${escapeHtml(trimmed)}</p>
    </div>
  `;
}

/**
 * HTML body for the support team booking-widget notification.
 *
 * @param data - Verified booking email payload
 */
export function buildBookingWidgetTeamHtml(
  data: BookingWidgetEmailContent,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff5500; border-bottom: 2px solid #ff5500; padding-bottom: 10px;">
        New booking widget request
      </h2>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Contact</h3>
        <p><strong>Name:</strong> ${escapeHtml(data.fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phoneNumber?.trim() || "Not provided")}</p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Product</h3>
        <p><strong>City:</strong> ${escapeHtml(data.city)}</p>
        <p><strong>Product:</strong> ${escapeHtml(data.productTitle)}</p>
        <p><strong>Bókun product id:</strong> ${escapeHtml(data.productId)}</p>
        <p><strong>Bókun start time id:</strong> ${data.startTimeId}</p>
      </div>

      ${renderScheduleSection(data)}
      ${renderParticipantsSection(data)}
      ${renderPricingSection(data)}
      ${renderMessageSection(data.message)}

      <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
        <p style="margin: 0; color: #0c5460;">
          <strong>Consent given:</strong> ${data.consent ? "Yes" : "No"}
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; font-size: 14px;">
          Automated notification from the LocalCityWalks booking widget.
        </p>
      </div>
    </div>
  `;
}

/**
 * HTML body for the customer booking confirmation email.
 *
 * Omits internal ops fields (`productId`, `startTimeId`) while mirroring
 * selections and the verified total shown to the customer in the widget.
 *
 * @param data - Verified booking email payload
 */
export function buildBookingWidgetCustomerHtml(
  data: BookingWidgetEmailContent,
): string {
  const formattedTotal =
    formatCataloguePriceAmount(data.totalAmount, data.currency) ?? "—";
  const participantSummary = formatBookingParticipantSummary(data);
  const languageLabel = data.language?.trim()
    ? formatBokunLanguage(data.language)
    : null;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff5500; border-bottom: 2px solid #ff5500; padding-bottom: 10px;">
        Thanks for your tour request
      </h2>

      <p style="color: #333; line-height: 1.6;">
        Hi ${escapeHtml(data.fullName)}, we received your request for
        <strong>${escapeHtml(data.productTitle)}</strong> in
        <strong>${escapeHtml(data.city)}</strong>. Our team will get back to you shortly.
      </p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Your selections</h3>
        <p><strong>Date:</strong> ${escapeHtml(formatBookingWidgetEmailDate(data.date))}</p>
        <p><strong>Time:</strong> ${escapeHtml(data.startTimeLabel)}</p>
        ${languageLabel ? `<p><strong>Language:</strong> ${escapeHtml(languageLabel)}</p>` : ""}
        ${data.durationText?.trim() ? `<p><strong>Duration:</strong> ${escapeHtml(data.durationText)}</p>` : ""}
        ${participantSummary ? `<p><strong>Participants:</strong> ${escapeHtml(participantSummary)}</p>` : ""}
        <p style="margin-top: 12px; font-size: 18px;"><strong>Total:</strong> ${escapeHtml(formattedTotal)}</p>
        <p style="margin: 0; color: #6c757d; font-size: 14px;">Price includes all taxes and fees.</p>
      </div>

      ${renderMessageSection(data.message)}

      <p style="color: #333; line-height: 1.6;">
        If you have questions, reply to this email and we will be happy to help.
      </p>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; font-size: 14px;">
          LocalCityWalks — private walking tours with local guides
        </p>
      </div>
    </div>
  `;
}

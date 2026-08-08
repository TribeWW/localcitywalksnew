/**
 * Order recap fields shared by checkout summary and success views.
 */

export interface CheckoutOrderFixture {
  imageUrl: string;
  imageAlt: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  participantsLabel: string;
  totalAmount: number;
  currency: string;
  /** Booking language label, e.g. "English". */
  languageLabel?: string;
}

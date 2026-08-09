/**
 * Single source of truth for 1031ExchangeUp™ events.
 * Every surface that mentions an event date must read from here so dates never
 * go stale in one place while being correct in another.
 */

export interface ExchangeEvent {
  /** Stable slug stored on event_registrations.event */
  slug: string;
  title: string;
  /** Human date, e.g. "August 11, 2026" */
  dateLabel: string;
  timeLabel: string;
  platform: string;
  /** Optional external registration link (Eventbrite, etc.) */
  registrationUrl?: string;
  description: string;
}

export const UPCOMING_EVENT: ExchangeEvent = {
  slug: "1031-exchange-summit",
  title: "1031 Exchange Up Monthly Series",
  dateLabel: "August 11, 2026",
  timeLabel: "12:00 PM ET",
  platform: "Zoom",
  description:
    "1031 Exchange Up Monthly Series powered by 1031 Exchange Up and our partnered vendors. Tax-saving strategies, DSTs, bonus depreciation, and how to use 1031ExchangeUp™ to uncover more deal flow.",
};

/** "August 11, 2026 · 12:00 PM ET · Zoom" */
export const upcomingEventLine = [
  UPCOMING_EVENT.dateLabel,
  UPCOMING_EVENT.timeLabel,
  UPCOMING_EVENT.platform,
].join(" · ");

/**
 * Ancillary services — optional paid add-ons (insurance, baggage, seat selection,
 * transfers, excursions) sold alongside the core booking. The catalogue is
 * server-authoritative; the booking funnel reads it and the chosen line items are
 * persisted per booking for revenue reporting.
 */
@org.springframework.modulith.ApplicationModule
package com.travelai.ancillary;

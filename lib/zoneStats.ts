// Lookup mode — derive the time-zone stat block for a selected place.
//
// Everything here is computed live from the place's IANA zone via Intl, so a
// place only needs to carry {country code, name, timeZone}. This is distinct
// from the hand-written lesson strings in lib/timezones.ts (which describe a
// zone's rules); these are the *current* values at the location.

import type { GeoPlace } from "./geo";
import { getOffsetLabel } from "./timezones";

export interface ZoneStats {
  /** Full country name, e.g. "Argentina". */
  country: string;
  /** City / place name. */
  city: string;
  /** IANA zone id, e.g. "America/Argentina/Buenos_Aires". */
  timeZone: string;
  /** Current local time at the location, e.g. "14:37". */
  localTime: string;
  /** Zone abbreviation, e.g. "ART". */
  abbreviation: string;
  /** Spelled-out zone name, e.g. "Argentina Standard Time". */
  longName: string;
  /** UTC offset, e.g. "UTC-03:00". */
  utcOffset: string;
}

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function countryName(code: string): string {
  if (!code) return "";
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Pull the `timeZoneName` part (short or long) for a zone at a moment. */
function zoneNamePart(
  timeZone: string,
  date: Date,
  kind: "short" | "long",
): string {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: kind,
      hour: "numeric",
    })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName");
    return part?.value ?? "";
  } catch {
    return "";
  }
}

function localTimeInZone(timeZone: string, date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return "--:--";
  }
}

/**
 * Compute the current zone stats for a place. `date` is injectable so the
 * caller can tick it every second for a live clock.
 */
export function getZoneStats(place: GeoPlace, date: Date = new Date()): ZoneStats {
  const timeZone = place.timeZone;
  return {
    country: countryName(place.country),
    city: place.name,
    timeZone,
    localTime: localTimeInZone(timeZone, date),
    abbreviation: zoneNamePart(timeZone, date, "short"),
    longName: zoneNamePart(timeZone, date, "long"),
    utcOffset: getOffsetLabel(timeZone, date),
  };
}

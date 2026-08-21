export interface TimeZoneLesson {
  id: string;
  city: string;
  country: string;
  timeZone: string;
  abbreviation: string;
  /**
   * Spelled-out name(s) matching `abbreviation`, e.g. "Central Standard
   * Time / Central Daylight Time". Several abbreviations in this list are
   * ambiguous on their own — CST is both Chicago's Central Standard Time
   * and Shanghai's China Standard Time; BST is both London's British
   * Summer Time and Dhaka's Bangladesh Standard Time. This field is what
   * disambiguates them wherever geography isn't shown (see LessonCard and
   * lib/practice.ts's "medium" difficulty).
   */
  fullName: string;
  utcOffset: string;
  explanation: string;
}

function getOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return Math.round((asUtc - date.getTime()) / 60000);
}

export function getOffsetLabel(timeZone: string, date: Date): string {
  const minutes = getOffsetMinutes(timeZone, date);
  const sign = minutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(minutes);
  const hours = String(Math.floor(absMinutes / 60)).padStart(2, "0");
  const remainder = String(absMinutes % 60).padStart(2, "0");
  return `UTC${sign}${hours}:${remainder}`;
}

export function formatTimeInZone(timeZone: string, date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export const lessons: TimeZoneLesson[] = [
  {
    id: "utc",
    city: "Greenwich",
    country: "United Kingdom",
    timeZone: "Etc/UTC",
    abbreviation: "UTC",
    fullName: "Coordinated Universal Time",
    utcOffset: "UTC+00:00",
    explanation:
      "UTC (Coordinated Universal Time) is the reference point every other time zone is measured against. It does not observe daylight saving time.",
  },
  {
    id: "reykjavik",
    city: "Reykjavik",
    country: "Iceland",
    timeZone: "Atlantic/Reykjavik",
    abbreviation: "GMT",
    fullName: "Greenwich Mean Time",
    utcOffset: "UTC+00:00",
    explanation:
      "Iceland stays on UTC+00:00 all year. Unlike the UK, it never shifts for daylight saving, so its offset never changes.",
  },
  {
    id: "london",
    city: "London",
    country: "United Kingdom",
    timeZone: "Europe/London",
    abbreviation: "GMT / BST",
    fullName: "Greenwich Mean Time / British Summer Time",
    utcOffset: "UTC+00:00 / +01:00 (DST)",
    explanation:
      "London runs on Greenwich Mean Time in winter and British Summer Time (UTC+01:00) from late March to late October.",
  },
  {
    id: "berlin",
    city: "Berlin",
    country: "Germany",
    timeZone: "Europe/Berlin",
    abbreviation: "CET / CEST",
    fullName: "Central European Time / Central European Summer Time",
    utcOffset: "UTC+01:00 / +02:00 (DST)",
    explanation:
      "Central European Time covers most of continental Western Europe. Clocks move forward an hour for Central European Summer Time.",
  },
  {
    id: "cairo",
    city: "Cairo",
    country: "Egypt",
    timeZone: "Africa/Cairo",
    abbreviation: "EET",
    fullName: "Eastern European Time",
    utcOffset: "UTC+02:00",
    explanation:
      "Egypt sits one hour ahead of Central Europe. Cairo has switched daylight saving policy several times, so it currently stays fixed year-round.",
  },
  {
    id: "moscow",
    city: "Moscow",
    country: "Russia",
    timeZone: "Europe/Moscow",
    abbreviation: "MSK",
    fullName: "Moscow Standard Time",
    utcOffset: "UTC+03:00",
    explanation:
      "Russia abolished daylight saving time in 2014 and keeps Moscow Time fixed at UTC+03:00 throughout the year.",
  },
  {
    id: "dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    timeZone: "Asia/Dubai",
    abbreviation: "GST",
    fullName: "Gulf Standard Time",
    utcOffset: "UTC+04:00",
    explanation:
      "The UAE does not observe daylight saving, so Gulf Standard Time is a reliable fixed offset for scheduling calls year-round.",
  },
  {
    id: "karachi",
    city: "Karachi",
    country: "Pakistan",
    timeZone: "Asia/Karachi",
    abbreviation: "PKT",
    fullName: "Pakistan Standard Time",
    utcOffset: "UTC+05:00",
    explanation:
      "Pakistan Standard Time is a whole-hour offset, unlike some of its South Asian neighbors that use half-hour offsets.",
  },
  {
    id: "delhi",
    city: "New Delhi",
    country: "India",
    timeZone: "Asia/Kolkata",
    abbreviation: "IST",
    fullName: "India Standard Time",
    utcOffset: "UTC+05:30",
    explanation:
      "India uses a single time zone for the entire country, offset by a half hour rather than a full hour from UTC.",
  },
  {
    id: "dhaka",
    city: "Dhaka",
    country: "Bangladesh",
    timeZone: "Asia/Dhaka",
    abbreviation: "BST",
    fullName: "Bangladesh Standard Time",
    utcOffset: "UTC+06:00",
    explanation:
      "Bangladesh Standard Time sits a further half hour ahead of India, illustrating how offsets can shift in small increments across borders.",
  },
  {
    id: "bangkok",
    city: "Bangkok",
    country: "Thailand",
    timeZone: "Asia/Bangkok",
    abbreviation: "ICT",
    fullName: "Indochina Time",
    utcOffset: "UTC+07:00",
    explanation:
      "Indochina Time covers Thailand, Vietnam, and Cambodia. It is a fixed offset with no daylight saving adjustment.",
  },
  {
    id: "shanghai",
    city: "Shanghai",
    country: "China",
    timeZone: "Asia/Shanghai",
    abbreviation: "CST",
    fullName: "China Standard Time",
    utcOffset: "UTC+08:00",
    explanation:
      "China spans a geographic area wide enough for five time zones but legally uses only one, China Standard Time, nationwide.",
  },
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    timeZone: "Asia/Tokyo",
    abbreviation: "JST",
    fullName: "Japan Standard Time",
    utcOffset: "UTC+09:00",
    explanation:
      "Japan Standard Time is fixed year-round. Japan does not observe daylight saving time.",
  },
  {
    id: "sydney",
    city: "Sydney",
    country: "Australia",
    timeZone: "Australia/Sydney",
    abbreviation: "AEST / AEDT",
    fullName:
      "Australian Eastern Standard Time / Australian Eastern Daylight Time",
    utcOffset: "UTC+10:00 / +11:00 (DST)",
    explanation:
      "Australia's daylight saving runs opposite to the Northern Hemisphere's, so Sydney springs forward around October and back in April.",
  },
  {
    id: "auckland",
    city: "Auckland",
    country: "New Zealand",
    timeZone: "Pacific/Auckland",
    abbreviation: "NZST / NZDT",
    fullName: "New Zealand Standard Time / New Zealand Daylight Time",
    utcOffset: "UTC+12:00 / +13:00 (DST)",
    explanation:
      "New Zealand is one of the first places on Earth to see a new day, and it also observes Southern Hemisphere daylight saving.",
  },
  {
    id: "apia",
    city: "Apia",
    country: "Samoa",
    timeZone: "Pacific/Apia",
    abbreviation: "WST / WSDT",
    fullName: "Samoa Standard Time / Samoa Daylight Time",
    utcOffset: "UTC+13:00 / +14:00 (DST)",
    explanation:
      "Samoa jumped across the International Date Line in 2011, moving from UTC-11:00 to UTC+13:00 to trade more easily with New Zealand and Australia.",
  },
  {
    id: "honolulu",
    city: "Honolulu",
    country: "United States",
    timeZone: "Pacific/Honolulu",
    abbreviation: "HST",
    fullName: "Hawaii-Aleutian Standard Time",
    utcOffset: "UTC-10:00",
    explanation:
      "Hawaii is one of only two U.S. states that does not observe daylight saving time, so its offset never moves.",
  },
  {
    id: "anchorage",
    city: "Anchorage",
    country: "United States",
    timeZone: "America/Anchorage",
    abbreviation: "AKST / AKDT",
    fullName: "Alaska Standard Time / Alaska Daylight Time",
    utcOffset: "UTC-09:00 / -08:00 (DST)",
    explanation:
      "Alaska Time is an hour behind the U.S. Pacific coast and still shifts forward each spring for daylight saving.",
  },
  {
    id: "los-angeles",
    city: "Los Angeles",
    country: "United States",
    timeZone: "America/Los_Angeles",
    abbreviation: "PST / PDT",
    fullName: "Pacific Standard Time / Pacific Daylight Time",
    utcOffset: "UTC-08:00 / -07:00 (DST)",
    explanation:
      "Pacific Time covers the U.S. West Coast. It shifts to Pacific Daylight Time for most of the year.",
  },
  {
    id: "denver",
    city: "Denver",
    country: "United States",
    timeZone: "America/Denver",
    abbreviation: "MST / MDT",
    fullName: "Mountain Standard Time / Mountain Daylight Time",
    utcOffset: "UTC-07:00 / -06:00 (DST)",
    explanation:
      "Mountain Time sits between the Pacific and Central zones and follows the same U.S. daylight saving schedule.",
  },
  {
    id: "chicago",
    city: "Chicago",
    country: "United States",
    timeZone: "America/Chicago",
    abbreviation: "CST / CDT",
    fullName: "Central Standard Time / Central Daylight Time",
    utcOffset: "UTC-06:00 / -05:00 (DST)",
    explanation:
      "Central Time covers much of the central United States, one hour behind New York for most of the year.",
  },
  {
    id: "new-york",
    city: "New York",
    country: "United States",
    timeZone: "America/New_York",
    abbreviation: "EST / EDT",
    fullName: "Eastern Standard Time / Eastern Daylight Time",
    utcOffset: "UTC-05:00 / -04:00 (DST)",
    explanation:
      "Eastern Time governs the U.S. East Coast and is the reference most American business hours are quoted against.",
  },
  {
    id: "sao-paulo",
    city: "Sao Paulo",
    country: "Brazil",
    timeZone: "America/Sao_Paulo",
    abbreviation: "BRT",
    fullName: "Brasília Time",
    utcOffset: "UTC-03:00",
    explanation:
      "Brazil's most populous time zone stopped observing daylight saving time in 2019, so it now stays fixed year-round.",
  },
  {
    id: "buenos-aires",
    city: "Buenos Aires",
    country: "Argentina",
    timeZone: "America/Argentina/Buenos_Aires",
    abbreviation: "ART",
    fullName: "Argentina Time",
    utcOffset: "UTC-03:00",
    explanation:
      "Argentina shares the same offset as Brazil's Sao Paulo but reaches it independently, since neighboring countries do not always align on time policy.",
  },
];

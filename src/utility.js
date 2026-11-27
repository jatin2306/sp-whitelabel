export function sortAz(items, getLabel = (item) => item.label) {
  return [...items].sort((left, right) =>
    String(getLabel(left)).localeCompare(String(getLabel(right)), "en", {
      sensitivity: "base",
    }),
  );
}

export function mapAirportDropdownOptions(airports) {
  const options = airports.map((airport) => ({
    value: airport._id,
    label: `${airport.city} (${airport.iata_code}) — ${airport.name}`,
  }));

  return sortAz(options, (item) => item.label);
}

export function mapAirlineDropdownOptions(airlines) {
  const options = airlines.map((airline) => ({
    value: airline._id,
    label: `${airline.name} (${airline.iata_code})`,
    airline_id: airline.airline_id,
    name: airline.name,
    iata_code: airline.iata_code,
    verification_rules_by_flight_type:
      airline.verification_rules_by_flight_type,
  }));

  return sortAz(options, (item) => item.label);
}

function validWindowHours(start, end) {
  if (!/^\d{2}$/.test(start) || !/^\d{2}$/.test(end) || start === end) {
    return false;
  }
  const startHour = Number(start);
  const endHour = Number(end);
  return startHour >= 0 && startHour <= 23 && endHour >= 0 && endHour <= 23;
}

function normalizeWindowKey(value) {
  const text = String(value || "")
    .trim()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, "");
  const match = /^(\d{1,2})-(\d{1,2})$/.exec(text);
  if (!match) return "";
  const start = match[1].padStart(2, "0");
  const end = match[2].padStart(2, "0");
  return validWindowHours(start, end) ? `${start}-${end}` : "";
}

function windowKeyFromClock(startTime, endTime) {
  const start = String(startTime || "").match(/(\d{1,2}):\d{2}/);
  const end = String(endTime || "").match(/(\d{1,2}):\d{2}/);
  if (!start || !end) return "";
  return normalizeWindowKey(`${start[1]}-${end[1]}`);
}

export function pickupWindowKey(slot = {}) {
  const candidates = [
    slot.pickup_time_window_key,
    slot.key,
    slot.slot_key,
    slot.window_key,
  ];
  for (const candidate of candidates) {
    const key = normalizeWindowKey(candidate);
    if (key) return key;
  }

  const fromClock = windowKeyFromClock(slot.start_time, slot.end_time);
  if (fromClock) return fromClock;

  const label = String(slot.label || slot.slot_label || "").replace(
    /[–—−]/g,
    "-",
  );
  const ranged = label.match(/(\d{1,2}):\d{2}\s*-\s*(\d{1,2}):\d{2}/);
  return ranged ? normalizeWindowKey(`${ranged[1]}-${ranged[2]}`) : "";
}

export function mapTimeslotOptions(time_slots) {
  return (time_slots || []).map((slot) => ({
    value: slot.slot_id || slot.id || slot._id,
    label: slot.label || slot.slot_label || "",
    key:
      slot.pickup_time_window_key ||
      slot.key ||
      slot.window_key ||
      "",
    start_time: slot.start_time,
    end_time: slot.end_time,
    available: slot.available,
    reason: slot.reason,
  }));
}

export function localIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const FLIGHT_LEAD_MS = 48 * 60 * 60 * 1000;

export function minFlightDate() {
  return localIsoDate(new Date(Date.now() + FLIGHT_LEAD_MS));
}

export function isFlightAtLeast48HoursAhead(date, time) {
  if (!date || !time) return false;
  const flight = new Date(`${date}T${time}`);
  if (Number.isNaN(flight.getTime())) return false;
  return flight.getTime() - Date.now() >= FLIGHT_LEAD_MS;
}

export function isValidContactNumber(value, countryId) {
  let digits = String(value || "").replace(/\D/g, "");

  if (countryId === "IN") {
    if (digits.startsWith("91")) {
      digits = digits.slice(2);
    }

    return /^[6-9]\d{9}$/.test(digits);
  }

  return /^\d{7,15}$/.test(digits);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function mediaUrl(media) {
  if (!media) return "";
  if (typeof media === "string") {
    return /^https?:\/\//i.test(media) ? media : "";
  }

  const seen = new Set();
  const visit = (value) => {
    if (!value || seen.has(value)) return "";
    if (typeof value === "string") {
      return /^https?:\/\//i.test(value) ? value : "";
    }
    if (typeof value !== "object") return "";
    seen.add(value);

    const preferred = [
      value.url,
      value.file_url,
      value.secure_url,
      value.cdn_url,
      value.signed_url,
      value.media_url,
      value.Location,
      value.location,
      value.href,
      value.src,
      value.link,
      value.path,
    ];
    for (const item of preferred) {
      const found = visit(item);
      if (found) return found;
    }

    for (const nested of [
      value.data,
      value.file,
      value.media,
      value.result,
      value.payload,
      value.files?.[0],
    ]) {
      const found = visit(nested);
      if (found) return found;
    }
    return "";
  };

  return visit(media);
}

export function contactDigits(code, number) {
  const dial = String(code || "").replace(/\D/g, "");
  const digits = String(number || "").replace(/\D/g, "");

  if (!digits) return "";

  if (dial && digits.startsWith(dial)) {
    return `+${digits}`;
  }

  return `+${dial}${digits}`;
}

export const DOC_LABELS = {
  passport: "Passport",
  boarding_pass: "Boarding pass",
  national_id: "National ID",
};

export function documentFieldKey(rule) {
  return String(rule?.ui_field || rule?.rule_type || "")
    .toLowerCase()
    .replace(/-/g, "_");
}

export function getVerificationRules(data) {
  const key = String(data?.flightType || "").toUpperCase();
  const rules = data?.verification_rules_by_flight_type?.[key];
  return Array.isArray(rules) ? rules : [];
}

export function getVisibleVerificationRules(data) {
  return getVerificationRules(data).filter(
    (rule) => documentFieldKey(rule) !== "boarding_pass",
  );
}

export function isFileDocument(rule) {
  const field = documentFieldKey(rule);
  return (
    field === "passport" || field === "boarding_pass" || field === "national_id"
  );
}

export function documentLabel(rule) {
  const field = documentFieldKey(rule);
  return (
    DOC_LABELS[field] || String(rule?.rule_type || field).replace(/_/g, " ")
  );
}

export function weightLimits(weightCheck) {
  const perPassenger = weightCheck?.per_passenger;
  const caps = [
    perPassenger?.max_weight_kg_per_bag,
    weightCheck?.platform_bag_max_kg,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  const total = Number(perPassenger?.total_checked_weight_kg);
  const bagsAllowed = Number(perPassenger?.checked_bags_allowed);

  return {
    maxKg: caps.length ? Math.min(...caps) : null,
    totalKg: Number.isFinite(total) && total > 0 ? total : null,
    bagsAllowed:
      Number.isFinite(bagsAllowed) && bagsAllowed > 0 ? bagsAllowed : null,
  };
}

export function bagWeightError(weight, maxKg, { required = true } = {}) {
  const raw = String(weight ?? "").trim();
  if (!raw) return required ? "Enter weight" : "";
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return "Enter a valid weight";
  if (maxKg != null && value > maxKg) {
    return `Weight cannot be more than ${maxKg} kg`;
  }
  return "";
}

export function bagPhotoList(bag) {
  if (Array.isArray(bag?.photos)) return bag.photos;
  return bag?.photo ? [bag.photo] : [];
}

export function anyDocumentUploading(data) {
  const bookingDocs = Object.values(data?.docs || {}).some(
    (item) => item?.uploading,
  );
  const passports = (data?.bagPassengers || []).some((passenger) => {
    if (passenger?.passport?.uploading) return true;
    return Object.values(passenger?.documents || {}).some(
      (item) => item?.uploading,
    );
  });
  return bookingDocs || passports;
}

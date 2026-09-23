export function sortAz(items, getLabel = (item) => item.label) {
  return [...items].sort((left, right) =>
    String(getLabel(left)).localeCompare(String(getLabel(right)), 'en', {
      sensitivity: 'base',
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
    verification_rules_by_flight_type: airline.verification_rules_by_flight_type,
  }));

  return sortAz(options, (item) => item.label);
}

export function mapTimeslotOptions(time_slots) {
  return time_slots.map((slot) => ({
    value: slot.slot_id,
    label: slot.label,
    key: slot.key,
    start_time: slot.start_time,
    end_time: slot.end_time,
    available: slot.available,
    reason: slot.reason,
  }));
}

export function localIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function minFlightDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return localIsoDate(date);
}

export function isFlightAtLeast24HoursAhead(date, time) {
  if (!date || !time) return false;
  const flight = new Date(`${date}T${time}`);
  if (Number.isNaN(flight.getTime())) return false;
  return flight.getTime() - Date.now() >= 24 * 60 * 60 * 1000;
}

export function isValidContactNumber(value, countryId) {
  const digits = String(value || '').replace(/\D/g, '');
  if (countryId === 'IN') return /^[6-9]\d{9}$/.test(digits);
  return /^\d{7,15}$/.test(digits);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function mediaUrl(media) {
  if (!media) return '';
  if (typeof media === 'string') {
    return /^https?:\/\//i.test(media) ? media : '';
  }

  const seen = new Set();
  const visit = (value) => {
    if (!value || seen.has(value)) return '';
    if (typeof value === 'string') {
      return /^https?:\/\//i.test(value) ? value : '';
    }
    if (typeof value !== 'object') return '';
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
    return '';
  };

  return visit(media);
}

export function contactDigits(code, number) {
  const dial = String(code || '').replace(/\D/g, '');
  const local = String(number || '').replace(/\D/g, '');
  if (!dial && !local) return '';
  return `+${dial}${local}`;
}

export const DOC_LABELS = {
  passport: 'Passport',
  boarding_pass: 'Boarding pass',
  national_id: 'National ID',
};

export function documentFieldKey(rule) {
  return String(rule?.ui_field || rule?.rule_type || '')
    .toLowerCase()
    .replace(/-/g, '_');
}

export function getVerificationRules(data) {
  const key = String(data?.flightType || '').toUpperCase();
  const rules = data?.verification_rules_by_flight_type?.[key];
  return Array.isArray(rules) ? rules : [];
}

export function getVisibleVerificationRules(data) {
  return getVerificationRules(data).filter(
    (rule) => documentFieldKey(rule) !== 'boarding_pass',
  );
}

export function isFileDocument(rule) {
  const field = documentFieldKey(rule);
  return field === 'passport' || field === 'boarding_pass';
}

export function documentLabel(rule) {
  const field = documentFieldKey(rule);
  return DOC_LABELS[field] || String(rule?.rule_type || field).replace(/_/g, ' ');
}

export function anyDocumentUploading(data) {
  return Object.values(data?.docs || {}).some((item) => item?.uploading);
}

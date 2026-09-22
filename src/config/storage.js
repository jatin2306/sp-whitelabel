import { mediaUrl } from '../utility';

const STORAGE_KEY = 'sp-whitelabel-booking';

function serializeBooking(data) {
  const { passport, boardingPass, docs, bagPassengers, ...rest } = data;
  const serializeDoc = (doc) =>
    doc
      ? {
          name: doc.name,
          type: doc.type,
          size: doc.size,
          media: doc.media ?? null,
          url: doc.url || mediaUrl(doc.media),
          value: doc.value,
        }
      : null;

  const nextDocs = {};
  Object.entries(docs || {}).forEach(([key, doc]) => {
    nextDocs[key] = serializeDoc(doc);
  });

  return {
    ...rest,
    docs: nextDocs,
    passport: serializeDoc(passport || docs?.passport),
    boardingPass: serializeDoc(boardingPass || docs?.boarding_pass),
    bagPassengers: (bagPassengers || []).map((passenger) => ({
      ...passenger,
      bags: (passenger.bags || []).map((bag) => ({
        ...bag,
        photo: bag.photo
          ? {
              name: bag.photo.name,
              type: bag.photo.type,
              media: bag.photo.media ?? null,
              url: bag.photo.url || mediaUrl(bag.photo.media),
            }
          : null,
      })),
    })),
  };
}

export function saveBooking(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeBooking(data)));
}

export function loadBooking() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearBooking() {
  localStorage.removeItem(STORAGE_KEY);
}

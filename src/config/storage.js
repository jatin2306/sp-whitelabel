import { bagPhotoList, mediaUrl } from '../utility';

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
      passport: serializeDoc(passenger.passport),
      documents: Object.fromEntries(
        Object.entries(passenger.documents || {}).map(([key, doc]) => [
          key,
          serializeDoc(doc),
        ]),
      ),
      bags: (passenger.bags || []).map((bag) => ({
        ...bag,
        photo: null,
        photos: bagPhotoList(bag).map((photo) => ({
          id: photo.id,
          name: photo.name,
          type: photo.type,
          media: photo.media ?? null,
          url: photo.url || mediaUrl(photo.media),
        })),
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

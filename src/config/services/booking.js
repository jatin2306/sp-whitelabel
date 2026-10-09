import API from "../endpoint";
import axiosInstance from "../axiosInstance";
import {
  BAG_SIZES,
  CABIN_CLASSES,
  formatPickupAddress,
} from "../../booking/catalog";
import { bagPhotoList, contactDigits, mediaUrl } from "../../utility";

export function buildBookingPayload(data) {
  const cabin = CABIN_CLASSES.find((item) => item.id === data.cabinClass);

  const bagSize = (id) => BAG_SIZES.find((item) => item.id === id)?.name || id;

  const passengerPassport = (data.bagPassengers || [])
    .map(
      (passenger) =>
        passenger.passport?.url || mediaUrl(passenger.passport?.media),
    )
    .find(Boolean);

  const passportUrl =
    passengerPassport ||
    data.docs?.passport?.url ||
    mediaUrl(data.docs?.passport?.media) ||
    data.passport?.url ||
    mediaUrl(data.passport?.media);

  const boardingPassUrl =
    data.docs?.boarding_pass?.url ||
    mediaUrl(data.docs?.boarding_pass?.media) ||
    data.boardingPass?.url ||
    mediaUrl(data.boardingPass?.media);

  const nationalIdUrl =
    (data.bagPassengers || [])
      .map(
        (passenger) =>
          passenger.documents?.national_id?.url ||
          mediaUrl(passenger.documents?.national_id?.media),
      )
      .find(Boolean) ||
    data.docs?.national_id?.url ||
    mediaUrl(data.docs?.national_id?.media) ||
    data.nationalId?.url ||
    mediaUrl(data.nationalId?.media);

  const verification_documents = {
    passport: passportUrl,
  };

  if (boardingPassUrl) {
    verification_documents.boarding_pass = boardingPassUrl;
  }

  if (nationalIdUrl) {
    verification_documents.national_id = nationalIdUrl;
  }

  const payload = {
    email: String(data.email || "").trim(),

    service_type: data.serviceType === "ARRIVAL" ? "ARRIVAL" : "DEPARTURE",

    airline_id: data.airline,

    airport_id: data.airport,

    flight_type: String(data.flightType || "").toUpperCase(),

    cabin_class: cabin?.name,

    verification_documents,

    flight_date: data.date,

    flight_time: String(data.time || "").slice(0, 5),

    flight_number: String(data.flightNumber || "").trim(),

    pickup: {
      type: "CURRENT_LOCATION",
      label: data.address1 || data.city || "Pickup",
      address: formatPickupAddress(data),
      lat: data.latitude,
      lng: data.longitude,
    },

    pickup_contact: {
      room: data.floor,
      address_line_1: data.address1,
      address_line_2: data.address2,
      city: data.city,
      postal_code: data.postalCode,
      country: data.country,
      contact_no: contactDigits(data.phoneCode, data.phone),
    },

    pickup_date: data.slotDate,

    pickup_time_window_key:
      (data.start_time && data.end_time
        ? `${String(data.start_time).slice(0, 5)}–${String(data.end_time).slice(0, 5)}`
        : '') ||
      data.slot_label ||
      data.slot_key ||
      data.slotTime,

    passengers: (data.bagPassengers || []).map((passenger) => ({
      full_name: String(passenger.name || "").trim(),
      national_id:
        passenger.documents?.national_id?.url ||
        mediaUrl(passenger.documents?.national_id?.media) ||
        undefined,

      bags: (passenger.bags || []).map((bag) => ({
        bag_size: bagSize(bag.size),
        weight_kg: Number(bag.weight),
        bag_name: String(bag.name || "").trim(),

        photo_urls: bagPhotoList(bag)
          .map((photo) => photo.url || mediaUrl(photo.media))
          .filter(Boolean),
      })),
    })),
  };

  if (data.altPhone) {
    payload.pickup_contact.alternate_contact = contactDigits(
      data.altPhoneCode,
      data.altPhone,
    );
  }

  return payload;
}

const createBooking = async (data) => {
  const response = await axiosInstance.post(
    API.createBooking,
    buildBookingPayload(data),
  );

  return response.data;
};

export const getCheckout = async (checkoutId) => {
  const response = await axiosInstance.get(`${API.getCheckout}/${checkoutId}`);

  return response.data;
};

export default createBooking;

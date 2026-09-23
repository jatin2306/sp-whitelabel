import API from '../endpoint';
import axiosInstance from '../axiosInstance';
import { BAG_SIZES, CABIN_CLASSES, formatPickupAddress } from '../../booking/catalog';
import { contactDigits, mediaUrl } from '../../utility';

export function buildBookingPayload(data) {
  const cabin = CABIN_CLASSES.find((item) => item.id === data.cabinClass);
  const bagSize = (id) => BAG_SIZES.find((item) => item.id === id)?.name || id;
  const passportUrl =
    data.docs?.passport?.url ||
    mediaUrl(data.docs?.passport?.media) ||
    data.passport?.url ||
    mediaUrl(data.passport?.media);
  const boardingPassUrl =
    data.docs?.boarding_pass?.url ||
    mediaUrl(data.docs?.boarding_pass?.media) ||
    data.boardingPass?.url ||
    mediaUrl(data.boardingPass?.media);
  const verification_documents = {
    passport: passportUrl,
  };
  if (boardingPassUrl) {
    verification_documents.boarding_pass = boardingPassUrl;
  }

  const payload = {
    email: String(data.email || '').trim(),
    service_type: 'DEPARTURE',
    airline_id: data.airline,
    airport_id: data.airport,
    flight_type: String(data.flightType || '').toUpperCase(),
    cabin_class: cabin?.name,
    verification_documents,
    flight_date: data.date,
    flight_time: String(data.time || '').slice(0, 5),
    flight_number: String(data.flightNumber || '').trim(),
    pickup: {
      type: 'CURRENT_LOCATION',
      label: data.address1 || data.city || 'Pickup',
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
    pickup_time_window_key: data.slot_key || data.slotTime,
    passengers: (data.bagPassengers || []).map((passenger) => ({
      full_name: String(passenger.name || '').trim(),
      bags: (passenger.bags || []).map((bag) => ({
        bag_size: bagSize(bag.size),
        weight_kg: Number(bag.weight),
        bag_name: String(bag.name || '').trim(),
        photo_urls: [
          bag.photo?.url || mediaUrl(bag.photo?.media),
        ].filter(Boolean),
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
  const response = await axiosInstance.get(
    `${API.getCheckout}/${checkoutId}`,
  );
  return response.data;
};

export default createBooking;

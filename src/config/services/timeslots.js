import API from '../endpoint';
import axiosInstance from '../axiosInstance';

const getTimeslots = async ({
  lat,
  lng,
  airport_id,
  pickup_date,
  total_bags,
  total_weight_kg,
  flight_date,
  flight_time,
}) => {
  const params = {
    lat,
    lng,
    airport_id,
    pickup_date,
    total_bags,
    total_weight_kg,
  };

  if (flight_date && flight_time) {
    params.flight_date = flight_date;
    params.flight_time = flight_time;
  }

  const response = await axiosInstance.get(API.getTimeslots, { params });
  return response.data;
};

export default getTimeslots;

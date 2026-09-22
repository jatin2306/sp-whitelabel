import API from '../endpoint';
import axiosInstance from '../axiosInstance';

const checkWeight = async ({
  airline_id,
  flight_type,
  passenger_count,
  cabin_class,
}) => {
  const response = await axiosInstance.post(API.checkWeight, {
    airline_id,
    flight_type,
    passenger_count,
    cabin_class,
  });
  return response.data;
};

export default checkWeight;

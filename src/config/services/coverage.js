import API from '../endpoint';
import axiosInstance from '../axiosInstance';

const getPickupCoverage = async ({ lat, lng, airport_id }) => {
  const response = await axiosInstance.get(API.getPickupCoverage, {
    params: { lat, lng, airport_id },
  });
  return response.data;
};

export default getPickupCoverage;

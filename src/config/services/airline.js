import API from '../endpoint';
import axiosInstance from '../axiosInstance';

const getAirlines = async (airport_id) => {
  const response = await axiosInstance.get(API.getAirlines, {
    params: { airport_id },
  });
  return response.data;
};

export default getAirlines;

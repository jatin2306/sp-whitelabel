import API from '../endpoint';
import axiosInstance from '../axiosInstance';

const getAirports = async () => {
  const response = await axiosInstance.get(API.getAirports);
  return response.data;
};

export default getAirports;

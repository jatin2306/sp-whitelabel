import API from '../endpoint';
import axiosInstance from '../axiosInstance';
import { mediaUrl } from '../../utility';

const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post(API.uploadMedia, formData, {
    baseURL: import.meta.env.VITE_BASE_COMMON_URL,
  });

  const payload = response.data;
  const url = mediaUrl(payload);
  return { ...payload, url };
};

export default uploadMedia;

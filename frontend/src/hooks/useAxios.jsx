import axios from 'axios';

const BASE_URL = 'https://expense-1myv.onrender.com';

const useAxios = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
};

export default useAxios;

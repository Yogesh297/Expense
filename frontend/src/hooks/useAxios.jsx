import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

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
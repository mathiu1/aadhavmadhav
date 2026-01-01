import axios from "axios";

const api = axios.create({
  baseURL: "https://aadhavmadhav.onrender.com/api",
});

// Add a request interceptor to include the token in headers if it exists
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

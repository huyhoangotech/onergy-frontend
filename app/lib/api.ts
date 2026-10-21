import axios from "axios";

export const api = axios.create({
 baseURL: "http://localhost:5000",
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // Nếu request đã tự truyền Authorization thì giữ nguyên
      if (!config.headers.Authorization) {
        const token =
          localStorage.getItem("adminToken");

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);
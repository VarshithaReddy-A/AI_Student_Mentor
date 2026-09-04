import axios from "axios";

const api = axios.create({
  baseURL: "https://ai-student-mentor-n1cb.onrender.com",
});

export default api;

import axios from "axios";

// A separate connection with NO admin token: clients never log in.
const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

export const loadGallery = (token) => client.get(`/client/${token}/`).then((r) => r.data);

export const setSelected = (token, photoId, selected) =>
  client.post(`/client/${token}/select/`, { photo_id: photoId, selected }).then((r) => r.data);

export const submitSelection = (token) => client.post(`/client/${token}/submit/`).then((r) => r.data);

export function clientError(error) {
  if (!error.response) return "Can't reach the server. Please try again in a moment.";
  if (error.response.status === 404) return "This link is not valid. Please check it with your photographer.";
  return error.response.data?.detail || "Something went wrong. Please try again.";
}

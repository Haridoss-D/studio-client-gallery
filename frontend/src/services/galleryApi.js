import api from "./api";

// Every function here calls one Django API endpoint.
export const getDashboard = () => api.get("/admin/dashboard/").then((r) => r.data);
export const listGalleries = () => api.get("/admin/galleries/").then((r) => r.data);
export const getGallery = (id) => api.get(`/admin/galleries/${id}/`).then((r) => r.data);
export const createGallery = (data) => api.post("/admin/galleries/", data).then((r) => r.data);
export const updateGallery = (id, data) => api.patch(`/admin/galleries/${id}/`, data).then((r) => r.data);
export const deleteGallery = (id) => api.delete(`/admin/galleries/${id}/`);
export const reopenGallery = (id) => api.post(`/admin/galleries/${id}/reopen/`).then((r) => r.data);
export const completeGallery = (id) => api.post(`/admin/galleries/${id}/complete/`).then((r) => r.data);

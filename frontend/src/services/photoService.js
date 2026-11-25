import api from "./api";

export const listPhotos = (galleryId) =>
  api.get(`/admin/galleries/${galleryId}/photos/`).then((r) => r.data);

// Sends one photo to Django, which stores it in Cloudinary and saves a row in Neon.
export function uploadPhoto(galleryId, file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  return api
    .post(`/admin/galleries/${galleryId}/photos/`, form, {
      onUploadProgress: (e) => onProgress(Math.round((e.loaded / (e.total || file.size)) * 100)),
    })
    .then((r) => r.data);
}

export const deletePhoto = (photoId) => api.delete(`/admin/photos/${photoId}/`);

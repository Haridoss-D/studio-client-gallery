import api from "./api";

export const getSelected = (galleryId) =>
  api.get(`/admin/galleries/${galleryId}/selected/`).then((r) => r.data);

// The ZIP is a file, so we ask for it as a "blob" and save it in the browser.
export async function downloadZip(galleryId) {
  try {
    const res = await api.get(`/admin/galleries/${galleryId}/selected/zip/`, { responseType: "blob" });
    return res.data;
  } catch (err) {
    // Error answers also arrive as a blob, so read the text inside.
    if (err.response?.data instanceof Blob) {
      try {
        const detail = JSON.parse(await err.response.data.text()).detail;
        throw new Error(detail || "Could not create the ZIP.");
      } catch (inner) {
        if (inner instanceof Error && inner.message !== "Unexpected end of JSON input") throw inner;
      }
    }
    throw new Error("Could not create the ZIP. Is the backend running?");
  }
}

export function saveFile(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

import { createContext, useContext, useEffect, useState } from "react";

// TEMPORARY storage so you can test the screens.
// In the backend step this file will call the Django API instead,
// and the data will live in Neon PostgreSQL.
const KEY = "sf_temp_galleries";
const GalleryContext = createContext(null);

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function GalleryProvider({ children }) {
  const [galleries, setGalleries] = useState(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(galleries));
  }, [galleries]);

  function addGallery(data) {
    const gallery = {
      ...data,
      id: crypto.randomUUID(),
      token: crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", ""),
      status: "pending",
      photos: 0,
      selected: 0,
      createdAt: new Date().toISOString(),
    };
    setGalleries((list) => [gallery, ...list]);
    return gallery;
  }

  function updateGallery(id, patch) {
    setGalleries((list) => list.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function deleteGallery(id) {
    setGalleries((list) => list.filter((g) => g.id !== id));
  }

  return (
    <GalleryContext.Provider value={{ galleries, addGallery, updateGallery, deleteGallery }}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGalleries() {
  return useContext(GalleryContext);
}

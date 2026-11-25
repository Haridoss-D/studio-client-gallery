// TEMPORARY sample photos (one per uploaded photo), same ones the client sees.
// In the backend step the real Cloudinary photos come from the Django API.
export function makePhotos(gallery) {
  const heights = [800, 600, 700];
  return Array.from({ length: gallery.photos }, (_, i) => {
    const h = heights[i % 3];
    const seed = `${gallery.token.slice(0, 8)}${i}`;
    return {
      id: i,
      name: `photo-${i + 1}.jpg`,
      thumb: `https://picsum.photos/seed/${seed}/600/${h}`,
      full: `https://picsum.photos/seed/${seed}/1600/${Math.round((h / 600) * 1600)}`,
    };
  });
}

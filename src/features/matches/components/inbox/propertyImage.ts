// Neutral real-estate placeholder images used when a property has no uploaded photo.
const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=70&auto=format&fit=crop", // commercial building
  "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1600&q=70&auto=format&fit=crop", // multifamily
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=70&auto=format&fit=crop", // office interior
  "https://images.unsplash.com/photo-1448630360428-65456885c650?w=1600&q=70&auto=format&fit=crop", // mixed-use
  "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1600&q=70&auto=format&fit=crop", // industrial
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=70&auto=format&fit=crop", // building exterior
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=70&auto=format&fit=crop", // street view
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1600&q=70&auto=format&fit=crop", // interior
];

export function propertyImage(url: string | null | undefined, key: string): string {
  if (url) return url;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h + key.charCodeAt(i)) | 0;
  return PLACEHOLDERS[Math.abs(h) % PLACEHOLDERS.length];
}

/** Deterministic gallery of N images for a property. First entry is the hero. */
export function propertyImages(url: string | null | undefined, key: string, count = 8): string[] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h + key.charCodeAt(i)) | 0;
  const start = Math.abs(h) % PLACEHOLDERS.length;
  const gallery: string[] = [];
  for (let i = 0; i < count; i++) {
    gallery.push(PLACEHOLDERS[(start + i) % PLACEHOLDERS.length]);
  }
  if (url) gallery[0] = url;
  return gallery;
}

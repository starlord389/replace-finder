// Neutral real-estate placeholder images used when a property has no uploaded photo.
const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=70&auto=format&fit=crop", // commercial building
  "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=70&auto=format&fit=crop", // multifamily
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=70&auto=format&fit=crop", // office interior
  "https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&q=70&auto=format&fit=crop", // mixed-use
  "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800&q=70&auto=format&fit=crop", // industrial
];

export function propertyImage(url: string | null | undefined, key: string): string {
  if (url) return url;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h + key.charCodeAt(i)) | 0;
  return PLACEHOLDERS[Math.abs(h) % PLACEHOLDERS.length];
}

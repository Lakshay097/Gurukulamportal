// Generate a URL-friendly slug from a folder name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Create a slug-plus-ID pattern for routing (e.g., "standard-operating-procedures-1eW2fw7tYM0Lg3eOTYRZ7Av3CEJfUikm2")
export function createSlugWithId(name: string, id: string): string {
  const slug = generateSlug(name);
  return `${slug}-${id}`;
}

// Extract the ID from a slug-plus-ID pattern
// Google Drive IDs are typically 33+ characters and can contain letters, numbers, hyphens, and underscores
export function extractIdFromSlug(slugWithId: string): string {
  // The slug part only contains lowercase letters, numbers, and hyphens
  // Drive IDs can contain uppercase letters and underscores
  // We find the position where uppercase letters start (beginning of Drive ID)
  const uppercaseIndex = slugWithId.search(/[A-Z]/);
  
  if (uppercaseIndex > 0) {
    // Find the hyphen before the uppercase letter
    const hyphenIndex = slugWithId.lastIndexOf('-', uppercaseIndex);
    if (hyphenIndex > 0) {
      return slugWithId.substring(hyphenIndex + 1);
    }
  }
  
  // Fallback: if no uppercase found, try to extract last part after last hyphen
  const parts = slugWithId.split('-');
  return parts[parts.length - 1];
}

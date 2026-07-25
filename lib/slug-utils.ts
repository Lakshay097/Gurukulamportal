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
export function extractIdFromSlug(slugWithId: string): string {
  const parts = slugWithId.split('-');
  // The ID is the last part (assuming IDs don't contain hyphens)
  // If the ID contains hyphens, we need a different approach
  // For Google Drive IDs, they typically don't contain hyphens
  return parts[parts.length - 1];
}

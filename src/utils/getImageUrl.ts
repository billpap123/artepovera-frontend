// src/utils/getImageUrl.ts

// We need the API base URL to construct the full path
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

export const getImageUrl = (path?: string | null): string => {
  // If no path is provided, return the default image
  if (!path) {
    return '/default-profile.png';
  }

  // If the path is already a full URL (e.g., from Cloudinary), use it directly
  if (path.startsWith('http')) {
    return path;
  }

  // Otherwise, construct the full URL by prepending the backend server's address
  // This also cleans up potential double 'uploads/' paths if they exist
  return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
};
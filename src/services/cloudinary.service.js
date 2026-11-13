// src/services/cloudinary.service.js
//
// Handles uploading files to Cloudinary using an "unsigned upload preset" —
// this means the browser can upload directly to Cloudinary without needing
// our own backend server to sign the request first. Good fit since we
// don't have a backend.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Cloudinary's upload endpoint. "image/upload" handles images;
// there are separate endpoints for video/raw files if we need those later.
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Uploads a single image file to Cloudinary.
 * @param {File} file - the file object from an <input type="file"> element
 * @returns {Promise<string>} the public URL of the uploaded image
 */
export async function uploadImage(file) {
  // Cloudinary's upload API expects "multipart/form-data" —
  // FormData is the browser's built-in way to build that kind of request.
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Image upload failed. Please try again.");
  }

  const data = await response.json();

  // secure_url is the https:// link to the uploaded image —
  // this is what we'll save into Firestore (e.g. users.photoURL).
  return data.secure_url;
}

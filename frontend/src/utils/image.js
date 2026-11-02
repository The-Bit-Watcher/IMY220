// Shrinks an image file in the browser (canvas) and returns a JPEG data URL.
// Keeps uploads well under the backend's 10mb body limit and keeps Mongo documents small.
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export function resizeImage(file, maxSide = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error('Please choose a PNG, JPG, GIF or WEBP image.'));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('Image is too large (max 15MB).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a valid image.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; // transparent PNGs would turn black as JPEG
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

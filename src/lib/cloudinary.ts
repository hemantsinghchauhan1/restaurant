import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

export { cloudinary };

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder = 'restaurant_dishes'
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;

  // Fallback to base64 Data URI if Cloudinary credentials are not set up in .env
  if (!cloudName || !apiKey || cloudName === 'demo') {
    const base64 = fileBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation: [
          { width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          // If Cloudinary errors out, fallback to data URI gracefully
          const base64 = fileBuffer.toString('base64');
          resolve(`data:image/jpeg;base64,${base64}`);
        } else if (result?.secure_url) {
          resolve(result.secure_url);
        } else {
          const base64 = fileBuffer.toString('base64');
          resolve(`data:image/jpeg;base64,${base64}`);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Transforms Cloudinary URLs into production-optimized URLs (auto-format WebP/AVIF, auto-quality, responsive max-width)
 */
export function getOptimizedCloudinaryUrl(url: string, width = 800): string {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url;
  }
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

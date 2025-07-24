import sharp from 'sharp';

export const resizeImageFromUrl = async (image: string, size: number = 128) => {
  try {
    // Check if the image URL is a blob URL, which can't be processed on the server
    if (image.startsWith('blob:')) {
      throw new Error('Cannot process blob URLs on the server');
    }

    const url = new URL(image);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const resizedImage = await sharp(Buffer.from(imageBuffer))
      .resize(size, size)
      .jpeg({ quality: 80 })
      .toBuffer();

    const imageFile = new File([resizedImage], 'image.jpeg', {
      type: 'image/jpeg'
    });

    return imageFile;
  } catch (error) {
    console.error('Error resizing image:', error);
    throw new Error('Failed to resize image');
  }
};

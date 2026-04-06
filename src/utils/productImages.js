export const getProductImages = (product = {}) => {
  const candidateImages = [
    ...(Array.isArray(product.imageUrls) ? product.imageUrls : []),
    ...(Array.isArray(product.images) ? product.images : []),
    product.imageUrl,
    product.image,
  ];

  return candidateImages.filter(
    (value, index, array) =>
      typeof value === 'string' &&
      value.trim() &&
      array.indexOf(value) === index
  );
};

export const getOptimizedCloudinaryUrl = (
  url,
  transformation = 'w_400,c_scale'
) => {
  if (typeof url !== 'string' || !url.trim()) {
    return url;
  }

  const marker = '/upload/';

  if (!url.includes('res.cloudinary.com') || !url.includes(marker)) {
    return url;
  }

  if (url.includes(`/${transformation}/`)) {
    return url;
  }

  const [prefix, suffix] = url.split(marker);

  if (!suffix) {
    return url;
  }

  return `${prefix}${marker}${transformation}/${suffix}`;
};

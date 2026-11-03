type StorageClient = {
  storage: {
    from: (bucket: string) => {
      remove: (paths: string[]) => Promise<{ error: unknown }>;
    };
  };
};

export function getProductImagePath(imageUrl: string, bucket: string) {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const path = new URL(imageUrl).pathname;
    const markerIndex = path.indexOf(marker);
    if (markerIndex === -1) return null;
    const objectPath = decodeURIComponent(path.slice(markerIndex + marker.length));
    return objectPath && !objectPath.includes("..") ? objectPath : null;
  } catch {
    return null;
  }
}

export async function removeProductImage(client: StorageClient, imageUrl: string, bucket: string) {
  const path = getProductImagePath(imageUrl, bucket);
  if (!path) return null;
  const { error } = await client.storage.from(bucket).remove([path]);
  return error;
}

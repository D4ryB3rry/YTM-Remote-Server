export function getProxiedImageUrl(url: string): string {
  if (!url) {
    return url;
  }

  if (url.startsWith('/api/proxy/image')) {
    return url;
  }

  try {
    return `/api/proxy/image?url=${encodeURIComponent(url)}`;
  } catch {
    return url;
  }
}

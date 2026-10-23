/**
 * Universal video/file downloader utility
 * Guarantees direct file download to disk rather than opening in browser player.
 */
export async function downloadMediaFile(url: string, filename: string = 'video.mp4') {
  if (!url || typeof window === 'undefined') return;

  const safeFilename = filename.endsWith('.mp4') ? filename : `${filename}.mp4`;

  try {
    // 1. Try direct fetch to create same-origin Blob URL
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);
      return;
    }
  } catch (err) {
    // Cross-origin fetch failed (CORS), use backend download proxy
    console.warn('Direct blob fetch failed, using proxy fallback:', err);
  }

  // 2. Use /api/download route with Content-Disposition: attachment
  const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeFilename)}`;
  const link = document.createElement('a');
  link.href = proxyUrl;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


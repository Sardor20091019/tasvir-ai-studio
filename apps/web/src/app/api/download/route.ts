import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'tasvir-video.mp4';

  if (!rawUrl) {
    return new NextResponse('URL parameter is required', { status: 400 });
  }

  try {
    let targetUrl = rawUrl;
    // Handle relative paths
    if (rawUrl.startsWith('/')) {
      const origin = request.nextUrl.origin;
      targetUrl = `${origin}${rawUrl}`;
    }

    const response = await fetch(targetUrl);
    if (!response.ok) {
      return new NextResponse(`Failed to fetch media: ${response.statusText}`, {
        status: response.status,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'video/mp4';

    const safeFilename = filename.endsWith('.mp4') ? filename : `${filename}.mp4`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return new NextResponse(err?.message || 'Error downloading media', { status: 500 });
  }
}


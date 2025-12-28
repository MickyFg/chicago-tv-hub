import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type, Accept-Ranges',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const streamUrl = url.searchParams.get('url');
    
    if (!streamUrl) {
      console.error('Stream proxy: Missing URL parameter');
      return new Response(
        JSON.stringify({ error: 'Missing stream URL parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Stream proxy: Fetching:', streamUrl);

    // Forward range header for video seeking support
    const headers: HeadersInit = {
      'User-Agent': 'VLC/3.0.20 LibVLC/3.0.20',
      'Accept': '*/*',
      'Connection': 'keep-alive',
    };

    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
      console.log('Stream proxy: Range header:', rangeHeader);
    }

    const response = await fetch(streamUrl, {
      method: 'GET',
      headers,
    });

    console.log('Stream proxy: Response status:', response.status);
    console.log('Stream proxy: Content-Type:', response.headers.get('content-type'));

    if (!response.ok && response.status !== 206) {
      console.error('Stream proxy: Upstream error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: `Stream returned ${response.status}: ${response.statusText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine content type based on the stream URL
    let contentType = response.headers.get('content-type') || 'application/octet-stream';
    if (streamUrl.includes('.m3u8') || streamUrl.includes('.m3u')) {
      contentType = 'application/vnd.apple.mpegurl';
    } else if (streamUrl.includes('.ts')) {
      contentType = 'video/mp2t';
    } else if (streamUrl.includes('.mp4')) {
      contentType = 'video/mp4';
    } else if (streamUrl.includes('.mkv')) {
      contentType = 'video/x-matroska';
    }
    
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');
    const acceptRanges = response.headers.get('accept-ranges');

    const responseHeaders: HeadersInit = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Accept-Ranges': acceptRanges || 'bytes',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }

    console.log('Stream proxy: Streaming response with content-type:', contentType);

    // Stream the response body
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error('Stream proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to proxy stream';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

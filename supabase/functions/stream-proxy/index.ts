import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
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
      return new Response(
        JSON.stringify({ error: 'Missing stream URL parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Proxying stream:', streamUrl);

    // Forward range header for video seeking support
    const headers: HeadersInit = {
      'User-Agent': 'VLC/3.0.20 LibVLC/3.0.20',
      'Accept': '*/*',
    };

    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const response = await fetch(streamUrl, {
      method: 'GET',
      headers,
    });

    console.log('Stream response status:', response.status);

    if (!response.ok && response.status !== 206) {
      return new Response(
        JSON.stringify({ error: `Stream returned ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get content type from response or default to video
    const contentType = response.headers.get('content-type') || 'video/mp2t';
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');

    const responseHeaders: HeadersInit = {
      ...corsHeaders,
      'Content-Type': contentType,
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }

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

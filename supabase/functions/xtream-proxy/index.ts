import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { serverAddress, username, password, action, streamId, limit } = await req.json();
    
    console.log('Xtream Proxy Request:', { serverAddress, username, action, streamId });

    if (!serverAddress || !username || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the server URL properly
    let baseUrl = serverAddress.trim();
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = "http://" + baseUrl;
    }
    
    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, '');

    // Build the Xtream API URL
    let apiUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    
    // Add action if specified
    if (action) {
      apiUrl += `&action=${encodeURIComponent(action)}`;
    }

    // Add stream_id for EPG requests
    if (streamId) {
      apiUrl += `&stream_id=${encodeURIComponent(streamId)}`;
    }

    // Add limit for EPG requests
    if (limit) {
      apiUrl += `&limit=${encodeURIComponent(limit)}`;
    }

    console.log('Fetching from:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'IPTV Smarters Pro',
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      console.error('Xtream API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: `Server returned ${response.status}: ${response.statusText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Xtream API response received');

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect to IPTV server';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

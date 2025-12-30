import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    
    console.log('Fetching transcript for video:', videoId);

    // Try multiple transcript services
    let transcript = '';
    
    // Primary: Use youtubetranscript.com API
    try {
      const response = await fetch(
        `https://youtubetranscript.com/?server_vid2=${videoId}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const text = await response.text();
        // Parse the XML response
        const matches = text.match(/<text[^>]*>([^<]+)<\/text>/g);
        if (matches) {
          transcript = matches
            .map(match => {
              const content = match.replace(/<[^>]+>/g, '');
              return content.replace(/&amp;/g, '&')
                           .replace(/&lt;/g, '<')
                           .replace(/&gt;/g, '>')
                           .replace(/&quot;/g, '"')
                           .replace(/&#39;/g, "'");
            })
            .join(' ');
        }
      }
    } catch (e) {
      console.log('Primary transcript service failed:', e);
    }

    // Fallback: Use alternative service
    if (!transcript) {
      try {
        const response = await fetch(
          `https://yt.lemnoslife.com/videos?part=transcript&id=${videoId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.items?.[0]?.transcript?.content) {
            transcript = data.items[0].transcript.content
              .map((item: { text: string }) => item.text)
              .join(' ');
          }
        }
      } catch (e) {
        console.log('Fallback transcript service failed:', e);
      }
    }

    if (!transcript) {
      console.error('Could not fetch transcript for video:', videoId);
      return new Response(
        JSON.stringify({ 
          error: 'Transcript not available',
          message: 'This video may not have captions enabled, or transcripts are disabled.'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clean up the transcript
    transcript = transcript
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Successfully fetched transcript, length:', transcript.length);

    return new Response(JSON.stringify({ transcript }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-transcript:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

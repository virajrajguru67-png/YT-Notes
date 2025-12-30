import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchTranscriptFromYouTube(videoId: string): Promise<string> {
  // Fetch the YouTube video page
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube page');
  }

  const html = await response.text();

  // Extract the captions URL from the page
  const captionsMatch = html.match(/"captions":\s*(\{[^}]+\}[^}]+\})/);
  if (!captionsMatch) {
    // Try alternative pattern for caption tracks
    const playerCaptionsMatch = html.match(/"playerCaptionsTracklistRenderer":\s*(\{[\s\S]*?"captionTracks":\s*\[[\s\S]*?\])/);
    if (!playerCaptionsMatch) {
      throw new Error('No captions available for this video');
    }
  }

  // Look for timedtext URL in the page
  const timedTextMatch = html.match(/https:\/\/www\.youtube\.com\/api\/timedtext[^"]+/g);
  if (!timedTextMatch || timedTextMatch.length === 0) {
    throw new Error('No transcript URL found');
  }

  // Clean and use the first timedtext URL
  let captionUrl = timedTextMatch[0]
    .replace(/\\u0026/g, '&')
    .replace(/\\/g, '');

  // Fetch the captions
  const captionResponse = await fetch(captionUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!captionResponse.ok) {
    throw new Error('Failed to fetch captions');
  }

  const captionData = await captionResponse.text();

  // Parse XML captions
  const textMatches = captionData.match(/<text[^>]*>([^<]*)<\/text>/g);
  if (!textMatches) {
    throw new Error('Failed to parse captions');
  }

  const transcript = textMatches
    .map(match => {
      const content = match.replace(/<[^>]+>/g, '');
      return content
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
    })
    .filter(text => text.length > 0)
    .join(' ');

  return transcript;
}

async function fetchTranscriptFallback(videoId: string): Promise<string> {
  // Fallback: Try innertube API
  const response = await fetch('https://www.youtube.com/youtubei/v1/get_transcript?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20231219.04.00',
        },
      },
      params: btoa(`\n\v${videoId}`),
    }),
  });

  if (!response.ok) {
    throw new Error('Fallback transcript fetch failed');
  }

  const data = await response.json();
  
  // Extract transcript from response
  const transcriptRenderer = data?.actions?.[0]?.updateEngagementPanelAction?.content?.transcriptRenderer;
  const cueGroups = transcriptRenderer?.body?.transcriptBodyRenderer?.cueGroups;
  
  if (!cueGroups) {
    throw new Error('No transcript data in response');
  }

  const transcript = cueGroups
    .map((group: any) => group?.transcriptCueGroupRenderer?.cues?.[0]?.transcriptCueRenderer?.cue?.simpleText || '')
    .filter((text: string) => text.length > 0)
    .join(' ');

  return transcript;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    
    console.log('Fetching transcript for video:', videoId);

    let transcript = '';
    
    // Try primary method
    try {
      transcript = await fetchTranscriptFromYouTube(videoId);
      console.log('Primary method succeeded');
    } catch (primaryError) {
      console.log('Primary method failed:', primaryError);
      
      // Try fallback method
      try {
        transcript = await fetchTranscriptFallback(videoId);
        console.log('Fallback method succeeded');
      } catch (fallbackError) {
        console.log('Fallback method failed:', fallbackError);
        throw new Error('Transcript not available. This video may not have captions enabled.');
      }
    }

    if (!transcript || transcript.length < 50) {
      // Return 200 with a structured error so the client can handle it without treating it as a hard failure
      return new Response(
        JSON.stringify({
          error: 'Transcript not available',
          message: 'This video does not have captions available, or captions are disabled.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clean up the transcript
    transcript = transcript
      .replace(/\s+/g, ' ')
      .replace(/\[.*?\]/g, '') // Remove [Music], [Applause], etc.
      .trim();

    console.log('Successfully fetched transcript, length:', transcript.length);

    return new Response(JSON.stringify({ transcript }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-transcript:', error);

    // Return 200 with structured error so the frontend can show a friendly message
    return new Response(
      JSON.stringify({
        error: 'Transcript not available',
        message: error instanceof Error ? error.message : 'This video may not have captions enabled.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractCaptionUrl(html: string): Promise<string | null> {
  // Method 1: Look for captionTracks in ytInitialPlayerResponse
  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
  if (playerResponseMatch) {
    try {
      const playerData = JSON.parse(playerResponseMatch[1]);
      const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (captionTracks && captionTracks.length > 0) {
        // Prefer English, fall back to first available
        const englishTrack = captionTracks.find((t: any) => 
          t.languageCode === 'en' || t.languageCode?.startsWith('en')
        );
        const track = englishTrack || captionTracks[0];
        if (track?.baseUrl) {
          return track.baseUrl;
        }
      }
    } catch (e) {
      console.log('Failed to parse ytInitialPlayerResponse:', e);
    }
  }

  // Method 2: Direct regex for timedtext URLs
  const timedTextPatterns = [
    /https:\/\/www\.youtube\.com\/api\/timedtext\?[^"\\]+/g,
    /"baseUrl"\s*:\s*"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/g,
  ];

  for (const pattern of timedTextPatterns) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      let url = matches[0];
      // Clean up if it's from the baseUrl pattern
      if (url.includes('"baseUrl"')) {
        const urlMatch = url.match(/"(https:\/\/[^"]+)"/);
        if (urlMatch) url = urlMatch[1];
      }
      return url.replace(/\\u0026/g, '&').replace(/\\/g, '');
    }
  }

  return null;
}

async function fetchCaptions(captionUrl: string): Promise<string> {
  // Add format=json3 for easier parsing, or use default XML
  const url = captionUrl.includes('fmt=') ? captionUrl : `${captionUrl}&fmt=json3`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch captions');
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  // Try JSON format first
  if (contentType.includes('json') || text.trim().startsWith('{')) {
    try {
      const json = JSON.parse(text);
      if (json.events) {
        return json.events
          .filter((e: any) => e.segs)
          .map((e: any) => e.segs.map((s: any) => s.utf8 || '').join(''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    } catch (e) {
      console.log('JSON parse failed, trying XML');
    }
  }

  // Fall back to XML parsing
  const textMatches = text.match(/<text[^>]*>([^<]*)<\/text>/g);
  if (textMatches) {
    return textMatches
      .map(match => {
        const content = match.replace(/<[^>]+>/g, '');
        return content
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\n/g, ' ')
          .trim();
      })
      .filter(t => t.length > 0)
      .join(' ');
  }

  throw new Error('Could not parse caption data');
}

async function fetchTranscriptFromYouTube(videoId: string): Promise<string> {
  console.log('Fetching YouTube page for video:', videoId);
  
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube page');
  }

  const html = await response.text();
  console.log('YouTube page fetched, length:', html.length);

  // Check if video exists
  if (html.includes('Video unavailable') || html.includes('Private video')) {
    throw new Error('Video is unavailable or private');
  }

  // Extract caption URL
  const captionUrl = await extractCaptionUrl(html);
  if (!captionUrl) {
    console.log('No caption URL found in page');
    throw new Error('No captions available for this video');
  }

  console.log('Found caption URL');
  
  // Fetch and parse captions
  const transcript = await fetchCaptions(captionUrl);
  
  if (!transcript || transcript.length < 20) {
    throw new Error('Caption content is empty or too short');
  }

  return transcript;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    
    console.log('=== Fetching transcript for video:', videoId, '===');

    let transcript = '';
    
    try {
      transcript = await fetchTranscriptFromYouTube(videoId);
      console.log('Successfully fetched transcript, length:', transcript.length);
    } catch (error) {
      console.error('Transcript fetch failed:', error);
      
      return new Response(
        JSON.stringify({
          error: 'Transcript not available',
          message: error instanceof Error 
            ? error.message 
            : 'This video may not have captions enabled. Try a video with CC (closed captions).',
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

    return new Response(JSON.stringify({ transcript }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-transcript:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

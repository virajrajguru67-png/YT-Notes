import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractCaptionUrl(html: string, videoId: string): Promise<string | null> {
  console.log('Attempting to extract caption URL...');
  
  // Method 1: Look for captionTracks in ytInitialPlayerResponse
  const playerResponsePatterns = [
    /ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s,
    /var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s,
    /"captions"\s*:\s*(\{[^}]+playerCaptionsTracklistRenderer[^}]+\})/s,
  ];

  for (const pattern of playerResponsePatterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        // For the full player response, parse the entire object
        let jsonStr = match[1];
        
        // Try to find the end of the JSON object more accurately
        let braceCount = 0;
        let endIndex = 0;
        for (let i = 0; i < jsonStr.length; i++) {
          if (jsonStr[i] === '{') braceCount++;
          if (jsonStr[i] === '}') braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
        if (endIndex > 0) {
          jsonStr = jsonStr.substring(0, endIndex);
        }

        const playerData = JSON.parse(jsonStr);
        const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        
        if (captionTracks && captionTracks.length > 0) {
          console.log('Found', captionTracks.length, 'caption tracks');
          
          // Prefer English, then auto-generated, then first available
          const englishTrack = captionTracks.find((t: any) => 
            t.languageCode === 'en' || t.vssId?.includes('.en')
          );
          const autoTrack = captionTracks.find((t: any) => 
            t.kind === 'asr' || t.vssId?.includes('a.')
          );
          const track = englishTrack || autoTrack || captionTracks[0];
          
          if (track?.baseUrl) {
            console.log('Using track:', track.languageCode, track.kind || 'manual');
            return track.baseUrl;
          }
        }
      } catch (e) {
        console.log('Pattern parse failed:', e);
      }
    }
  }

  // Method 2: Look for baseUrl directly in the HTML
  const baseUrlMatch = html.match(/"baseUrl"\s*:\s*"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/);
  if (baseUrlMatch) {
    console.log('Found baseUrl via direct regex');
    return baseUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
  }

  // Method 3: Look for any timedtext URL
  const timedTextMatch = html.match(/https:\/\/www\.youtube\.com\/api\/timedtext\?[^"\\]+/);
  if (timedTextMatch) {
    console.log('Found timedtext URL via fallback regex');
    return timedTextMatch[0].replace(/\\u0026/g, '&').replace(/\\/g, '');
  }

  // Method 4: Check if captions are disabled or unavailable
  if (html.includes('"playabilityStatus":{"status":"ERROR"')) {
    throw new Error('Video is not playable');
  }
  
  if (html.includes('"captionsInitialState":"CAPTIONS_INITIAL_STATE_UNAVAILABLE"') ||
      html.includes('"playerCaptionsTracklistRenderer":{}') ||
      !html.includes('captionTracks')) {
    console.log('Captions appear to be disabled or unavailable for this video');
    throw new Error('Captions are disabled for this video');
  }

  console.log('Could not find caption URL with any method');
  return null;
}

async function fetchCaptions(captionUrl: string): Promise<string> {
  // Request JSON format for easier parsing
  let url = captionUrl;
  if (!url.includes('fmt=')) {
    url += '&fmt=json3';
  }
  
  console.log('Fetching captions from URL...');
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    },
  });

  if (!response.ok) {
    console.log('Caption fetch failed with status:', response.status);
    // Try without fmt parameter
    const fallbackResponse = await fetch(captionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!fallbackResponse.ok) {
      throw new Error('Failed to fetch captions');
    }
    const fallbackText = await fallbackResponse.text();
    return parseXmlCaptions(fallbackText);
  }

  const text = await response.text();
  console.log('Caption response length:', text.length);

  // Try JSON format first
  if (text.trim().startsWith('{')) {
    try {
      const json = JSON.parse(text);
      if (json.events) {
        const transcript = json.events
          .filter((e: any) => e.segs)
          .map((e: any) => e.segs.map((s: any) => s.utf8 || '').join(''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        console.log('Parsed JSON captions, length:', transcript.length);
        return transcript;
      }
    } catch (e) {
      console.log('JSON parse failed, trying XML');
    }
  }

  // Fall back to XML parsing
  return parseXmlCaptions(text);
}

function parseXmlCaptions(text: string): string {
  const textMatches = text.match(/<text[^>]*>([^<]*)<\/text>/g);
  if (!textMatches) {
    // Try alternative format
    const altMatches = text.match(/<p[^>]*>([^<]*)<\/p>/g);
    if (!altMatches) {
      throw new Error('Could not parse caption data');
    }
    return altMatches
      .map(match => decodeHtmlEntities(match.replace(/<[^>]+>/g, '')))
      .filter(t => t.length > 0)
      .join(' ');
  }

  return textMatches
    .map(match => decodeHtmlEntities(match.replace(/<[^>]+>/g, '')))
    .filter(t => t.length > 0)
    .join(' ');
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

async function fetchTranscriptFromYouTube(videoId: string): Promise<string> {
  console.log('=== Starting transcript fetch for:', videoId, '===');
  
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cookie': 'CONSENT=YES+',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube page');
  }

  const html = await response.text();
  console.log('YouTube page fetched, length:', html.length);

  // Check if video exists
  if (html.includes('Video unavailable') || html.includes('"status":"ERROR"')) {
    throw new Error('Video is unavailable or private');
  }

  // Extract caption URL
  const captionUrl = await extractCaptionUrl(html, videoId);
  if (!captionUrl) {
    throw new Error('No captions found. This video may have captions disabled by the uploader.');
  }

  console.log('Caption URL extracted successfully');
  
  // Fetch and parse captions
  const transcript = await fetchCaptions(captionUrl);
  
  if (!transcript || transcript.length < 20) {
    throw new Error('Caption content is empty or too short');
  }

  console.log('Transcript extracted, length:', transcript.length);
  return transcript;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    
    console.log('\n========================================');
    console.log('Fetching transcript for video:', videoId);
    console.log('========================================\n');

    let transcript = '';
    
    try {
      transcript = await fetchTranscriptFromYouTube(videoId);
    } catch (error) {
      console.error('Transcript fetch failed:', error);
      
      return new Response(
        JSON.stringify({
          error: 'Transcript not available',
          message: error instanceof Error 
            ? error.message 
            : 'This video may not have captions enabled.',
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

    console.log('SUCCESS! Final transcript length:', transcript.length);

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

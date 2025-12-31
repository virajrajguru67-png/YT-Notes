import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchTranscriptViaFirecrawl(videoId: string): Promise<string> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!FIRECRAWL_API_KEY) {
    throw new Error('Firecrawl API key not configured');
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log('Scraping YouTube page with Firecrawl:', videoUrl);

  // Use Firecrawl to scrape the YouTube page
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: videoUrl,
      formats: ['html'],
      waitFor: 3000, // Wait for dynamic content to load
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Firecrawl API error:', response.status, errorData);
    throw new Error(`Firecrawl API error: ${response.status}`);
  }

  const data = await response.json();
  const html = data.data?.html || data.html;

  if (!html) {
    throw new Error('No HTML content received from Firecrawl');
  }

  console.log('Firecrawl returned HTML, length:', html.length);

  // Extract caption URL from the scraped HTML
  const captionUrl = extractCaptionUrl(html);
  
  if (!captionUrl) {
    throw new Error('No captions found in video');
  }

  console.log('Caption URL extracted successfully');

  // Fetch the actual captions
  const transcript = await fetchCaptions(captionUrl);
  return transcript;
}

function extractCaptionUrl(html: string): string | null {
  console.log('Extracting caption URL from HTML...');

  // Look for ytInitialPlayerResponse
  const playerPatterns = [
    /ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|<\/script>|const|let)/s,
    /var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\});/s,
  ];

  for (const pattern of playerPatterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        let jsonStr = match[1];
        
        // Find the proper end of the JSON object
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
            t.languageCode === 'en' && !t.kind
          );
          const autoEnglishTrack = captionTracks.find((t: any) =>
            t.languageCode === 'en' && t.kind === 'asr'
          );
          const anyEnglishTrack = captionTracks.find((t: any) =>
            t.languageCode?.startsWith('en')
          );
          const autoTrack = captionTracks.find((t: any) =>
            t.kind === 'asr'
          );

          const track = englishTrack || autoEnglishTrack || anyEnglishTrack || autoTrack || captionTracks[0];

          if (track?.baseUrl) {
            console.log('Using track:', track.languageCode, track.kind || 'manual');
            return track.baseUrl;
          }
        }
      } catch (e) {
        console.log('JSON parse failed:', e);
      }
    }
  }

  // Fallback: look for baseUrl directly
  const baseUrlMatch = html.match(/"baseUrl"\s*:\s*"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/);
  if (baseUrlMatch) {
    console.log('Found baseUrl via direct regex');
    return baseUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
  }

  // Check if captions are disabled
  if (html.includes('"captionsInitialState":"CAPTIONS_INITIAL_STATE_UNAVAILABLE"') ||
      !html.includes('captionTracks')) {
    console.log('Captions appear to be disabled for this video');
    throw new Error('Captions are disabled for this video');
  }

  return null;
}

async function fetchCaptions(captionUrl: string): Promise<string> {
  // Request JSON format
  let url = captionUrl;
  if (!url.includes('fmt=')) {
    url += '&fmt=json3';
  }

  console.log('Fetching captions...');

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    // Try without fmt parameter
    const fallbackResponse = await fetch(captionUrl);
    if (!fallbackResponse.ok) {
      throw new Error('Failed to fetch caption content');
    }
    const xmlText = await fallbackResponse.text();
    return parseXmlCaptions(xmlText);
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

  return parseXmlCaptions(text);
}

function parseXmlCaptions(text: string): string {
  const textMatches = text.match(/<text[^>]*>([^<]*)<\/text>/g);
  if (!textMatches) {
    throw new Error('Could not parse caption XML');
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
      transcript = await fetchTranscriptViaFirecrawl(videoId);
    } catch (error) {
      console.error('Firecrawl method failed:', error);

      return new Response(
        JSON.stringify({
          error: 'Transcript not available',
          message: error instanceof Error
            ? error.message
            : 'Could not fetch captions. Please use manual paste.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clean up the transcript
    transcript = transcript
      .replace(/\s+/g, ' ')
      .replace(/\[.*?\]/g, '')
      .trim();

    if (!transcript || transcript.length < 20) {
      return new Response(
        JSON.stringify({
          error: 'Transcript not available',
          message: 'Caption content is empty or too short.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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

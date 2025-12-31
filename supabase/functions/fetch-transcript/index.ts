import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Try using YouTube's innertube API which is more reliable
async function fetchTranscriptViaInnerTube(videoId: string): Promise<string> {
  console.log('Attempting innertube API method...');
  
  const innertubePayload = {
    context: {
      client: {
        hl: 'en',
        gl: 'US',
        clientName: 'WEB',
        clientVersion: '2.20240101.00.00',
      },
    },
    videoId: videoId,
  };

  // First, get the video player response to find caption tracks
  const playerResponse = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: JSON.stringify(innertubePayload),
  });

  if (!playerResponse.ok) {
    console.log('Innertube player API failed:', playerResponse.status);
    throw new Error('Failed to fetch video data');
  }

  const playerData = await playerResponse.json();
  console.log('Player response received');

  // Check if video is playable
  if (playerData.playabilityStatus?.status !== 'OK') {
    throw new Error(playerData.playabilityStatus?.reason || 'Video not available');
  }

  // Get caption tracks
  const captionTracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  
  if (!captionTracks || captionTracks.length === 0) {
    console.log('No caption tracks found in innertube response');
    throw new Error('No captions available for this video');
  }

  console.log('Found', captionTracks.length, 'caption tracks via innertube');

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
  
  if (!track?.baseUrl) {
    throw new Error('Caption track has no URL');
  }

  console.log('Using caption track:', track.languageCode, track.kind || 'manual');

  // Fetch the actual captions
  const captionUrl = track.baseUrl + '&fmt=json3';
  const captionResponse = await fetch(captionUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!captionResponse.ok) {
    // Try without fmt parameter
    const fallbackResponse = await fetch(track.baseUrl);
    if (!fallbackResponse.ok) {
      throw new Error('Failed to fetch caption content');
    }
    const xmlText = await fallbackResponse.text();
    return parseXmlCaptions(xmlText);
  }

  const captionData = await captionResponse.json();
  
  if (!captionData.events) {
    throw new Error('Invalid caption format');
  }

  // Extract text from caption events
  const transcript = captionData.events
    .filter((e: any) => e.segs)
    .map((e: any) => e.segs.map((s: any) => s.utf8 || '').join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!transcript || transcript.length < 20) {
    throw new Error('Caption content is empty');
  }

  console.log('Successfully extracted transcript, length:', transcript.length);
  return transcript;
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

// Fallback: scrape YouTube page directly
async function fetchTranscriptViaScraping(videoId: string): Promise<string> {
  console.log('Attempting page scraping method...');
  
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cookie': 'CONSENT=PENDING+987; SOCS=CAESEwgDEgk1ODE3NjEyMjQaAmVuIAEaBgiA_LyaBg',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube page');
  }

  const html = await response.text();
  console.log('Page fetched, length:', html.length);

  // Extract ytInitialPlayerResponse
  const playerMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|<\/script>)/s);
  if (!playerMatch) {
    throw new Error('Could not find player data in page');
  }

  // Parse the JSON carefully
  let jsonStr = playerMatch[1];
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

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error('No captions found in page data');
  }

  console.log('Found', captionTracks.length, 'tracks via scraping');

  // Get the first suitable track
  const track = captionTracks.find((t: any) => t.languageCode === 'en') || captionTracks[0];
  
  if (!track?.baseUrl) {
    throw new Error('No caption URL found');
  }

  // Fetch captions
  const captionResponse = await fetch(track.baseUrl + '&fmt=json3');
  if (!captionResponse.ok) {
    throw new Error('Failed to fetch captions');
  }

  const captionData = await captionResponse.json();
  const transcript = captionData.events
    .filter((e: any) => e.segs)
    .map((e: any) => e.segs.map((s: any) => s.utf8 || '').join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

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
    let lastError = '';
    
    // Try innertube API first (most reliable)
    try {
      transcript = await fetchTranscriptViaInnerTube(videoId);
    } catch (error) {
      console.error('Innertube method failed:', error);
      lastError = error instanceof Error ? error.message : 'Unknown error';
      
      // Try scraping as fallback
      try {
        transcript = await fetchTranscriptViaScraping(videoId);
      } catch (scrapingError) {
        console.error('Scraping method also failed:', scrapingError);
        lastError = scrapingError instanceof Error ? scrapingError.message : lastError;
      }
    }

    if (!transcript) {
      return new Response(
        JSON.stringify({
          error: 'Transcript not available',
          message: lastError || 'Could not fetch captions. Please use manual paste.',
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

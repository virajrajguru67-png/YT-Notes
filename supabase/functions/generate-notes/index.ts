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
    const { transcript, videoTitle } = await req.json();
    const GROQ_API_KEY = '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';

    console.log('Generating notes for video:', videoTitle);
    console.log('Transcript length:', transcript.length);

    // Truncate transcript if too long (keep first 15000 chars)
    const truncatedTranscript = transcript.length > 15000 
      ? transcript.substring(0, 15000) + '...' 
      : transcript;

    const systemPrompt = `You are an expert note-taker who creates clear, beginner-friendly study notes from video transcripts.

Your task is to transform the given transcript into well-structured, comprehensive notes that would help someone learn the topic from scratch.

Guidelines:
- Create clear section headings for major topics
- Use bullet points for key concepts
- Explain technical terms in simple language
- Include practical examples when mentioned
- Highlight important takeaways
- Keep the language conversational but professional
- Do NOT use emojis
- Do NOT include timestamps
- Focus on educational value and clarity

Format your notes with:
- Main topic heading at the top
- Clear section headers (use ## for sections)
- Bullet points (use - for lists)
- Bold text for key terms (use **term**)
- Numbered lists for sequential steps`;

    const userPrompt = `Please create comprehensive study notes from this YouTube video transcript.

Video Title: ${videoTitle}

Transcript:
${truncatedTranscript}

Generate well-organized notes that capture all the key information and make it easy for a beginner to understand the content.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const notes = data.choices[0]?.message?.content;

    if (!notes) {
      throw new Error('No notes generated');
    }

    console.log('Successfully generated notes, length:', notes.length);

    return new Response(JSON.stringify({ notes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-notes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

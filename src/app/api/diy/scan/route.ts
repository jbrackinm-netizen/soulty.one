import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, imageUrl, sessionId, prompt } = await req.json();

    const imageData = imageBase64
      ? { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }
      : { fileData: { fileUri: imageUrl } };

    const systemPrompt = prompt || `You are a DIY expert and home improvement assistant. Analyze this image and provide:
1. What you see (materials, components, damage, or project state)
2. Specific parts or materials needed with approximate quantities
3. Step-by-step repair or build instructions
4. Estimated cost range for materials
5. Difficulty level (Beginner/Intermediate/Advanced)
6. Safety considerations
Format your response as structured JSON with keys: what_i_see, materials (array of {item, quantity, estimated_cost}), instructions (array of strings), total_cost_range, difficulty, safety_notes (array of strings).`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }, imageData] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const geminiData = await response.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let analysis;
    try { analysis = JSON.parse(rawText); }
    catch { analysis = { summary: rawText }; }

    const supabase = getSupabase();
    const { data: scan } = await supabase.from('diy_scans').insert({
      session_id: sessionId,
      image_url: imageUrl || null,
      analysis,
      created_at: new Date().toISOString(),
    }).select().single();

    return NextResponse.json({ success: true, analysis, scanId: scan?.id });
  } catch (err: any) {
    console.error('DIY scan error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { projectName, description } = await req.json();
  const supabase = getSupabase();
  const { data, error } = await supabase.from('diy_sessions').insert({
    project_name: projectName,
    description,
    status: 'active',
    created_at: new Date().toISOString(),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('diy_sessions')
    .select('*, diy_scans(*)')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

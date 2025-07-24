// app/api/ponto/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const { user_id, entry_date } = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ponto")
    .select(`
      *,
      projeto:projects (
        id,
        name
      ),
      atividade:activities (
        id,
        name
      )
    `)
    .eq("user_id", user_id)
    .eq("entry_date", entry_date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

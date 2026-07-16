// API routes para artículos: GET (listado), POST (crear).
// Stubs de la estructura REST versionada (spec §7). El MVP interactúa con
// Supabase mediante la capa Services consumida por hooks; estos endpoints
// quedan preparados para exponer la misma lógica a clientes externos.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

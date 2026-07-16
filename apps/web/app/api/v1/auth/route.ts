// API routes para autenticación: register, login, logout, me.
// Stubs de la estructura REST versionada (spec §7). El MVP resuelve la
// autenticación con Supabase Auth vía la capa Services consumida por hooks.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

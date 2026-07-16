// API routes para artículo individual: GET (detalle), PUT (editar), DELETE
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  await params;
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  await params;
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  await params;
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

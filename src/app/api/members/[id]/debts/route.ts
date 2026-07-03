import { NextResponse } from "next/server";

// FASE 2: Deuda de socio — scaffolded, not implemented in Fase 1.
export async function GET() {
  return NextResponse.json({ error: "not_implemented", phase: "FASE 2" }, { status: 501 });
}

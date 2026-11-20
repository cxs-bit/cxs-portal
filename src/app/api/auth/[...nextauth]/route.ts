import type { NextRequest } from "next/server";
import { previewAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return previewAuth().handlers.GET(request);
}

export function POST(request: NextRequest) {
  return previewAuth().handlers.POST(request);
}

import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { notFound } from "next/navigation";
import { hasOwnerSession } from "@/lib/auth";
import { channelDirectory } from "@/lib/channels";

const types: Record<string, string> = {
  ".pdf": "application/pdf", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".png": "image/png", ".avif": "image/avif",
};

export async function GET(_request: Request, { params }: { params: Promise<{ channel: string; file: string }> }) {
  if (!(await hasOwnerSession())) notFound();
  const { channel, file } = await params;
  const type = types[extname(file).toLowerCase()];
  if (!["work", "personal"].includes(channel) || !/^[a-z0-9][\w.-]*$/i.test(file) || !type) notFound();
  const body = await readFile(join(channelDirectory, "private", channel, file)).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") notFound();
    throw error;
  });
  return new Response(new Uint8Array(body), { headers: {
    "Content-Type": type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } });
}

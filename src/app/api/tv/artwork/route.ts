import { getPublishedChannels } from "@/lib/channels";
import { getPlaylistArtwork } from "@/lib/playlist-artwork";

export async function GET() {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY?.trim();
  const { personal } = await getPublishedChannels();
  const covers = await getPlaylistArtwork(personal?.playlist, apiKey);
  return Response.json({ covers: covers ?? [] }, {
    status: covers === null ? 503 : 200,
    headers: {
      "Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": covers === null ? "no-store" : "public, s-maxage=30",
    },
  });
}

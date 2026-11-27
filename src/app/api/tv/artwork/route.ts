import { getPublishedChannels } from "@/lib/channels";
import { getPlaylistArtwork } from "@/lib/playlist-artwork";

export async function GET() {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY?.trim();
  const { personal } = await getPublishedChannels();
  const covers = await getPlaylistArtwork(personal?.playlist, apiKey);
  return Response.json({ covers: covers ?? [] }, {
    headers: {
      "Cache-Control": covers
        ? "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
        : "public, max-age=0, s-maxage=60",
    },
  });
}

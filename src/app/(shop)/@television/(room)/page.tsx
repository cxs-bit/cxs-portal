import { CrtIntro } from "@/components/crt-intro";
import { WorkContent, PersonalContent } from "@/components/channel-content";
import { PortfolioContent } from "@/components/portfolio-content";
import { getVisibleChannels } from "@/lib/channels";
import { getWallPosterCatalog } from "@/lib/wall-poster-catalog";

export default async function TelevisionPage() {
  const [{ work, personal }, wallPosters] = await Promise.all([
    getVisibleChannels(),
    getWallPosterCatalog(),
  ]);
  return <CrtIntro panels={{
    portfolio: <PortfolioContent />,
    work: work && <WorkContent work={work} />,
    personal: personal && <PersonalContent personal={personal} />,
  }} wallPosters={wallPosters} />;
}

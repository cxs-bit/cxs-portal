import { CrtIntro } from "@/components/crt-intro";
import { WorkContent, PersonalContent } from "@/components/channel-content";
import { PortfolioContent } from "@/components/portfolio-content";
import { getVisibleChannels } from "@/lib/channels";

export default async function TelevisionPage() {
  const { work, personal } = await getVisibleChannels();
  return <CrtIntro panels={{
    portfolio: <PortfolioContent />,
    work: work && <WorkContent work={work} />,
    personal: personal && <PersonalContent personal={personal} />,
  }} />;
}

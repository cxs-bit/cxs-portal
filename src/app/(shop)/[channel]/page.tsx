import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChannelArrival } from "@/components/channel-arrival";
import { WorkContent, PersonalContent } from "@/components/channel-content";
import { PortfolioContent } from "@/components/portfolio-content";
import { channels } from "@/lib/channel-catalog";
import { getPublishedChannels, getVisibleChannels } from "@/lib/channels";
import { portfolioShareImage, site } from "@/lib/site";

type Props = { params: Promise<{ channel: string }> };

async function destination({ params }: Props) {
  const { channel: id } = await params;
  const channel = channels.find(item => item.id === id);
  if (!channel || (channel.id !== "portfolio" && !(await getVisibleChannels())[channel.id])) notFound();
  return channel;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const channel = await destination(props);
  const draft = channel.id !== "portfolio" && !(await getPublishedChannels())[channel.id];
  return {
    title: channel.name, description: channel.description, alternates: { canonical: channel.href },
    ...(draft ? { robots: { index: false, follow: false } } : {}),
    openGraph: { type: "website", title: channel.name, description: channel.description, url: channel.href, siteName: site.title, images: [portfolioShareImage] },
    twitter: { card: "summary_large_image", title: channel.name, description: channel.description },
  };
}

export default async function ChannelPage(props: Props) {
  const active = await destination(props);
  const { work, personal } = await getVisibleChannels();
  return <>
    <ChannelArrival />
    {active.id === "portfolio" && <PortfolioContent />}
    {active.id === "work" && work && <WorkContent work={work} />}
    {active.id === "personal" && personal && <PersonalContent personal={personal} />}
  </>;
}

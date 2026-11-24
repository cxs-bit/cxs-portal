export const channels = [
  { id: "portfolio", name: "Portfolio", href: "/portfolio", description: "Explore Carlos Sosa’s software projects and devlog." },
  { id: "work", name: "Work", href: "/work", description: "Carlos Sosa’s working approach, education, and CV." },
  { id: "personal", name: "Personal", href: "/personal", description: "Favorite songs and the story behind Carlos Sosa’s portfolio." },
] as const;

export type Channel = (typeof channels)[number];
export type ChannelId = Channel["id"];

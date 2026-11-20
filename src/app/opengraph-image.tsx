import { socialCard, socialSize } from "@/lib/social-card";

export const alt = "CXS Portfolio";
export const size = socialSize;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return socialCard("Building for the web.", "Portfolio");
}

import { socialCard, socialSize } from "@/lib/social-card";

export const alt = "Carlos Sosa’s portfolio, with the CXS logo on its opening CRT television";
export const size = socialSize;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return socialCard("Carlos Sosa", "Software portfolio", "television");
}

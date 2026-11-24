import type { Metadata } from "next";
import { portfolioShareImage, site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", title: "Carlos Sosa · CXS Portfolio", description: site.description, siteName: site.title, images: [portfolioShareImage] },
};

export default function ShopPage() {
  return null;
}

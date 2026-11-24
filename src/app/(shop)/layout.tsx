"use client";

import type { ReactNode } from "react";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { channels } from "@/lib/channel-catalog";

// The room slot stays mounted during a tune-and-enter transition. A direct
// visit has an empty slot and receives just the requested channel from the server.
export default function ShopLayout({ children, television }: { children: ReactNode; television: ReactNode }) {
  const pathname = usePathname();
  const room = useSelectedLayoutSegment("television") === "(room)";
  return room && (pathname === "/" || channels.some(channel => channel.href === pathname))
    ? television
    : children;
}

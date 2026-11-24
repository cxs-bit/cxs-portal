import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import type { ZodType } from "zod";
import { hasOwnerSession } from "./auth";
import { previewOwnerId } from "./preview-policy";
import { personalSchema, workSchema } from "./channel-data";

export const channelDirectory = join(process.cwd(), "content", "channels");

async function load<T>(id: string, schema: ZodType<T>, draft: boolean) {
  const file = join(channelDirectory, draft ? "private" : "", id + ".json");
  try {
    return schema.parse(JSON.parse(await readFile(file, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export const getPublishedChannels = cache(async () => ({
  work: await load("work", workSchema, false),
  personal: await load("personal", personalSchema, false),
}));

export const getVisibleChannels = cache(async () => {
  const published = await getPublishedChannels();
  if (!previewOwnerId(process.env) || !(await hasOwnerSession())) return published;
  return {
    work: (await load("work", workSchema, true)) ?? published.work,
    personal: (await load("personal", personalSchema, true)) ?? published.personal,
  };
});

type PreviewEnvironment = {
  ENABLE_DRAFT_PREVIEW?: string;
  VERCEL_ENV?: string;
  VERCEL_GIT_COMMIT_REF?: string;
  NODE_ENV?: string;
  PORTFOLIO_OWNER_GITHUB_ID?: string;
  AUTH_GITHUB_ID?: string;
  AUTH_GITHUB_SECRET?: string;
  AUTH_SECRET?: string;
  AUTH_URL?: string;
};

export function previewOwnerId(env: PreviewEnvironment) {
  const isPreviewBranch = env.VERCEL_ENV === "preview" && env.VERCEL_GIT_COMMIT_REF === "preview";
  const isLocalDev = !env.VERCEL_ENV && env.NODE_ENV === "development";

  if ((!isPreviewBranch && !isLocalDev) || env.ENABLE_DRAFT_PREVIEW !== "true") return;
  const owner = env.PORTFOLIO_OWNER_GITHUB_ID?.trim();
  if (!owner || !/^\d+$/.test(owner) || !env.AUTH_SECRET || !env.AUTH_GITHUB_ID || !env.AUTH_GITHUB_SECRET || !env.AUTH_URL) return;
  return owner;
}

export function isPreviewOwner(ownerId: string | undefined, accountId: unknown) {
  return Boolean(ownerId && accountId === ownerId);
}

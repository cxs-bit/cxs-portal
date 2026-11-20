import { decode, encode } from "next-auth/jwt";
import { describe, expect, it } from "vitest";
import { isPreviewOwner, previewOwnerId } from "../src/lib/preview-policy";

const env = {
  ENABLE_DRAFT_PREVIEW: "true",
  PORTFOLIO_OWNER_GITHUB_ID: "12345",
  AUTH_GITHUB_ID: "test-client",
  AUTH_GITHUB_SECRET: "test-client-secret",
  AUTH_SECRET: "test-only-jwt-secret",
  AUTH_URL: "http://localhost:3000",
};

describe("draft preview", () => {
  it("fails closed for production, other branches, and incomplete configuration", () => {
    expect(previewOwnerId({ ...env, VERCEL_ENV: "production", VERCEL_GIT_COMMIT_REF: "preview" })).toBeUndefined();
    expect(previewOwnerId({ ...env, VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "other" })).toBeUndefined();
    expect(previewOwnerId({ ...env, NODE_ENV: "development", AUTH_SECRET: "" })).toBeUndefined();
    expect(previewOwnerId({ ...env, NODE_ENV: "development", ENABLE_DRAFT_PREVIEW: "false" })).toBeUndefined();
  });

  it("enables the configured owner locally and on the dedicated preview branch", () => {
    expect(previewOwnerId({ ...env, NODE_ENV: "development" })).toBe("12345");
    expect(previewOwnerId({ ...env, VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "preview" })).toBe("12345");
    expect(isPreviewOwner("12345", "12345")).toBe(true);
    expect(isPreviewOwner("12345", "99999")).toBe(false);
    expect(isPreviewOwner("12345", undefined)).toBe(false);
  });

  it("accepts an unexpired owner token and rejects an expired token", async () => {
    const config = { secret: env.AUTH_SECRET, salt: "authjs.session-token" };
    const valid = await encode({ ...config, token: { ownerId: "12345" }, maxAge: 3600 });
    expect(isPreviewOwner("12345", (await decode({ ...config, token: valid }))?.ownerId)).toBe(true);

    const expired = await encode({ ...config, token: { ownerId: "12345" }, maxAge: -120 });
    await expect(decode({ ...config, token: expired })).rejects.toThrow();
  });
});

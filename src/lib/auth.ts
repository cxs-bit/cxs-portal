import "server-only";

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { notFound } from "next/navigation";
import { isPreviewOwner, previewOwnerId } from "./preview-policy";

declare module "next-auth" {
  interface Session {
    ownerId?: string;
  }
}

const ownerId = previewOwnerId(process.env);

const auth = ownerId ? NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt", maxAge: 60 * 60 },
  callbacks: {
    signIn({ account }) {
      return account?.provider === "github" && isPreviewOwner(ownerId, account.providerAccountId);
    },
    jwt({ token, account }) {
      if (account?.provider === "github" && isPreviewOwner(ownerId, account.providerAccountId)) {
        token.ownerId = account.providerAccountId;
      }
      return isPreviewOwner(ownerId, token.ownerId) ? token : null;
    },
    session({ session, token }) {
      session.ownerId = typeof token.ownerId === "string" ? token.ownerId : undefined;
      return session;
    },
  },
}) : undefined;

export function previewAuth() {
  if (!auth) notFound();
  return auth;
}

export async function hasOwnerSession() {
  const session = await previewAuth().auth();
  return isPreviewOwner(ownerId, session?.ownerId);
}

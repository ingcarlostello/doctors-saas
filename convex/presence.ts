import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function ensureCurrentUserId(ctx: MutationCtx): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("No autenticado");

  const existing = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (existing) {
    const updated: { name?: string; email?: string } = {};
    if (identity.name !== undefined && identity.name !== existing.name) {
      updated.name = identity.name;
    }
    if (identity.email !== undefined && identity.email !== existing.email) {
      updated.email = identity.email;
    }
    if (Object.keys(updated).length > 0) {
      await ctx.db.patch(existing._id, updated);
    }
    return existing._id;
  }

  return await ctx.db.insert("users", {
    name: identity.name ?? "Anonymous",
    email: identity.email ?? "",
    tokenIdentifier: identity.tokenIdentifier,
    assignedNumbers: [],
  });
}

export const heartbeatPresence = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await ensureCurrentUserId(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: now, isOnline: true });
      return;
    }

    await ctx.db.insert("presence", { userId, lastSeenAt: now, isOnline: true });
  },
});

export const getPresence = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!presence) return null;

    const now = Date.now();
    const isOnline = now - presence.lastSeenAt <= 30_000;
    return { ...presence, isOnline };
  },
});

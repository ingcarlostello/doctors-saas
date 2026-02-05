import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";
import { ENV } from "../../lib/env";
import { decryptWithAesGcm } from "./google_calendar_helpers";

export const getTokensInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const tokenRecord = await ctx.db
      .query("google_calendar_tokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!tokenRecord) return null;
    const masterKey = ENV.GOOGLE_TOKENS_MASTER_KEY;
    if (!masterKey) throw new Error("Server Encryption Key Missing");
    const accessToken = await decryptWithAesGcm({
      masterKeyBase64: masterKey,
      ciphertextBase64: tokenRecord.accessTokenCiphertext,
      ivBase64: tokenRecord.accessTokenIv,
    });
    const refreshToken = await decryptWithAesGcm({
      masterKeyBase64: masterKey,
      ciphertextBase64: tokenRecord.refreshTokenCiphertext,
      ivBase64: tokenRecord.refreshTokenIv,
    });
    return {
      accessToken,
      refreshToken,
      expiresAt: tokenRecord.expiresAt,
      scope: tokenRecord.scope,
    };
  },
});

export const getAllUsersWithTokens = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tokens = await ctx.db.query("google_calendar_tokens").collect();
    return tokens.map((t) => ({ userId: t.userId }));
  },
});

export const getRecentlySentReminders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const events = await ctx.db
      .query("calendar_events")
      .withIndex("by_reminder_status", (q) => q.eq("userId", user._id).eq("reminderSent24h", true))
      .collect();
    return events.map((e) => ({
      _id: e._id,
      title: e.title,
      startTime: e.startTime,
      reminderSent24h: e.reminderSent24h,
    }));
  },
});

export const getEventById = query({
  args: { eventId: v.id("calendar_events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.db.get(args.eventId);
  },
});

export const getEventByGoogleId = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.db
      .query("calendar_events")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .unique();
  },
});

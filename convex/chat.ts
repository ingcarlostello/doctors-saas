import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  generateMessageId,
  normalizeE164PhoneNumber,
  previewFromContent,
} from "./chatUtils";

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

async function getCurrentUserOrNull(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const user = await getCurrentUserOrNull(ctx);
  if (!user) throw new Error("Usuario no encontrado");
  return user;
}

export const upsertConversation = mutation({
  args: {
    channel: v.union(v.literal("whatsapp"), v.literal("sms"), v.literal("inapp")),
    externalContact: v.object({
      phoneNumber: v.string(),
      name: v.optional(v.string()),
    }),
    assignedNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerUserId = await ensureCurrentUserId(ctx);
    const phone = normalizeE164PhoneNumber(args.externalContact.phoneNumber);

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_owner_phone", (q) =>
        q.eq("ownerUserId", ownerUserId).eq("externalContact.phoneNumber", phone),
      )
      .filter((q) => q.eq(q.field("channel"), args.channel))
      .first();

    if (existing) {
      const patch: {
        externalContact?: { phoneNumber: string; name?: string };
        assignedNumber?: string;
      } = {};
      if (existing.externalContact.name !== args.externalContact.name) {
        patch.externalContact = { phoneNumber: phone, name: args.externalContact.name };
      }
      if (args.assignedNumber && existing.assignedNumber !== args.assignedNumber) {
        patch.assignedNumber = args.assignedNumber;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      return existing._id;
    }

    return await ctx.db.insert("conversations", {
      ownerUserId,
      channel: args.channel,
      externalContact: { phoneNumber: phone, name: args.externalContact.name },
      assignedNumber: args.assignedNumber,
      unreadCount: 0,
      lastReadAt: Date.now(),
    });
  },
});

export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const ownerUser = await getCurrentUserOrNull(ctx);
    if (!ownerUser) return [];

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_owner_lastMessageAt", (q) =>
        q.eq("ownerUserId", ownerUser._id),
      )
      .order("desc")
      .collect();

    return conversations;
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    beforeTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerUserId !== user._id) {
      throw new Error("No autorizado");
    }

    const limit = Math.min(args.limit ?? 50, 200);

    let q = ctx.db
      .query("messages")
      .withIndex("by_conversation_timestamp", (idx) =>
        idx.eq("conversationId", args.conversationId),
      );

    if (args.beforeTimestamp !== undefined) {
      q = q.filter((f) => f.lt(f.field("timestamp"), args.beforeTimestamp!));
    }

    const page = await q.order("desc").take(limit);
    return page.reverse();
  },
});

export const markConversationRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const ownerUserId = await ensureCurrentUserId(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerUserId !== ownerUserId) {
      throw new Error("No autorizado");
    }

    await ctx.db.patch(args.conversationId, {
      unreadCount: 0,
      lastReadAt: Date.now(),
    });
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerUserId = await ensureCurrentUserId(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerUserId !== ownerUserId) {
      throw new Error("No autorizado");
    }

    const content = args.content.trim();
    if (content.length === 0) throw new Error("Mensaje vacío");

    const timestamp = Date.now();
    const messageDocId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      message_id: generateMessageId(),
      content,
      sender_type: { kind: "user" as const, user_id: ownerUserId },
      timestamp,
      direction: "out",
      status: "sent",
      attachments: [],
      is_deleted: false,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessagePreview: previewFromContent(content),
      lastMessageAt: timestamp,
      unreadCount: 0,
      lastReadAt: timestamp,
    });

    return messageDocId;
  },
});

export const softDeleteMessage = mutation({
  args: {
    messageDocId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const ownerUserId = await ensureCurrentUserId(ctx);
    const message = await ctx.db.get(args.messageDocId);
    if (!message) return;

    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation || conversation.ownerUserId !== ownerUserId) {
      throw new Error("No autorizado");
    }

    await ctx.db.patch(args.messageDocId, {
      is_deleted: true,
      deletedAt: Date.now(),
      content: undefined,
      contentCiphertext: undefined,
      attachments: [],
    });
  },
});

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

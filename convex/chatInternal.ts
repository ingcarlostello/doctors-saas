import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const findOwnerUserIdByAssignedNumber = internalQuery({
  args: { assignedNumber: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const match = users.find((u) =>
      (u.assignedNumbers ?? []).includes(args.assignedNumber),
    );
    return match?._id ?? null;
  },
});

export const getConversationForCurrentUser = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("Usuario no encontrado");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerUserId !== user._id) {
      throw new Error("No autorizado");
    }
    return conversation;
  },
});

export const getMessageById = internalQuery({
  args: { messageDocId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageDocId);
  },
});

export const upsertConversationForInbound = internalMutation({
  args: {
    ownerUserId: v.id("users"),
    channel: v.union(v.literal("whatsapp"), v.literal("sms"), v.literal("inapp")),
    externalPhoneNumber: v.string(),
    externalName: v.optional(v.string()),
    assignedNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_owner_phone", (q) =>
        q
          .eq("ownerUserId", args.ownerUserId)
          .eq("externalContact.phoneNumber", args.externalPhoneNumber),
      )
      .filter((q) => q.eq(q.field("channel"), args.channel))
      .first();

    if (existing) {
      const patch: {
        externalContact?: { phoneNumber: string; name?: string };
        assignedNumber?: string;
      } = {};
      if (
        args.externalName !== undefined &&
        existing.externalContact.name !== args.externalName
      ) {
        patch.externalContact = {
          phoneNumber: args.externalPhoneNumber,
          name: args.externalName,
        };
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
      ownerUserId: args.ownerUserId,
      channel: args.channel,
      externalContact: {
        phoneNumber: args.externalPhoneNumber,
        name: args.externalName,
      },
      assignedNumber: args.assignedNumber,
      unreadCount: 0,
    });
  },
});

export const insertInboundMessage = internalMutation({
  args: {
    ownerUserId: v.id("users"),
    conversationId: v.id("conversations"),
    message_id: v.string(),
    content: v.optional(v.string()),
    timestamp: v.number(),
    fromPhoneNumber: v.string(),
    fromName: v.optional(v.string()),
    twilioMessageSid: v.optional(v.string()),
    twilioStatus: v.optional(v.string()),
    whatsappMessageId: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          kind: v.union(
            v.literal("image"),
            v.literal("audio"),
            v.literal("video"),
            v.literal("file"),
          ),
          url: v.optional(v.string()),
          storageId: v.optional(v.id("_storage")),
          mimeType: v.optional(v.string()),
          sizeBytes: v.number(),
          durationSeconds: v.optional(v.number()),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerUserId !== args.ownerUserId) {
      throw new Error("No autorizado");
    }

    if (args.twilioMessageSid) {
      const existing = await ctx.db
        .query("messages")
        .withIndex("by_twilioMessageSid", (q) =>
          q.eq("twilioMessageSid", args.twilioMessageSid),
        )
        .unique();
      if (existing) return existing._id;
    }

    const messageDocId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      message_id: args.message_id,
      content: args.content,
      sender_type: {
        kind: "external" as const,
        phone_number: args.fromPhoneNumber,
        name: args.fromName,
      },
      timestamp: args.timestamp,
      direction: "in",
      status: "delivered",
      attachments: args.attachments,
      is_deleted: false,
      twilioMessageSid: args.twilioMessageSid,
      twilio_status: args.twilioStatus,
      whatsapp_message_id: args.whatsappMessageId,
    });

    const preview = (args.content ?? "").trim();
    const lastMessagePreview =
      preview.length > 0 ? (preview.length > 140 ? `${preview.slice(0, 140)}…` : preview) : "Adjunto";

    await ctx.db.patch(args.conversationId, {
      lastMessagePreview,
      lastMessageAt: args.timestamp,
      unreadCount: (conversation.unreadCount ?? 0) + 1,
    });

    return messageDocId;
  },
});

export const insertOutgoingMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    message_id: v.string(),
    content: v.optional(v.string()),
    timestamp: v.number(),
    attachments: v.optional(
      v.array(
        v.object({
          kind: v.union(
            v.literal("image"),
            v.literal("audio"),
            v.literal("video"),
            v.literal("file"),
          ),
          url: v.optional(v.string()),
          storageId: v.optional(v.id("_storage")),
          mimeType: v.optional(v.string()),
          sizeBytes: v.number(),
          durationSeconds: v.optional(v.number()),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("Usuario no encontrado");
    const userId = user._id;
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerUserId !== userId) {
      throw new Error("No autorizado");
    }

    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      message_id: args.message_id,
      content: args.content,
      sender_type: { kind: "user" as const, user_id: userId },
      timestamp: args.timestamp,
      direction: "out",
      status: "queued",
      attachments: args.attachments,
      is_deleted: false,
    });
  },
});

export const updateAfterSend = internalMutation({
  args: {
    messageDocId: v.id("messages"),
    twilioMessageSid: v.optional(v.string()),
    twilioStatus: v.string(),
    whatsappMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageDocId, {
      twilioMessageSid: args.twilioMessageSid,
      twilio_status: args.twilioStatus,
      whatsapp_message_id: args.whatsappMessageId,
      status: args.twilioStatus === "failed" ? "failed" : "sent",
    });
  },
});

export const updateSendFailure = internalMutation({
  args: {
    messageDocId: v.id("messages"),
    twilioStatus: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageDocId, {
      twilio_status: args.twilioStatus,
      status: "failed",
    });
  },
});

function mapTwilioStatusToChatStatus(twilioStatus: string) {
  const normalized = twilioStatus.toLowerCase();
  if (normalized === "read") return "read";
  if (normalized === "delivered") return "delivered";
  if (normalized === "sent") return "sent";
  if (normalized === "queued") return "queued";
  if (normalized === "failed" || normalized === "undelivered") return "failed";
  return "sent";
}

export const updateMessageStatusByTwilioSid = internalMutation({
  args: {
    twilioMessageSid: v.string(),
    twilioStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query("messages")
      .withIndex("by_twilioMessageSid", (q) =>
        q.eq("twilioMessageSid", args.twilioMessageSid),
      )
      .unique();
    if (!message) return;

    await ctx.db.patch(message._id, {
      twilio_status: args.twilioStatus,
      status: mapTwilioStatusToChatStatus(args.twilioStatus),
    });
  },
});

export const touchConversationAfterSend = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    lastMessagePreview: v.string(),
    lastMessageAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("Usuario no encontrado");
    const userId = user._id;
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerUserId !== userId) {
      throw new Error("No autorizado");
    }

    await ctx.db.patch(args.conversationId, {
      lastMessagePreview: args.lastMessagePreview,
      lastMessageAt: args.lastMessageAt,
    });
  },
});

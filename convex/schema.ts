import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    assignedNumbers: v.optional(v.array(v.string())),
    twilioSubaccountSid: v.optional(v.string()),
    twilioSubaccountAuthTokenCiphertext: v.optional(v.string()),
    twilioSubaccountAuthTokenIv: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_twilio_subaccount_sid", ["twilioSubaccountSid"]),

  conversations: defineTable({
    ownerUserId: v.id("users"),
    channel: v.union(v.literal("whatsapp"), v.literal("sms"), v.literal("inapp")),
    externalContact: v.object({
      phoneNumber: v.string(),
      name: v.optional(v.string()),
    }),
    assignedNumber: v.optional(v.string()),
    lastMessagePreview: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    unreadCount: v.number(),
    lastReadAt: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
    isBlocked: v.optional(v.boolean()),
  })
    .index("by_owner_lastMessageAt", ["ownerUserId", "lastMessageAt"])
    .index("by_owner_phone", ["ownerUserId", "externalContact.phoneNumber"])
    .index("by_owner_assignedNumber", ["ownerUserId", "assignedNumber"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    message_id: v.string(),
    content: v.optional(v.string()),
    contentCiphertext: v.optional(v.string()),
    encryption: v.optional(
      v.object({
        alg: v.string(),
        keyId: v.string(),
      }),
    ),
    sender_type: v.union(
      v.object({
        kind: v.literal("user"),
        user_id: v.id("users"),
      }),
      v.object({
        kind: v.literal("external"),
        phone_number: v.string(),
        name: v.optional(v.string()),
      }),
    ),
    timestamp: v.number(),
    direction: v.union(v.literal("in"), v.literal("out")),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("read"),
      v.literal("failed"),
    ),
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
    is_deleted: v.boolean(),
    deletedAt: v.optional(v.number()),
    whatsapp_message_id: v.optional(v.string()),
    twilio_status: v.optional(v.string()),
    twilioMessageSid: v.optional(v.string()),
  })
    .index("by_conversation_timestamp", ["conversationId", "timestamp"])
    .index("by_twilioMessageSid", ["twilioMessageSid"])
    .index("by_message_id", ["message_id"]),

  presence: defineTable({
    userId: v.id("users"),
    lastSeenAt: v.number(),
    isOnline: v.boolean(),
  }).index("by_user", ["userId"]),

  patients: defineTable({
    userId: v.id("users"),
    fullName: v.string(),
    phoneNumber: v.string(),
    dni: v.string(),
    email: v.optional(v.string()),
    lastAppointmentDate: v.optional(v.number()),
    nextAppointmentDate: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_dni", ["userId", "dni"])
    .index("by_user_phone", ["userId", "phoneNumber"]),
});

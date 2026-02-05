import { v } from "convex/values";
import { action } from "./_generated/server";
import { anyApi } from "convex/server";
import { ENV } from "../lib/env";
import { TWILIO_CONFIG } from "../lib/config";
import type { Doc, Id } from "./_generated/dataModel";
import {
  assertAttachmentsValid,
  generateMessageId,
  normalizeE164PhoneNumber,
  previewFromContent,
  toTwilioWhatsAppAddress,
  type AttachmentInput,
} from "./chatUtils";
import { CHAT_LIMITS } from "./chatConfig";

const apiAny = anyApi as any;
const internalAny = anyApi as any;

export const sendWhatsAppMessage: ReturnType<typeof action> = action({
  args: {
    conversationId: v.id("conversations"),
    content: v.optional(v.string()),
    contentSid: v.optional(v.string()),
    contentVariables: v.optional(v.string()),
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
  handler: async (ctx, args): Promise<Doc<"messages"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    await ctx.runMutation(apiAny.users.store, {});

    const conversation = await ctx.runQuery(
      internalAny.chatInternal.getConversationForCurrentUser,
      { conversationId: args.conversationId },
    );
    if (conversation.channel !== "whatsapp") {
      throw new Error("La conversación no es de WhatsApp");
    }

    const content = (args.content ?? "").trim();
    if (
      content.length === 0 &&
      (!args.attachments || args.attachments.length === 0) &&
      !args.contentSid
    ) {
      throw new Error("Mensaje vacío");
    }
    if (content.length > CHAT_LIMITS.MAX_MESSAGE_CONTENT_LENGTH) {
      throw new Error("El mensaje excede el tamaño máximo permitido");
    }

    const attachments = (args.attachments as unknown as AttachmentInput[]) ?? [];
    assertAttachmentsValid(attachments);

    const user = await ctx.runQuery(apiAny.users.currentUser, {});
    if (!user) throw new Error("Usuario no encontrado");

    const accountSid = ENV.TWILIO_ACCOUNT_SID;
    const authToken = ENV.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      throw new Error(
        "Las variables TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN no están configuradas",
      );
    }
    if (!user.twilioSubaccountSid) {
      throw new Error("El usuario no tiene subcuenta de Twilio configurada");
    }

    const fromNumber =
      conversation.assignedNumber ?? user.assignedNumbers?.[0] ?? null;
    if (!fromNumber) {
      throw new Error("No hay un número asignado para enviar mensajes");
    }

    const toPhone = normalizeE164PhoneNumber(conversation.externalContact.phoneNumber);
    const to = toTwilioWhatsAppAddress(toPhone);
    const from = toTwilioWhatsAppAddress(normalizeE164PhoneNumber(fromNumber));

    const message_id = generateMessageId();
    const timestamp = Date.now();

    const messageDocId: Id<"messages"> = await ctx.runMutation(
      internalAny.chatInternal.insertOutgoingMessage,
      {
        conversationId: args.conversationId,
        message_id,
        content: content.length > 0 ? content : undefined,
        timestamp,
        attachments: args.attachments,
      },
    );

    const url = `https://${accountSid}:${authToken}@${TWILIO_CONFIG.BASE_URL}/Accounts/${user.twilioSubaccountSid}/Messages.json`;

    const body = new URLSearchParams();
    body.set("From", from);
    body.set("To", to);

    if (args.contentSid) {
      body.set("ContentSid", args.contentSid);
      if (args.contentVariables) {
        body.set("ContentVariables", args.contentVariables);
      }
    } else {
      if (content.length > 0) body.set("Body", content);
    }

    for (const attachment of attachments) {
      if (attachment.url) body.append("MediaUrl", attachment.url);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      await ctx.runMutation(internalAny.chatInternal.updateSendFailure, {
        messageDocId,
        twilioStatus: `http_${response.status}`,
      });
      throw new Error(`No se pudo enviar el mensaje por Twilio: ${errorText}`);
    }

    const data = (await response.json()) as { sid?: string; status?: string };
    const sid = data.sid ?? null;
    const twilioStatus = data.status ?? "sent";

    await ctx.runMutation(internalAny.chatInternal.updateAfterSend, {
      messageDocId,
      twilioMessageSid: sid ?? undefined,
      twilioStatus,
      whatsappMessageId: sid ?? undefined,
    });

    await ctx.runMutation(internalAny.chatInternal.touchConversationAfterSend, {
      conversationId: args.conversationId,
      lastMessagePreview: content.length > 0 ? previewFromContent(content) : "Adjunto",
      lastMessageAt: timestamp,
    });

    return await ctx.runQuery(internalAny.chatInternal.getMessageById, {
      messageDocId,
    });
  },
});

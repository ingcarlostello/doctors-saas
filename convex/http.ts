import { httpRouter, anyApi } from "convex/server";
import { httpAction } from "./_generated/server";
import { ENV } from "../lib/env";
import {
  formDataToObject,
  generateMessageId,
  normalizeE164PhoneNumber,
} from "./chatUtils";

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }
  const BufferImpl = (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer;
  if (BufferImpl) return BufferImpl.from(bytes).toString("base64");
  throw new Error("No hay encoder base64 disponible en este runtime");
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  const BufferImpl = (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer;
  if (BufferImpl) return new Uint8Array(BufferImpl.from(base64, "base64"));
  throw new Error("No hay decoder base64 disponible en este runtime");
}

async function importAesGcmKeyFromBase64(masterKeyBase64: string): Promise<CryptoKey> {
  const raw = base64ToBytes(masterKeyBase64);
  const rawBuffer = raw.buffer.slice(
    raw.byteOffset,
    raw.byteOffset + raw.byteLength,
  ) as ArrayBuffer;
  return await crypto.subtle.importKey(
    "raw",
    rawBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
}

async function decryptWithAesGcmBase64(opts: {
  masterKeyBase64: string;
  ciphertextBase64: string;
  ivBase64: string;
}): Promise<string> {
  const key = await importAesGcmKeyFromBase64(opts.masterKeyBase64);
  const ivBytes = base64ToBytes(opts.ivBase64);
  const iv = ivBytes.buffer.slice(
    ivBytes.byteOffset,
    ivBytes.byteOffset + ivBytes.byteLength,
  ) as ArrayBuffer;
  const ciphertextBytes = base64ToBytes(opts.ciphertextBase64);
  const ciphertext = ciphertextBytes.buffer.slice(
    ciphertextBytes.byteOffset,
    ciphertextBytes.byteOffset + ciphertextBytes.byteLength,
  ) as ArrayBuffer;
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plaintext);
}

async function computeHmacSha1Base64(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return bytesToBase64(new Uint8Array(signature));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyTwilioSignature(opts: {
  authToken: string;
  requestUrl: string;
  params: Record<string, string>;
  signatureHeader: string | null;
}) {
  if (!opts.signatureHeader) return false;
  const sortedKeys = Object.keys(opts.params).sort();
  let toSign = opts.requestUrl;
  for (const key of sortedKeys) {
    toSign += key + opts.params[key];
  }
  const expected = await computeHmacSha1Base64(opts.authToken, toSign);
  return safeEqual(expected, opts.signatureHeader);
}

// @ts-ignore
const internal = require("./_generated/api").internal;
const internalAny = internal as any;

const twilioInbound = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const form = await request.formData();
  const params = formDataToObject(form);

  const signatureHeader = request.headers.get("x-twilio-signature");
  const accountSid = params.AccountSid ?? "";
  const messageSid = params.MessageSid ?? "";

  console.log("twilio:inbound webhook received", {
    url: request.url,
    accountSid,
    hasSignature: Boolean(signatureHeader),
    to: params.To ?? "",
    from: params.From ?? "",
    messageSid,
  });

  let authToken: string | null = null;
  let authTokenSource: "stored" | "env" | "none" = "none";

  const masterKey = ENV.TWILIO_SUBACCOUNT_AUTH_TOKEN_MASTER_KEY;
  if (masterKey && accountSid) {
    const stored = await ctx.runQuery(
      internalAny.users.getTwilioWebhookSigningKeyByAccountSid,
      { accountSid },
    );
    if (stored) {
      try {
        authToken = await decryptWithAesGcmBase64({
          masterKeyBase64: masterKey,
          ciphertextBase64: stored.ciphertextBase64,
          ivBase64: stored.ivBase64,
        });
        authTokenSource = "stored";
      } catch (e) {
        console.log("twilio:inbound token decrypt failed", {
          accountSid,
          messageSid,
          error: e instanceof Error ? e.message : String(e),
        });
        return new Response("Unauthorized", { status: 403 });
      }
    }
  }

  if (
    !authToken &&
    accountSid &&
    ENV.TWILIO_ACCOUNT_SID === accountSid &&
    ENV.TWILIO_AUTH_TOKEN
  ) {
    authToken = ENV.TWILIO_AUTH_TOKEN;
    authTokenSource = "env";
  }

  if (!authToken) {
    console.log("twilio:inbound no auth token available", {
      accountSid,
      messageSid,
      hasMasterKey: Boolean(masterKey),
    });
    return new Response("Unauthorized", { status: 403 });
  }

  const ok = await verifyTwilioSignature({
    authToken,
    requestUrl: request.url,
    params,
    signatureHeader,
  });
  console.log("twilio:inbound signature verification", {
    accountSid,
    messageSid,
    ok,
    authTokenSource,
  });
  if (!ok) return new Response("Unauthorized", { status: 403 });

  const toRaw = params.To ?? "";
  const fromRaw = params.From ?? "";
  const body = params.Body ?? "";

  const assignedNumber = normalizeE164PhoneNumber(toRaw);
  const fromPhone = normalizeE164PhoneNumber(fromRaw);
  const profileName = params.ProfileName ?? undefined;

  const ownerUserId = await ctx.runQuery(
    internalAny.chatInternal.findOwnerUserIdByAssignedNumber,
    { assignedNumber },
  );

  if (!ownerUserId) {
    console.log("twilio:inbound owner not found", {
      accountSid,
      assignedNumber,
      fromPhone,
      messageSid,
    });
    return new Response("Owner not found", { status: 404 });
  }

  const conversationId = await ctx.runMutation(
    internalAny.chatInternal.upsertConversationForInbound,
    {
      ownerUserId,
      channel: "whatsapp",
      externalPhoneNumber: fromPhone,
      externalName: profileName,
      assignedNumber,
    },
  );

  console.log("twilio:inbound conversation resolved", {
    accountSid,
    ownerUserId,
    conversationId,
    assignedNumber,
    fromPhone,
    messageSid,
  });

  const numMedia = Number(params.NumMedia ?? "0");
  const attachments =
    numMedia > 0
      ? Array.from({ length: numMedia }).map((_, i) => {
          const url = params[`MediaUrl${i}`];
          const mimeType = params[`MediaContentType${i}`];
          const kind =
            mimeType?.startsWith("image/")
              ? ("image" as const)
              : mimeType?.startsWith("audio/")
                ? ("audio" as const)
                : mimeType?.startsWith("video/")
                  ? ("video" as const)
                  : ("file" as const);
          return {
            kind,
            url,
            mimeType,
            sizeBytes: 0,
          };
        })
      : undefined;

  const messageSidOpt = params.MessageSid ?? undefined;
  const message_id = messageSidOpt ?? generateMessageId();
  const timestamp = Date.now();

  await ctx.runMutation(internalAny.chatInternal.insertInboundMessage, {
    ownerUserId,
    conversationId,
    message_id,
    content: body.trim().length > 0 ? body : undefined,
    timestamp,
    fromPhoneNumber: fromPhone,
    fromName: profileName,
    twilioMessageSid: messageSidOpt,
    twilioStatus: params.SmsStatus ?? undefined,
    whatsappMessageId: messageSidOpt,
    attachments,
  });

  console.log("twilio:inbound message stored", {
    accountSid,
    ownerUserId,
    conversationId,
    message_id,
    twilioMessageSid: messageSidOpt ?? "",
    hasText: body.trim().length > 0,
    numMedia,
  });

  return new Response(null, { status: 204 });
});

const twilioStatus = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const form = await request.formData();
  const params = formDataToObject(form);

  const signatureHeader = request.headers.get("x-twilio-signature");
  const accountSid = params.AccountSid ?? "";

  console.log("twilio:status webhook received", {
    url: request.url,
    accountSid,
    hasSignature: Boolean(signatureHeader),
    messageSid: params.MessageSid ?? "",
    messageStatus: params.MessageStatus ?? params.SmsStatus ?? "",
  });

  let authToken: string | null = null;
  let authTokenSource: "stored" | "env" | "none" = "none";

  const masterKey = ENV.TWILIO_SUBACCOUNT_AUTH_TOKEN_MASTER_KEY;
  if (masterKey && accountSid) {
    const stored = await ctx.runQuery(
      internalAny.users.getTwilioWebhookSigningKeyByAccountSid,
      { accountSid },
    );
    if (stored) {
      try {
        authToken = await decryptWithAesGcmBase64({
          masterKeyBase64: masterKey,
          ciphertextBase64: stored.ciphertextBase64,
          ivBase64: stored.ivBase64,
        });
        authTokenSource = "stored";
      } catch (e) {
        console.log("twilio:status token decrypt failed", {
          accountSid,
          error: e instanceof Error ? e.message : String(e),
        });
        return new Response("Unauthorized", { status: 403 });
      }
    }
  }

  if (
    !authToken &&
    accountSid &&
    ENV.TWILIO_ACCOUNT_SID === accountSid &&
    ENV.TWILIO_AUTH_TOKEN
  ) {
    authToken = ENV.TWILIO_AUTH_TOKEN;
    authTokenSource = "env";
  }

  if (!authToken) {
    console.log("twilio:status no auth token available", {
      accountSid,
      hasMasterKey: Boolean(masterKey),
    });
    return new Response("Unauthorized", { status: 403 });
  }

  const ok = await verifyTwilioSignature({
    authToken,
    requestUrl: request.url,
    params,
    signatureHeader,
  });
  console.log("twilio:status signature verification", {
    accountSid,
    ok,
    authTokenSource,
  });
  if (!ok) return new Response("Unauthorized", { status: 403 });

  const messageSid = params.MessageSid ?? "";
  const messageStatus = params.MessageStatus ?? params.SmsStatus ?? "";
  if (!messageSid || !messageStatus) {
    return new Response("Bad Request", { status: 400 });
  }

  await ctx.runMutation(internalAny.chatInternal.updateMessageStatusByTwilioSid, {
    twilioMessageSid: messageSid,
    twilioStatus: messageStatus,
  });

  console.log("twilio:status stored", {
    accountSid,
    messageSid,
    messageStatus,
  });

  return new Response(null, { status: 204 });
});

const http = httpRouter();

http.route({
  path: "/twilio/whatsapp/inbound",
  method: "POST",
  handler: twilioInbound,
});

http.route({
  path: "/twilio/whatsapp/status",
  method: "POST",
  handler: twilioStatus,
});

export default http;

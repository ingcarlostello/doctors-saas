import { v } from "convex/values";
import { anyApi } from "convex/server";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { ENV } from "../lib/env";

const apiAny = anyApi as any;
const internalAny = anyApi as any;

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
    ["encrypt", "decrypt"],
  );
}

async function encryptWithAesGcmBase64(opts: {
  masterKeyBase64: string;
  plaintext: string;
}): Promise<{ ciphertextBase64: string; ivBase64: string }> {
  const key = await importAesGcmKeyFromBase64(opts.masterKeyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(opts.plaintext),
  );
  return {
    ciphertextBase64: bytesToBase64(new Uint8Array(ciphertext)),
    ivBase64: bytesToBase64(iv),
  };
}

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new Error("Called storeUser without authentication present");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (user !== null) {
      const updatedFields: {
        name?: string;
        email?: string;
        assignedNumbers?: string[];
      } = {};
      if (user.name !== identity.name && identity.name !== undefined)
        updatedFields.name = identity.name;

      if (user.email !== identity.email && identity.email !== undefined)
        updatedFields.email = identity.email;

      if (Object.keys(updatedFields).length > 0)
        await ctx.db.patch(user._id, updatedFields);

      return user._id;
    }

    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      email: identity.email ?? "",
      tokenIdentifier: identity.tokenIdentifier,
      assignedNumbers: [],
    });
  },
});

export const setTwilioSubaccountSid = mutation({
  args: {
    userId: v.id("users"),
    twilioSubaccountSid: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(
        "Called setTwilioSubaccountSid without authentication present",
      );
    }

    const user = await ctx.db.get(args.userId);
    if (!user || user.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("Not authorized to update this user");
    }

    await ctx.db.patch(args.userId, {
      twilioSubaccountSid: args.twilioSubaccountSid,
    });
  },
});

export const addAssignedNumberToCurrentUser = mutation({
  args: {
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(
        "Called addAssignedNumberToCurrentUser without authentication present",
      );
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      assignedNumbers: [...(user.assignedNumbers ?? []), args.phoneNumber],
    });
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});

export const setCurrentUserTwilioSubaccountAuthToken = action({
  args: {
    authToken: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.runQuery(apiAny.users.currentUser, {});
    if (!user) throw new Error("Usuario no encontrado");
    if (!user.twilioSubaccountSid) {
      throw new Error("Este usuario no tiene subcuenta de Twilio configurada");
    }

    const masterKey = ENV.TWILIO_SUBACCOUNT_AUTH_TOKEN_MASTER_KEY;
    if (!masterKey) {
      throw new Error("TWILIO_SUBACCOUNT_AUTH_TOKEN_MASTER_KEY no configurada");
    }

    const encrypted = await encryptWithAesGcmBase64({
      masterKeyBase64: masterKey,
      plaintext: args.authToken,
    });

    await ctx.runMutation(internalAny.users.setTwilioSubaccountAuthTokenEncrypted, {
      userId: user._id,
      ciphertextBase64: encrypted.ciphertextBase64,
      ivBase64: encrypted.ivBase64,
    });

    return { ok: true };
  },
});

export const setTwilioSubaccountAuthTokenEncrypted = internalMutation({
  args: {
    userId: v.id("users"),
    ciphertextBase64: v.string(),
    ivBase64: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Usuario no encontrado");

    await ctx.db.patch(args.userId, {
      twilioSubaccountAuthTokenCiphertext: args.ciphertextBase64,
      twilioSubaccountAuthTokenIv: args.ivBase64,
    });
  },
});

export const getTwilioWebhookSigningKeyByAccountSid = internalQuery({
  args: {
    accountSid: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_twilio_subaccount_sid", (q) =>
        q.eq("twilioSubaccountSid", args.accountSid),
      )
      .unique();

    if (!user) return null;
    if (
      !user.twilioSubaccountAuthTokenCiphertext ||
      !user.twilioSubaccountAuthTokenIv
    ) {
      return null;
    }

    return {
      ciphertextBase64: user.twilioSubaccountAuthTokenCiphertext,
      ivBase64: user.twilioSubaccountAuthTokenIv,
    };
  },
});

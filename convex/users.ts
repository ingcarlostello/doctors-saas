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
import { encryptWithAesGcmBase64 } from "./utils/crypto";

const apiAny = anyApi as any;
// @ts-ignore
const internal = require("./_generated/api").internal;
const internalAny = internal as any;

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

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

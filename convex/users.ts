import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
      const updatedFields: { name?: string; email?: string } = {};
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

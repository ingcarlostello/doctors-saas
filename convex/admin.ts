import { query } from "./_generated/server";
import { v } from "convex/values";

export const isAdmin = query({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.email) return false;
    
    const admin = await ctx.db
      .query("administrators")
      .withIndex("by_email", (q) => q.eq("email", args.email!))
      .first();
      
    return !!admin && admin.role === "admin";
  },
});

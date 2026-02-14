import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";

// ─── Public: Sync templates from Twilio to local DB ───
// Called from listWhatsAppTemplates action (already auth-checked)
export const syncTemplates = mutation({
    args: {
        userId: v.id("users"),
        templates: v.array(
            v.object({
                sid: v.string(),
                name: v.string(),
                language: v.string(),
                category: v.string(),
                status: v.string(),
                variables: v.optional(v.any()),
                types: v.optional(v.any()),
                body: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        for (const tmpl of args.templates) {
            // Upsert: check if template with this SID already exists
            const existing = await ctx.db
                .query("templates")
                .withIndex("by_sid", (q) => q.eq("sid", tmpl.sid))
                .first();

            if (existing) {
                await ctx.db.patch(existing._id, {
                    name: tmpl.name,
                    language: tmpl.language,
                    category: tmpl.category,
                    status: tmpl.status,
                    variables: tmpl.variables,
                    types: tmpl.types,
                    body: tmpl.body,
                });
            } else {
                await ctx.db.insert("templates", {
                    userId: args.userId,
                    name: tmpl.name,
                    language: tmpl.language,
                    category: tmpl.category,
                    sid: tmpl.sid,
                    status: tmpl.status,
                    variables: tmpl.variables,
                    types: tmpl.types,
                    body: tmpl.body,
                });
            }
        }
    },
});

// ─── Internal: Get a template by userId + name (no auth needed) ───
export const getTemplateByName = internalQuery({
    args: {
        userId: v.id("users"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("templates")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("name"), args.name))
            .first();
    },
});

// ─── Public: List templates (kept for backward compat) ───
export const listTemplates = query({
    args: {},
    handler: async () => {
        return [];
    },
});

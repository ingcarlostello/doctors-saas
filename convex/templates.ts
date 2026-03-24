import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

// ─── Public: Get global templates (for non-admin users) ───
export const getGlobalTemplates = query({
    args: {},
    handler: async (ctx) => {
        // Obtenemos todos los admins
        const admins = await ctx.db.query("administrators").collect();
        const adminEmails = admins.map(a => a.email);

        // Obtenemos los usuarios correspondientes
        const adminUsers: Id<"users">[] = [];
        for (const email of adminEmails) {
            const user = await ctx.db
                .query("users")
                .filter(q => q.eq(q.field("email"), email))
                .first();
            if (user) {
                adminUsers.push(user._id);
            }
        }

        // Filtramos las plantillas por estado 'approved' y que pertenezcan a un admin
        const templates = await ctx.db
            .query("templates")
            .filter((q) => 
                q.and(
                    q.eq(q.field("status"), "approved"),
                    // Simulamos un 'inArray' buscando si el userId está en la lista de adminUsers
                    // Como Convex V1 no tiene un operador funcional nativo inArray en filters dinámicos tan directo a veces, usamos un map/reduce post-query si no lo soporta.
                    // Ah, wait, Convex filters tienen q.or() o podemos filtrar en memoria si hay pocos admins.
                    // Dado que el número de usuarios admins es pequeño, mejor filtrar en memoria.
                )
            )
            .collect();
            
        // Filtrar en memoria por userId
        return templates.filter(t => adminUsers.includes(t.userId));
    },
});

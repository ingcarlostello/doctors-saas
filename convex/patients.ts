import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        fullName: v.string(),
        phoneNumber: v.string(),
        dni: v.string(),
        email: v.optional(v.string()),
        lastAppointmentDate: v.optional(v.number()),
        nextAppointmentDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const patientId = await ctx.db.insert("patients", {
            userId: user._id,
            fullName: args.fullName,
            phoneNumber: args.phoneNumber,
            dni: args.dni,
            email: args.email,
            lastAppointmentDate: args.lastAppointmentDate,
            nextAppointmentDate: args.nextAppointmentDate,
        });

        return patientId;
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) {
            return [];
        }

        return await ctx.db
            .query("patients")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
    },
});

export const remove = mutation({
    args: {
        id: v.id("patients"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        // Get the patient to verify ownership
        const patient = await ctx.db.get(args.id);
        if (!patient) {
            throw new Error("Patient not found");
        }

        if (patient.userId !== user._id) {
            throw new Error("Unauthorized to delete this patient");
        }

        await ctx.db.delete(args.id);
    },
});

export const update = mutation({
    args: {
        id: v.id("patients"),
        fullName: v.optional(v.string()),
        phoneNumber: v.optional(v.string()),
        dni: v.optional(v.string()),
        email: v.optional(v.string()),
        lastAppointmentDate: v.optional(v.number()),
        nextAppointmentDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        // Get the patient to verify ownership
        const patient = await ctx.db.get(args.id);
        if (!patient) {
            throw new Error("Patient not found");
        }

        if (patient.userId !== user._id) {
            throw new Error("Unauthorized to update this patient");
        }

        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

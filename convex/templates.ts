
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Este archivo queda obsoleto al migrar a consumo directo de API de Twilio.
// Se mantiene vacío para evitar errores de compilación inmediatos si hay imports residuales,
// aunque idealmente deberían eliminarse las referencias.

export const createTemplate = mutation({
    args: {
        name: v.string(),
        language: v.string(),
        category: v.string(),
        sid: v.string(),
        status: v.string(),
        variables: v.optional(v.any()),
        types: v.optional(v.any()),
        body: v.string(),
    },
    handler: async () => {
        throw new Error("Esta función está obsoleta. Usar integración directa con Twilio.");
    },
});

export const listTemplates = query({
    args: {},
    handler: async () => {
        return [];
    },
});

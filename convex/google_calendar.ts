import { action, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { ENV } from "../lib/env";

/**
 * --- CRYPTO HELPERS ---
 * Copied/Adapted from twilio.ts to ensure consistency.
 */
function base64ToBytes(base64: string): Uint8Array {
    if (typeof atob === "function") {
        const bin = atob(base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes;
    }
    const BufferImpl = (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer;
    if (BufferImpl) return new Uint8Array(BufferImpl.from(base64, "base64"));
    throw new Error("No base64 decoder available");
}

function bytesToBase64(bytes: Uint8Array): string {
    if (typeof btoa === "function") {
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    const BufferImpl = (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer;
    if (BufferImpl) return BufferImpl.from(bytes).toString("base64");
    throw new Error("No base64 encoder available");
}


async function importAesGcmKeyFromBase64(masterKeyBase64: string): Promise<CryptoKey> {
    const raw = base64ToBytes(masterKeyBase64);
    const rawBuffer = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
    return await crypto.subtle.importKey(
        "raw",
        rawBuffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptWithAesGcm(text: string, masterKeyBase64: string) {
    const key = await importAesGcmKeyFromBase64(masterKeyBase64);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);

    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    ); // Returns ArrayBuffer

    return {
        ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
        iv: bytesToBase64(iv)
    };
}

async function decryptWithAesGcm(opts: {
    masterKeyBase64: string;
    ciphertextBase64: string;
    ivBase64: string;
}): Promise<string> {
    const key = await importAesGcmKeyFromBase64(opts.masterKeyBase64);
    const iv = base64ToBytes(opts.ivBase64);
    const ciphertext = base64ToBytes(opts.ciphertextBase64);

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as unknown as BufferSource },
        key,
        ciphertext as unknown as BufferSource
    );

    return new TextDecoder().decode(decryptedBuffer);
}


/**
 * --- ACTIONS & MUTATIONS ---
 */

// 1. Get Auth URL
export const getAuthUrl = action({
    args: {},
    handler: async () => {
        if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_REDIRECT_URI) {
            throw new Error("Google Config Missing in ENV");
        }

        const params = new URLSearchParams({
            client_id: ENV.GOOGLE_CLIENT_ID,
            redirect_uri: ENV.GOOGLE_REDIRECT_URI,
            response_type: "code",
            scope: "https://www.googleapis.com/auth/calendar openid email",
            access_type: "offline", // Critical for refresh token
            prompt: "consent", // Force consent to ensure refresh token is returned
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
});

// 2. Exchange Code & Store
export const exchangeCode = action({
    args: { code: v.string() },
    handler: async (ctx, { code }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET || !ENV.GOOGLE_REDIRECT_URI) {
            throw new Error("Google Config Missing");
        }

        const tokenUrl = "https://oauth2.googleapis.com/token";
        console.log("Exchanging code for tokens...");
        
        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: ENV.GOOGLE_CLIENT_ID,
                client_secret: ENV.GOOGLE_CLIENT_SECRET,
                redirect_uri: ENV.GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code",
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Google Token Exchange Failed:", err);
            throw new Error(`Google Token Exchange Failed: ${err}`);
        }

        const tokens = await response.json();
        const { access_token, refresh_token, expires_in, scope, token_type } = tokens;

        console.log("Tokens received. Refresh token present:", !!refresh_token);

        // Save to DB via internal mutation
        await ctx.runMutation(internal.google_calendar.saveTokens, {
            accessToken: access_token,
            // If user re-auths without prompt=consent, refresh_token might be undefined.
            // But we requested prompt=consent, so it should be there.
            refreshToken: refresh_token || "",
            expiresIn: expires_in,
            scope,
            tokenType: token_type,
        });

        return { success: true };
    }
});

// 3. Store Tokens (Internal)
export const saveTokens = internalMutation({
    args: {
        accessToken: v.string(),
        refreshToken: v.string(),
        expiresIn: v.number(),
        scope: v.string(),
        tokenType: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        // Encrypt
        const masterKey = ENV.GOOGLE_TOKENS_MASTER_KEY;
        if (!masterKey) throw new Error("Server Encryption Key Missing");

        const encAccess = await encryptWithAesGcm(args.accessToken, masterKey);
        
        // Calculate expiry timestamp
        const expiresAt = Date.now() + (args.expiresIn * 1000);

        // Check if existing record
        const existingToken = await ctx.db
            .query("google_calendar_tokens")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();

        const data: any = {
            userId: user._id,
            accessTokenCiphertext: encAccess.ciphertext,
            accessTokenIv: encAccess.iv,
            expiresAt,
            tokenType: args.tokenType,
            scope: args.scope,
        };

        if (args.refreshToken) {
            const encRefresh = await encryptWithAesGcm(args.refreshToken, masterKey);
            data.refreshTokenCiphertext = encRefresh.ciphertext;
            data.refreshTokenIv = encRefresh.iv;
        }

        if (existingToken) {
            // Update
            // Keep old refresh token if new one is not provided
            if (!args.refreshToken) {
                 // We don't overwrite if not provided
            }
            
            await ctx.db.patch(existingToken._id, data);
        } else {
            if (!args.refreshToken) throw new Error("No refresh token received for new connection");
            await ctx.db.insert("google_calendar_tokens", {
                ...data,
                // Ensure typescript is happy - we checked args.refreshToken above
                refreshTokenCiphertext: data.refreshTokenCiphertext!, 
                refreshTokenIv: data.refreshTokenIv!,
            });
        }
    }
});


// 4. Get Tokens Internal (Helper to retrieve decrypted tokens)
export const getTokensInternal = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const tokenRecord = await ctx.db
            .query("google_calendar_tokens")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .unique();

        if (!tokenRecord) return null;

        const masterKey = ENV.GOOGLE_TOKENS_MASTER_KEY;
        if (!masterKey) throw new Error("Server Encryption Key Missing");

        const accessToken = await decryptWithAesGcm({
            masterKeyBase64: masterKey,
            ciphertextBase64: tokenRecord.accessTokenCiphertext,
            ivBase64: tokenRecord.accessTokenIv,
        });

        const refreshToken = await decryptWithAesGcm({
            masterKeyBase64: masterKey,
            ciphertextBase64: tokenRecord.refreshTokenCiphertext,
            ivBase64: tokenRecord.refreshTokenIv,
        });

        return {
            accessToken,
            refreshToken,
            expiresAt: tokenRecord.expiresAt,
            scope: tokenRecord.scope,
        };
    }
});


// 5. Get Authorization Header (Deprecated/Wrapped)
export const getAuthorizationHeader = action({
    args: {},
    handler: async (ctx) => {
        const token = await ensureAccessToken(ctx);
        return `Bearer ${token}`;
    }
});

/**
 * --- INTERNAL HELPER FOR ACTIONS ---
 */
async function ensureAccessToken(ctx: ActionCtx): Promise<string> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // 1. Get User
    const user = await ctx.runQuery(api.users.currentUser, {});
    if (!user) throw new Error("User not found");

    // 2. Get Decrypted Tokens
    const tokens = await ctx.runQuery(internal.google_calendar.getTokensInternal, { userId: user._id });
    if (!tokens) throw new Error("Google Calendar not connected");

    // 3. Check Expiry (Refresh if < 5 mins remaining)
    const now = Date.now();
    if (tokens.expiresAt < now + 5 * 60 * 1000) {
        if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) {
            throw new Error("Google Config Missing");
        }

        console.log("Refreshing Google Access Token...");

        const tokenUrl = "https://oauth2.googleapis.com/token";
        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: ENV.GOOGLE_CLIENT_ID,
                client_secret: ENV.GOOGLE_CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: tokens.refreshToken,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Token Refresh Failed:", err);
            // Throw a specific error that frontend can recognize to force re-auth
            throw new Error("Google Token Refresh Failed. Please reconnect.");
        }

        const newTokens = await response.json();
        const { access_token, expires_in, scope, token_type } = newTokens;

        console.log("Token refreshed successfully.");

        // Save new access token
        await ctx.runMutation(internal.google_calendar.saveTokens, {
            accessToken: access_token,
            refreshToken: "", // Don't update refresh token if not returned
            expiresIn: expires_in,
            scope: scope || tokens.scope,
            tokenType: token_type || "Bearer",
        });

        return access_token;
    }

    return tokens.accessToken;
}

// 6. List Events
export const listEvents = action({
    args: {
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        try {
            const accessToken = await ensureAccessToken(ctx);

            const params = new URLSearchParams({
                calendarId: 'primary',
                singleEvents: 'true',
                orderBy: 'startTime',
            });

            if (args.startTime) params.append('timeMin', new Date(args.startTime).toISOString());
            if (args.endTime) params.append('timeMax', new Date(args.endTime).toISOString());

            const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;
            console.log("Listing events from:", url);

            const response = await fetch(url, {
                method: "GET",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) {
                const err = await response.text();
                console.error("Google Calendar API Error (ListEvents):", response.status, err);
                throw new Error(`Google Calendar API Error: ${err}`);
            }

            const data = await response.json();
            console.log(`Found ${data.items?.length || 0} events from Google.`);
            return data.items || [];
        } catch (error: any) {
            console.error("listEvents action failed:", error);
            // If it's the "not connected" error, return specific string for frontend
            if (error.message === "Google Calendar not connected" || error.message.includes("Google Token Refresh Failed")) {
                return "The user is not yet connected to Google Calendar. ";
            }
            throw error;
        }
    }
});

// 7. Create Event
export const createEvent = action({
    args: {
        summary: v.string(),
        description: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.number(),
        attendees: v.optional(v.array(v.string())), // emails
    },
    handler: async (ctx, args) => {
        const accessToken = await ensureAccessToken(ctx);

        const event = {
            summary: args.summary,
            description: args.description,
            start: { dateTime: new Date(args.startTime).toISOString() },
            end: { dateTime: new Date(args.endTime).toISOString() },
            attendees: args.attendees?.map(email => ({ email })),
        };

        console.log("Creating event:", JSON.stringify(event));

        const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Create Event Failed:", response.status, err);
            throw new Error(`Failed to create event: ${err}`);
        }

        const resJson = await response.json();
        console.log("Event created successfully:", resJson.id);
        return resJson;
    }
});

// 8. Update Event
export const updateEvent = action({
    args: {
        eventId: v.string(),
        summary: v.optional(v.string()),
        description: v.optional(v.string()),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        attendees: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const accessToken = await ensureAccessToken(ctx);

        const patchBody: any = {};
        if (args.summary !== undefined) patchBody.summary = args.summary;
        if (args.description !== undefined) patchBody.description = args.description;
        if (args.startTime !== undefined) patchBody.start = { dateTime: new Date(args.startTime).toISOString() };
        if (args.endTime !== undefined) patchBody.end = { dateTime: new Date(args.endTime).toISOString() };
        if (args.attendees !== undefined) patchBody.attendees = args.attendees.map(email => ({ email }));

        console.log(`Updating event ${args.eventId} with:`, JSON.stringify(patchBody));

        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${args.eventId}`, {
            method: "PATCH", // Using PATCH for partial update
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(patchBody),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Update Event Failed:", response.status, err);
            throw new Error(`Failed to update event: ${err}`);
        }

        const resJson = await response.json();
        console.log("Event updated successfully:", resJson.id);
        return resJson;
    }
});

// 9. Delete Event
export const deleteEvent = action({
    args: {
        eventId: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("Deleting event:", args.eventId);
        const accessToken = await ensureAccessToken(ctx);

        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${args.eventId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const err = await response.text();
            
            // 410 Gone means already deleted
            if (response.status === 410) {
                 console.log("Event already deleted (410)");
                 return { success: true };
            }
            
            console.error("Delete Event Failed:", response.status, err);
            throw new Error(`Failed to delete event: ${err}`);
        }

        console.log("Event deleted successfully");
        return { success: true };
    }
});

// 10. Get Calendars
export const getCalendars = action({
    args: {},
    handler: async (ctx) => {
        const accessToken = await ensureAccessToken(ctx);

        const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("List Calendars Failed:", response.status, err);
            throw new Error(`Failed to list calendars: ${err}`);
        }

        const data = await response.json();
        const items = data.items || [];

        return items.map((cal: any) => ({
            id: cal.id,
            summary: cal.summary,
            primary: cal.primary,
            backgroundColor: cal.backgroundColor,
        }));
    }
});

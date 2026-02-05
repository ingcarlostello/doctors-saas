import { internalMutation } from "../_generated/server";
import { anyApi } from "convex/server";
import { v } from "convex/values";
import { ENV } from "../../lib/env";
import { encryptWithAesGcm } from "./google_calendar_helpers";

const internalAny = anyApi as any;

export const saveTokens = internalMutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresIn: v.number(),
    scope: v.string(),
    tokenType: v.string(),
    calendarEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");
    
    // Update user with calendarEmail if provided
    if (args.calendarEmail) {
      await ctx.db.patch(user._id, { calendarEmail: args.calendarEmail });
    }

    const masterKey = ENV.GOOGLE_TOKENS_MASTER_KEY;
    if (!masterKey) throw new Error("Server Encryption Key Missing");
    const encAccess = await encryptWithAesGcm(args.accessToken, masterKey);
    const expiresAt = Date.now() + args.expiresIn * 1000;
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
      await ctx.db.patch(existingToken._id, data);
    } else {
      if (!args.refreshToken) throw new Error("No refresh token received for new connection");
      await ctx.db.insert("google_calendar_tokens", {
        ...data,
        refreshTokenCiphertext: data.refreshTokenCiphertext!,
        refreshTokenIv: data.refreshTokenIv!,
      });
    }
  },
});

export const deleteLocalEvent = internalMutation({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    await ctx.runMutation(internalAny.notifications.cancelReminders, { eventId: args.eventId });
    const existing = await ctx.db
      .query("calendar_events")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);

      // Remove from patient history if applicable
      if (existing.patientId) {
        const patient = await ctx.db.get(existing.patientId);
        if (patient && patient.appointmentHistory) {
          const newHistory = patient.appointmentHistory.filter(h => h.appointmentId !== args.eventId);
          await ctx.db.patch(patient._id, { appointmentHistory: newHistory });
        }
      }
    }
  },
});

export const saveSyncedEvents = internalMutation({
  args: {
    events: v.array(
      v.object({
        eventId: v.string(),
        summary: v.string(),
        description: v.optional(v.string()),
        start: v.any(),
        end: v.any(),
        status: v.string(),
        htmlLink: v.optional(v.string()),
        attendees: v.optional(v.array(v.any())),
        patientId: v.optional(v.id("patients")),
        patientName: v.optional(v.string()),
        customersWhatsappNumber: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { events }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");
    const now = Date.now();
    for (const event of events) {
      let startTime = 0;
      let endTime = 0;
      if (event.start.dateTime) {
        startTime = new Date(event.start.dateTime).getTime();
      } else if (event.start.date) {
        startTime = new Date(event.start.date).getTime();
      }
      if (event.end.dateTime) {
        endTime = new Date(event.end.dateTime).getTime();
      } else if (event.end.date) {
        endTime = new Date(event.end.date).getTime();
      }
      const existing = await ctx.db
        .query("calendar_events")
        .withIndex("by_eventId", (q) => q.eq("eventId", event.eventId))
        .unique();
      const eventData = {
        userId: user._id,
        calendarId: "primary",
        title: event.summary,
        description: event.description,
        startTime,
        endTime,
        status: event.status,
        htmlLink: event.htmlLink,
        attendees: event.attendees?.map((a: any) => a.email).filter(Boolean),
        patientId: event.patientId,
        patientName: event.patientName,
        customersWhatsappNumber: event.customersWhatsappNumber,
        lastSyncedAt: now,
      };
      if (existing) {
        await ctx.db.patch(existing._id, {
          ...eventData,
          reminderSent24h: existing.reminderSent24h,
        });
        await ctx.runMutation(internalAny.notifications.scheduleReminders, {
          eventId: event.eventId,
          startTime,
          title: event.summary || "No Title",
        });

        // Update Patient History if patientId exists
        if (event.patientId) {
          const patient = await ctx.db.get(event.patientId);
          if (patient) {
            const newHistoryItem = {
              appointmentId: event.eventId,
              date: startTime,
              status: event.status,
              notes: event.description,
            };
            const currentHistory = patient.appointmentHistory || [];
            // Remove existing entry if any (to update it)
            const filteredHistory = currentHistory.filter(h => h.appointmentId !== event.eventId);
            await ctx.db.patch(patient._id, {
              appointmentHistory: [...filteredHistory, newHistoryItem],
              lastAppointmentDate: startTime,
              nextAppointmentDate: startTime > now ? startTime : patient.nextAppointmentDate,
            });
          }
        }
      } else {
        await ctx.db.insert("calendar_events", {
          ...eventData,
          eventId: event.eventId,
          reminderSent24h: false,
        });
        await ctx.runMutation(internalAny.notifications.scheduleReminders, {
          eventId: event.eventId,
          startTime,
          title: event.summary || "No Title",
        });

        // Update Patient History if patientId exists
        if (event.patientId) {
          const patient = await ctx.db.get(event.patientId);
          if (patient) {
            const newHistoryItem = {
              appointmentId: event.eventId,
              date: startTime,
              status: event.status,
              notes: event.description,
            };
            const currentHistory = patient.appointmentHistory || [];
            // Remove existing entry if any (to update it)
            const filteredHistory = currentHistory.filter(h => h.appointmentId !== event.eventId);
            await ctx.db.patch(patient._id, {
              appointmentHistory: [...filteredHistory, newHistoryItem],
              lastAppointmentDate: startTime,
              nextAppointmentDate: startTime > now ? startTime : patient.nextAppointmentDate,
            });
          }
        }
      }
    }
  },
});

export const saveTokensForUserInternal = internalMutation({
  args: {
    userId: v.id("users"),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresIn: v.number(),
    scope: v.string(),
    tokenType: v.string(),
  },
  handler: async (ctx, args) => {
    const masterKey = ENV.GOOGLE_TOKENS_MASTER_KEY;
    if (!masterKey) throw new Error("Server Encryption Key Missing");
    const encAccess = await encryptWithAesGcm(args.accessToken, masterKey);
    const expiresAt = Date.now() + args.expiresIn * 1000;
    const existingToken = await ctx.db
      .query("google_calendar_tokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    const data: any = {
      userId: args.userId,
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
      await ctx.db.patch(existingToken._id, data);
    } else {
      if (!args.refreshToken && !existingToken) throw new Error("No refresh token");
      await ctx.db.insert("google_calendar_tokens", {
        ...data,
        refreshTokenCiphertext: data.refreshTokenCiphertext!,
        refreshTokenIv: data.refreshTokenIv!,
      });
    }
  },
});

export const saveSyncedEventsForUser = internalMutation({
  args: {
    userId: v.id("users"),
    events: v.array(
      v.object({
        eventId: v.string(),
        summary: v.string(),
        description: v.optional(v.string()),
        start: v.any(),
        end: v.any(),
        status: v.string(),
        htmlLink: v.optional(v.string()),
        attendees: v.optional(v.array(v.any())),
      })
    ),
  },
  handler: async (ctx, { userId, events }) => {
    const now = Date.now();
    for (const event of events) {
      let startTime = 0;
      let endTime = 0;
      if (event.start.dateTime) {
        startTime = new Date(event.start.dateTime).getTime();
      } else if (event.start.date) {
        startTime = new Date(event.start.date).getTime();
      }
      if (event.end.dateTime) {
        endTime = new Date(event.end.dateTime).getTime();
      } else if (event.end.date) {
        endTime = new Date(event.end.date).getTime();
      }
      const existing = await ctx.db
        .query("calendar_events")
        .withIndex("by_eventId", (q) => q.eq("eventId", event.eventId))
        .unique();
      const eventData = {
        userId,
        calendarId: "primary",
        title: event.summary,
        description: event.description,
        startTime,
        endTime,
        status: event.status,
        htmlLink: event.htmlLink,
        attendees: event.attendees?.map((a: any) => a.email).filter(Boolean),
        lastSyncedAt: now,
      };
      if (existing) {
        let reminderSent24h = existing.reminderSent24h;
        if (Math.abs(existing.startTime - startTime) > 60 * 60 * 1000) {
          reminderSent24h = false;
        }
        await ctx.db.patch(existing._id, { ...eventData, reminderSent24h });

        // Update Patient History if this event is linked to a patient
        if (existing.patientId) {
          const patient = await ctx.db.get(existing.patientId);
          if (patient) {
            const newHistoryItem = {
              appointmentId: event.eventId,
              date: startTime,
              status: event.status,
              notes: event.description,
            };
            const currentHistory = patient.appointmentHistory || [];
            const filteredHistory = currentHistory.filter(h => h.appointmentId !== event.eventId);
            await ctx.db.patch(patient._id, {
              appointmentHistory: [...filteredHistory, newHistoryItem],
              lastAppointmentDate: startTime,
              nextAppointmentDate: startTime > now ? startTime : patient.nextAppointmentDate,
            });
          }
        }
      } else {
        await ctx.db.insert("calendar_events", {
          ...eventData,
          eventId: event.eventId,
          reminderSent24h: false,
        });
        await ctx.runMutation(internalAny.notifications.scheduleReminders, {
          eventId: event.eventId,
          startTime,
          title: event.summary || "No Title",
        });
      }
    }
  },
});

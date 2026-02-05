import { action, type ActionCtx } from "../_generated/server";
import { anyApi } from "convex/server";
import { v } from "convex/values";
import { ENV } from "../../lib/env";

const internalAny = anyApi as any;
const apiAny = anyApi as any;

async function ensureAccessToken(ctx: ActionCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  const user = await ctx.runQuery(apiAny.users.currentUser, {});
  if (!user) throw new Error("User not found");
  const tokens = await ctx.runQuery(internalAny.google_calendar.getTokensInternal, { userId: user._id });
  if (!tokens) throw new Error("Google Calendar not connected");
  const now = Date.now();
  if (tokens.expiresAt < now + 5 * 60 * 1000) {
    if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) {
      throw new Error("Google Config Missing");
    }
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
      throw new Error("Google Token Refresh Failed. Please reconnect.");
    }
    const newTokens = await response.json();
    const { access_token, expires_in, scope, token_type } = newTokens;
    await ctx.runMutation(internalAny.google_calendar.saveTokens, {
      accessToken: access_token,
      refreshToken: "",
      expiresIn: expires_in,
      scope: scope || tokens.scope,
      tokenType: token_type || "Bearer",
    });
    return access_token;
  }
  return tokens.accessToken;
}

async function ensureAccessTokenForUser(ctx: ActionCtx, userId: any): Promise<string> {
  const tokens = await ctx.runQuery(internalAny.google_calendar.getTokensInternal, { userId });
  if (!tokens) throw new Error("Google Calendar not connected for user " + userId);
  const now = Date.now();
  if (tokens.expiresAt < now + 5 * 60 * 1000) {
    if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) {
      throw new Error("Google Config Missing");
    }
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
      throw new Error("Cron Token Refresh Failed");
    }
    const newTokens = await response.json();
    const { access_token, expires_in, scope, token_type } = newTokens;
    await ctx.runMutation(internalAny.google_calendar.saveTokensForUserInternal, {
      userId,
      accessToken: access_token,
      refreshToken: "",
      expiresIn: expires_in,
      scope: scope || tokens.scope,
      tokenType: token_type || "Bearer",
    });
    return access_token;
  }
  return tokens.accessToken;
}

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
      access_type: "offline",
      prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },
});

export const exchangeCode = action({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET || !ENV.GOOGLE_REDIRECT_URI) {
      throw new Error("Google Config Missing");
    }
    const tokenUrl = "https://oauth2.googleapis.com/token";
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
      throw new Error(`Google Token Exchange Failed: ${err}`);
    }
    const tokens = await response.json();
    const { access_token, refresh_token, expires_in, scope, token_type } = tokens;

    // Fetch user info to get email
    const userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
    const userResponse = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    let calendarEmail: string | undefined = undefined;
    if (userResponse.ok) {
        const userData = await userResponse.json();
        calendarEmail = userData.email;
    }

    await ctx.runMutation(internalAny.google_calendar.saveTokens, {
      accessToken: access_token,
      refreshToken: refresh_token || "",
      expiresIn: expires_in,
      scope,
      tokenType: token_type,
      calendarEmail,
    });
    return { success: true };
  },
});

export const getAuthorizationHeader = action({
  args: {},
  handler: async (ctx) => {
    const token = await ensureAccessToken(ctx);
    return `Bearer ${token}`;
  },
});

export const listEvents = action({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const accessToken = await ensureAccessToken(ctx);
      const params = new URLSearchParams({
        calendarId: "primary",
        singleEvents: "true",
        orderBy: "startTime",
      });
      if (args.startTime) {
        params.append("timeMin", new Date(args.startTime).toISOString());
      }
      if (args.endTime) {
        let timeMax = args.endTime;
        if (args.startTime && timeMax <= args.startTime) {
          timeMax = args.startTime + 30 * 24 * 60 * 60 * 1000;
        }
        params.append("timeMax", new Date(timeMax).toISOString());
      }
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const err = await response.text();
        if (err.includes("timeRangeEmpty")) {
          return [];
        }
        throw new Error(`Google Calendar API Error: ${err}`);
      }
      const data = await response.json();
      return data.items || [];
    } catch (error: any) {
      if (error.message === "Google Calendar not connected" || error.message.includes("Google Token Refresh Failed")) {
        return "The user is not yet connected to Google Calendar. ";
      }
      throw error;
    }
  },
});

export const createEvent = action({
  args: {
    summary: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.optional(v.array(v.string())),
    patientId: v.optional(v.id("patients")),
    patientName: v.optional(v.string()),
    patientWhatsApp: v.optional(v.string()), // For customersWhatsappNumber
  },
  handler: async (ctx, args) => {
    const accessToken = await ensureAccessToken(ctx);
    let finalEndTime = args.endTime;
    if (finalEndTime <= args.startTime) {
      finalEndTime = args.startTime + 30 * 60 * 1000;
    }
    const event = {
      summary: args.summary,
      description: args.description,
      start: { dateTime: new Date(args.startTime).toISOString() },
      end: { dateTime: new Date(finalEndTime).toISOString() },
      attendees: args.attendees?.map((email) => ({ email })),
    };
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
      throw new Error(`Failed to create event: ${err}`);
    }
    const resJson = await response.json();
    await ctx.runMutation(internalAny.google_calendar.saveSyncedEvents, {
      events: [
        {
          eventId: resJson.id,
          summary: resJson.summary || args.summary,
          description: resJson.description,
          start: resJson.start,
          end: resJson.end,
          status: resJson.status,
          htmlLink: resJson.htmlLink,
          attendees: resJson.attendees,
          patientId: args.patientId,
          patientName: args.patientName,
          customersWhatsappNumber: args.patientWhatsApp,
        },
      ],
    });
    return resJson;
  },
});

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
    if (args.attendees !== undefined) patchBody.attendees = args.attendees.map((email) => ({ email }));
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${args.eventId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patchBody),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to update event: ${err}`);
    }
    const resJson = await response.json();
    await ctx.runMutation(internalAny.google_calendar.saveSyncedEvents, {
      events: [
        {
          eventId: resJson.id,
          summary: resJson.summary || "",
          description: resJson.description,
          start: resJson.start,
          end: resJson.end,
          status: resJson.status,
          htmlLink: resJson.htmlLink,
          attendees: resJson.attendees,
        },
      ],
    });
    return resJson;
  },
});

export const deleteEvent = action({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const accessToken = await ensureAccessToken(ctx);
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${args.eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      const err = await response.text();
      if (response.status === 410) {
        await ctx.runMutation(internalAny.google_calendar.deleteLocalEvent, { eventId: args.eventId });
        return { success: true };
      }
      throw new Error(`Failed to delete event: ${err}`);
    }
    await ctx.runMutation(internalAny.google_calendar.deleteLocalEvent, { eventId: args.eventId });
    return { success: true };
  },
});

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
  },
});

export const syncEventsAction = action({
  args: {},
  handler: async (ctx) => {
    try {
      const accessToken = await ensureAccessToken(ctx);
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const params = new URLSearchParams({
        calendarId: "primary",
        singleEvents: "true",
        orderBy: "startTime",
        timeMin,
        timeMax,
        maxResults: "250",
      });
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const err = await response.text();
        if (err.includes("timeRangeEmpty")) {
          return { success: true, count: 0 };
        }
        throw new Error(`Google Calendar API Sync Error: ${err}`);
      }
      const data = await response.json();
      const events = data.items || [];
      if (events.length > 0) {
        await ctx.runMutation(internalAny.google_calendar.saveSyncedEvents, {
          events: events.map((e: any) => ({
            eventId: e.id,
            summary: e.summary || "No Title",
            description: e.description,
            start: e.start,
            end: e.end,
            status: e.status,
            htmlLink: e.htmlLink,
            attendees: e.attendees,
          })),
        });
      }
      return { success: true, count: events.length };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

export const performCronSync = action({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(internalAny.google_calendar.getAllUsersWithTokens);
    for (const user of users) {
      try {
        const accessToken = await ensureAccessTokenForUser(ctx, user.userId);
        const now = new Date();
        const timeMin = now.toISOString();
        const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const params = new URLSearchParams({
          calendarId: "primary",
          singleEvents: "true",
          orderBy: "startTime",
          timeMin,
          timeMax,
          maxResults: "250",
        });
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          const events = data.items || [];
          if (events.length > 0) {
            await ctx.runMutation(internalAny.google_calendar.saveSyncedEventsForUser, {
              userId: user.userId,
              events: events.map((e: any) => ({
                eventId: e.id,
                summary: e.summary || "No Title",
                description: e.description,
                start: e.start,
                end: e.end,
                status: e.status,
                htmlLink: e.htmlLink,
                attendees: e.attendees,
              })),
            });
          }
        }
      } catch {
      }
    }
  },
});

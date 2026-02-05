import { internalMutation, internalAction, mutation } from "./_generated/server";
import { v } from "convex/values";
import { anyApi } from "convex/server";

const internalAny = anyApi as any;

// 1. Schedule Reminders (Called when event is created/updated)
export const scheduleReminders = internalMutation({
    args: {
        eventId: v.string(), // Google Event ID
        startTime: v.number(),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const event = await ctx.db
            .query("calendar_events")
            .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
            .unique();

        if (!event) return;

        // Cleanup existing jobs if re-scheduling
        if (event.reminderJobId24h) {
            try {
                await ctx.scheduler.cancel(event.reminderJobId24h);
            } catch (e) {
                // Job might have already run or doesn't exist
            }
        }
        if (event.reminderJobId1h) {
            try {
                await ctx.scheduler.cancel(event.reminderJobId1h);
            } catch (e) {
                // Job might have already run
            }
        }

        const now = Date.now();
        const start = args.startTime;

        // Calculate Trigger Times
        const time24h = start - (24 * 60 * 60 * 1000);
        const time2h = start - (2 * 60 * 60 * 1000); // 2 Hours before

        let jobId24h = undefined;
        let jobId1h = undefined;

        // Schedule 24h Reminder (if future)
        if (time24h > now) {
            jobId24h = await ctx.scheduler.runAt(time24h, internalAny.notifications.sendConsoleReminder, {
                eventId: args.eventId,
                title: args.title,
                type: "24h",
            });
            console.log(`Scheduled 24h reminder for ${args.title} at ${new Date(time24h).toISOString()}`);
        }

        // Schedule 2h Reminder (if future)
        if (time2h > now) {
            jobId1h = await ctx.scheduler.runAt(time2h, internalAny.notifications.sendConsoleReminder, {
                eventId: args.eventId,
                title: args.title,
                type: "2h",
            });
            console.log(`Scheduled 2h reminder for ${args.title} at ${new Date(time2h).toISOString()}`);
        }

        // Update DB with new Job IDs
        // Note: keeping "reminderJobId1h" column name for now to avoid schema drift, 
        // but semantically it stores the 2h reminder job.
        await ctx.db.patch(event._id, {
            reminderJobId24h: jobId24h,
            reminderJobId1h: jobId1h,
        });
    }
});

// 2. Cancel Reminders (Called when event is deleted)
export const cancelReminders = internalMutation({
    args: {
        eventId: v.string(),
    },
    handler: async (ctx, args) => {
        const event = await ctx.db
            .query("calendar_events")
            .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
            .unique();

        if (!event) return;

        if (event.reminderJobId24h) {
            try { await ctx.scheduler.cancel(event.reminderJobId24h); } catch (e) { }
        }
        if (event.reminderJobId1h) {
            try { await ctx.scheduler.cancel(event.reminderJobId1h); } catch (e) { }
        }

        // Clear IDs from DB (though event might be deleted soon after)
        await ctx.db.patch(event._id, {
            reminderJobId24h: undefined,
            reminderJobId1h: undefined,
        });
    }
});

// 3. The Reminder Action (Triggered by Scheduler)
export const sendConsoleReminder = internalMutation({
    args: {
        eventId: v.string(),
        title: v.string(),
        type: v.string(), // "24h" or "2h"
    },
    handler: async (ctx, args) => {
        // Here is where we would call Twilio/WhatsApp
        console.log(`[REMINDER SENT] Type: ${args.type} | Event: "${args.title}" (ID: ${args.eventId})`);

        const event = await ctx.db
            .query("calendar_events")
            .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
            .unique();

        if (event && args.type === "24h") {
            // Update DB so frontend can react
            await ctx.db.patch(event._id, {
                reminderSent24h: true,
                // Also we could update status here if requested
            });
        }
    }
});

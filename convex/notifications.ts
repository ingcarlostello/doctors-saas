import { internalMutation, internalAction, mutation } from "./_generated/server";
import { v } from "convex/values";
import { anyApi } from "convex/server";


const internal = require("./_generated/api").internal;
const internalAny = internal as any;
const apiAny = anyApi as any;

// 1. Schedule Reminders (Called when event is created/updated)
export const scheduleReminders = internalMutation({
    args: {
        eventId: v.string(), // Google Event ID
        startTime: v.number(),
        title: v.string(),
        contentSid: v.optional(v.string()), // Template SID resolved at schedule time
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

        // Store the template SID on the event for the job to use
        if (args.contentSid) {
            await ctx.db.patch(event._id, { reminderTemplateSid: args.contentSid });
        }

        // Schedule 24h Reminder (if future)
        if (time24h > now) {
            jobId24h = await ctx.scheduler.runAt(time24h, internalAny.notifications.sendWhatsAppReminder, {
                eventId: args.eventId,
                title: args.title,
                type: "24h",
                contentSid: args.contentSid,
            });
            console.log(`Scheduled 24h reminder for ${args.title} at ${new Date(time24h).toISOString()}`);
        }

        // Schedule 2h Reminder (if future)
        if (time2h > now) {
            jobId1h = await ctx.scheduler.runAt(time2h, internalAny.notifications.sendWhatsAppReminder, {
                eventId: args.eventId,
                title: args.title,
                type: "2h",
                contentSid: args.contentSid,
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

export const sendWhatsAppReminder = internalAction({
    args: {
        eventId: v.string(),
        title: v.string(),
        type: v.string(),
        contentSid: v.optional(v.string()), // Template SID passed from scheduler
    },
    handler: async (ctx, args) => {
        console.log(`Sending WhatsApp reminder (${args.type}) for event: ${args.title}`);

        // 1. Get Event Details
        const event = await ctx.runQuery(internalAny.google_calendar.getEventByGoogleIdInternal, {
            eventId: args.eventId,
        });

        if (!event) {
            console.error(`Event not found for reminder: ${args.eventId}`);
            return;
        }
        console.log("event ===>", event);
        if (!event.customersWhatsappNumber) {
            console.log(`No WhatsApp number for event ${args.eventId}, skipping reminder.`);
            return;
        }

        // 2. Get Template SID: query local DB (no auth needed), fallback to arg/event field
        let contentSid = args.contentSid || event.reminderTemplateSid;

        if (!contentSid) {
            // Look up from local templates table (synced from Twilio)
            const localTemplate = await ctx.runQuery(internalAny.templates.getTemplateByName, {
                userId: event.userId,
                name: "recordatorio_cita",
            });
            if (localTemplate) {
                contentSid = localTemplate.sid;
            }
        }

        if (!contentSid) {
            console.error("No template SID available for reminder. Make sure templates are synced (visit WhatsApp Templates page).");
            return;
        }

        // 3. Prepare Variables
        // {{1}}: Patient Name
        // {{2}}: Doctor Name
        // {{3}}: Date

        const patientName = event.patientName || "Paciente";

        // Fetch Doctor Name
        const doctor = await ctx.runQuery(apiAny.users.getUser, { userId: event.userId });
        const doctorName = doctor?.name || "Dr. Consulta";
        const assignedNumber = doctor?.assignedNumbers?.[0];

        const date = new Date(event.startTime);
        const formattedDate = date.toLocaleDateString("es-ES", {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });

        const variables = {
            "1": patientName,
            "2": doctorName,
            "3": formattedDate
        };

        // 4. Ensure Conversation Exists
        const conversationId = await ctx.runMutation(internalAny.chatInternal.getOrCreateConversationSystem, {
            ownerUserId: event.userId,
            phoneNumber: event.customersWhatsappNumber,
            assignedNumber: assignedNumber,
        });

        // 5. Send Message (internal action, no auth needed)
        await ctx.runAction(internalAny.chatActions.sendWhatsAppMessageInternal, {
            userId: event.userId,
            conversationId: conversationId,
            contentSid: contentSid,
            contentVariables: JSON.stringify(variables),
        });

        console.log(`WhatsApp reminder sent to ${event.customersWhatsappNumber}`);
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

import { cronJobs, anyApi } from "convex/server";

const crons = cronJobs();
const apiAny = anyApi as any;

// 1. Sync Calendar Events (Every 30 minutes)
crons.interval(
    "sync-calendar-events",
    { minutes: 30 },
    apiAny.google_calendar.performCronSync,
    {}
);



export default crons;

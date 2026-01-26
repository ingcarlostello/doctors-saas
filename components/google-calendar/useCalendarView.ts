"use client";

import { useCallback, useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { View, Views } from "react-big-calendar";
import { CalendarEvent, CalendarStatus, UseCalendarViewResult } from "./google-calendar";

export function useCalendarView(): UseCalendarViewResult {
    const listEvents = useAction(api.google_calendar.listEvents);
    const getAuthUrl = useAction(api.google_calendar.getAuthUrl);

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [status, setStatus] = useState<CalendarStatus>("loading");
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<View>(Views.WEEK);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const loadEvents = useCallback(async (forceRefresh = false) => {
        try {
            if (status !== "connected" || forceRefresh) {
                setStatus("loading");
            }

            const currentYear = date.getFullYear();
            const currentMonth = date.getMonth();
            const start = new Date(currentYear, currentMonth - 2, 1).getTime();
            const end = new Date(currentYear, currentMonth + 3, 0).getTime();

            const data = await listEvents({ startTime: start, endTime: end });
            console.log("Google Calendar Events:", data);

            if (typeof data === "string") {
                console.log("Not connected message:", data);
                setStatus("disconnected");
                return;
            }

            const mapped: CalendarEvent[] = data.map((e: any) => ({
                title: e.summary || "(No Title)",
                start: new Date(e.start.dateTime || e.start.date),
                end: new Date(e.end.dateTime || e.end.date),
                allDay: !e.start.dateTime,
                resource: e,
            }));

            setEvents(mapped);
            setStatus("connected");
        } catch (err: any) {
            console.error("Calendar load error:", err);
            const errMsg = err.message || "";
            if (errMsg.includes("Google Calendar not connected") || errMsg.includes("Google Token Refresh Failed") || errMsg.includes("Unauthenticated")) {
                setStatus("disconnected");
            } else {
                if (status !== "connected") {
                    setStatus("error");
                }
                // Optional: Toast for transient errors could be added here
            }
        }
    }, [date, listEvents, status, view]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const handleConnect = useCallback(async () => {
        try {
            const url = await getAuthUrl({});
            window.location.href = url;
        } catch (error) {
            console.error("Failed to get auth url:", error);
            alert("Failed to initiate connection");
        }
    }, [getAuthUrl]);

    const onNavigate = useCallback((newDate: Date) => {
        setDate(newDate);
    }, []);

    const onView = useCallback((newView: View) => {
        setView(newView);
    }, []);

    const handleSelectEvent = useCallback((event: CalendarEvent) => {
        setSelectedEvent(event);
    }, []);

    const closeSelectedEvent = useCallback(() => {
        setSelectedEvent(null);
    }, []);

    const handleEventDeleted = useCallback(() => {
        setSelectedEvent(null);
        loadEvents();
    }, [loadEvents]);

    return {
        events,
        status,
        date,
        view,
        selectedEvent,
        loadEvents,
        handleConnect,
        onNavigate,
        onView,
        handleSelectEvent,
        closeSelectedEvent,
        handleEventDeleted,
    };
}

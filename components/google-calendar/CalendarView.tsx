"use client";

import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Button } from "@/components/ui/button";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { CreateEventDialog } from "./CreateEventDialog";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { useCalendarView } from "./useCalendarView";

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

export function CalendarView() {
    const {
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
    } = useCalendarView();

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] border rounded-lg bg-card text-card-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Loading Calendar...</p>
            </div>
        );
    }

    if (status === "disconnected") {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] border rounded-lg bg-card text-card-foreground p-6 text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <CalendarIcon className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Connect your Google Calendar</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                    Sync your appointments and manage your schedule directly from this dashboard.
                </p>
                <Button onClick={handleConnect} size="lg">
                    Connect Google Calendar
                </Button>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] border rounded-lg bg-card text-card-foreground">
                <p className="text-destructive mb-4">Failed to load calendar events.</p>
                <Button variant="outline" onClick={() => loadEvents()}>Retry</Button>
            </div>
        )
    }

    return (
        <div className="h-[750px] p-6 bg-card rounded-xl border shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Schedule</h2>
                <div className="flex gap-2">
                    <CreateEventDialog onEventCreated={() => loadEvents()} />
                    <Button variant="outline" onClick={() => window.open('https://calendar.google.com', '_blank')}>
                        Open in Google Calendar
                    </Button>
                </div>
            </div>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                views={['month', 'week', 'day', 'agenda']}
                view={view}
                date={date}
                onNavigate={onNavigate}
                onView={onView}
                onSelectEvent={handleSelectEvent}
                scrollToTime={new Date(1970, 1, 1, 8)}
            />

            <EventDetailsDialog
                isOpen={!!selectedEvent}
                event={selectedEvent}
                onClose={closeSelectedEvent}
                onEventDeleted={handleEventDeleted}
            />
        </div>
    )
}

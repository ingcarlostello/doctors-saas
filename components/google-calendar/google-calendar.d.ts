export type CalendarStatus = "loading" | "connected" | "disconnected" | "error";

export interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource: any;
}

export interface UseCalendarViewResult {
    events: CalendarEvent[];
    status: CalendarStatus;
    date: Date;
    view: View;
    selectedEvent: CalendarEvent | null;
    loadEvents: () => Promise<void>;
    handleConnect: () => Promise<void>;
    onNavigate: (newDate: Date) => void;
    onView: (newView: View) => void;
    handleSelectEvent: (event: CalendarEvent) => void;
    closeSelectedEvent: () => void;
    handleEventDeleted: () => void;
}

export interface EventDetailsDialogProps {
    event: any;
    isOpen: boolean;
    onClose: () => void;
    onEventDeleted: () => void;
}
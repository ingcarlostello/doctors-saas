"use client";

import { useAction } from "convex/react"
import { useState } from "react"
const api = require("@/convex/_generated/api").api;

type UseEventDetailsDialogProps = {
    event: any;
    onClose: () => void;
    onEventDeleted: () => void;
};

export function useEventDetailsDialog({ event, onClose, onEventDeleted }: UseEventDetailsDialogProps) {
    const deleteEvent = useAction(api.google_calendar.deleteEvent);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!event) return;
        if (!confirm("Are you sure you want to delete this event?")) return;

        setLoading(true);
        try {
            await deleteEvent({ eventId: event.resource.id });
            onEventDeleted();
            onClose();
        } catch (error) {
            console.error("Failed to delete event:", error);
            alert("Failed to delete event");
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        handleDelete,
    };
}

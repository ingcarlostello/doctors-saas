"use client";

import { useAction } from "convex/react"
import { useState } from "react"
import { api } from "@/convex/_generated/api"

export function useCreateEventDialog({ onEventCreated }: { onEventCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const createEvent = useAction(api.google_calendar.createEvent);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const start = formData.get("start") as string;
        const end = formData.get("end") as string;

        try {
            await createEvent({
                summary: title,
                description,
                startTime: new Date(start).getTime(),
                endTime: new Date(end).getTime(),
            });
            setOpen(false);
            if (onEventCreated) onEventCreated();
        } catch (error) {
            console.error(error);
            alert("Failed to create event");
        } finally {
            setLoading(false);
        }
    }

    return {
        open,
        setOpen,
        loading,
        onSubmit,
    };
}

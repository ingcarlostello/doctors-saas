"use client";

import { useAction, useQuery } from "convex/react"
import { useState } from "react"
import { Doc, Id } from "@/convex/_generated/dataModel"

type Patient = Doc<"patients">;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const api = require("@/convex/_generated/api").api;

export function useCreateEventDialog({ onEventCreated }: { onEventCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [patientId, setPatientId] = useState<Id<"patients"> | undefined>(undefined);
    const [patientName, setPatientName] = useState<string | undefined>(undefined);
    const [patientWhatsApp, setPatientWhatsApp] = useState<string | undefined>(undefined);
    const [patientSearch, setPatientSearch] = useState("");
    const [isPatientListOpen, setIsPatientListOpen] = useState(false);

    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);



    const createEvent = useAction(api.google_calendar.createEvent);
    const patientsQuery = useQuery(api.patients.list);
    const patients = (patientsQuery || []) as Patient[];

    const handlePatientSelect = (value: string) => {
        const selectedPatient = patients.find((p) => p._id === value);
        if (selectedPatient) {
            setPatientId(selectedPatient._id);
            setPatientName(selectedPatient.fullName);
            setPatientWhatsApp(selectedPatient.phoneNumber);
        } else {
            setPatientId(undefined);
            setPatientName(undefined);
            setPatientWhatsApp(undefined);
        }
    };

    const filteredPatients = patients.filter((patient) => {
        const searchValue = patientSearch.toLowerCase();
        return (
            patient.fullName.toLowerCase().includes(searchValue) ||
            patient.phoneNumber.toLowerCase().includes(searchValue)
        );
    });

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!startDate || !endDate) return;

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;

        try {
            const startTime = startDate.getTime();
            let endTime = endDate.getTime();

            if (endTime <= startTime) {
                // If user selects same or earlier end time, default to +30m
                endTime = startTime + 30 * 60 * 1000;
            }

            await createEvent({
                summary: title,
                description,
                startTime,
                endTime,
                patientId,
                patientName,
                patientWhatsApp,
            });
            setOpen(false);
            setPatientId(undefined);
            setPatientName(undefined);
            setPatientWhatsApp(undefined);
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
        patientId,
        setPatientId,
        setPatientName,
        setPatientWhatsApp,
        patientSearch,
        setPatientSearch,
        isPatientListOpen,
        setIsPatientListOpen,
        filteredPatients,
        handlePatientSelect,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
    };
}

"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    disabledDates?: (date: Date) => boolean;
    minTime?: Date;
    minTimeExclusive?: boolean;
}

export function DateTimePicker({
    date,
    setDate,
    disabledDates,
    minTime,
    minTimeExclusive = false,
}: DateTimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10... 55

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) {
            setDate(undefined);
            return;
        }

        const newDate = new Date(selectedDate);
        if (date) {
            newDate.setHours(date.getHours());
            newDate.setMinutes(date.getMinutes());
        } else {
            // Default to current time if no time was previously set
            const now = new Date();
            newDate.setHours(now.getHours());
            newDate.setMinutes(now.getMinutes());
        }
        setDate(newDate);
    };

    const handleTimeChange = (type: "hour" | "minute", value: number) => {
        if (!date) return;
        const newDate = new Date(date);
        if (type === "hour") {
            newDate.setHours(value);
        } else {
            newDate.setMinutes(value);
        }
        setDate(newDate);
    };

    const isTimeDisabled = (hour: number, minute: number) => {
        if (!minTime || !date) return false;

        // Only check if selected date is the same day as minTime
        if (
            date.getFullYear() === minTime.getFullYear() &&
            date.getMonth() === minTime.getMonth() &&
            date.getDate() === minTime.getDate()
        ) {
            if (hour < minTime.getHours()) return true;
            if (hour === minTime.getHours()) {
                if (minTimeExclusive) {
                    return minute <= minTime.getMinutes();
                } else {
                    return minute < minTime.getMinutes();
                }
            }
        }
        return false;
    }


    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP p") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex h-full">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        disabled={disabledDates}
                        initialFocus
                    />
                    <div className="border-l p-3">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Clock className="h-4 w-4" /> Time
                            </div>
                            <div className="flex h-[300px]">
                                <ScrollArea className="h-full w-[60px] border-r pr-2">
                                    <div className="flex flex-col gap-1 p-1">
                                        {hours.map((hour) => (
                                            <Button
                                                key={hour}
                                                variant={date && date.getHours() === hour ? "default" : "ghost"}
                                                className="h-8 justify-center disabled:opacity-30 disabled:pointer-events-none"
                                                onClick={() => handleTimeChange("hour", hour)}
                                                disabled={!date || (minTime &&
                                                    date.getFullYear() === minTime.getFullYear() &&
                                                    date.getMonth() === minTime.getMonth() &&
                                                    date.getDate() === minTime.getDate() &&
                                                    hour < minTime.getHours()
                                                )}
                                            >
                                                {hour.toString().padStart(2, "0")}
                                            </Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <ScrollArea className="h-full w-[60px] pl-2">
                                    <div className="flex flex-col gap-1 p-1">
                                        {minutes.map((minute) => (
                                            <Button
                                                key={minute}
                                                variant={date && date.getMinutes() === minute ? "default" : "ghost"}
                                                className="h-8 justify-center disabled:opacity-30 disabled:pointer-events-none"
                                                onClick={() => handleTimeChange("minute", minute)}
                                                disabled={!date || (date && isTimeDisabled(date.getHours(), minute))}
                                            >
                                                {minute.toString().padStart(2, "0")}
                                            </Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

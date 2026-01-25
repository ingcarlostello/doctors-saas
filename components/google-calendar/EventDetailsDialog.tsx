"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Clock, AlignLeft } from "lucide-react"
import { format } from "date-fns"
import { useEventDetailsDialog } from "@/components/google-calendar/useEventDetailsDialog"
import { EventDetailsDialogProps } from "./google-calendar";

export function EventDetailsDialog({ event, isOpen, onClose, onEventDeleted }: EventDetailsDialogProps) {
    if (!event) return null;

    const { loading, handleDelete } = useEventDetailsDialog({ event, onClose, onEventDeleted });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{event.title}</DialogTitle>
                    {event.resource.description && (
                        <DialogDescription className="mt-2">
                            {event.resource.description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-start gap-3 text-sm">
                        <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                        <div>
                            <div className="font-medium">Start</div>
                            <div className="text-muted-foreground">
                                {format(event.start, "PPP p")}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm">
                        <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                        <div>
                            <div className="font-medium">End</div>
                            <div className="text-muted-foreground">
                                {format(event.end, "PPP p")}
                            </div>
                        </div>
                    </div>

                    {event.resource.description && (
                        <div className="flex items-start gap-3 text-sm">
                            <AlignLeft className="w-4 h-4 mt-1 text-muted-foreground" />
                            <div className="text-muted-foreground whitespace-pre-wrap">
                                {event.resource.description}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Close
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Delete Event
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useCreateEventDialog } from "@/components/google-calendar/useCreateEventDialog";
import { cn } from "@/lib/utils";
import { useNamespace } from "@/components/TranslationProvider";

export function CreateEventDialog({
  onEventCreated,
}: {
  onEventCreated?: () => void;
}) {
  const { t } = useNamespace("calendar");
  const {
    filteredPatients,
    handlePatientSelect,
    isPatientListOpen,
    loading,
    onSubmit,
    open,
    patientId,
    patientSearch,
    setIsPatientListOpen,
    setOpen,
    setPatientSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = useCreateEventDialog({ onEventCreated });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t.addEvent}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.dialog.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t.dialog.eventTitleLabel}</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder={t.dialog.eventTitlePlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t.dialog.descriptionLabel}</Label>
            <Textarea
              id="description"
              name="description"
              placeholder={t.dialog.descriptionPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <div>
              <div className="grid gap-2">
                <Label htmlFor="patient-search">{t.dialog.patientLabel}</Label>
                <div className="relative">
                  <Input
                    id="patient-search"
                    placeholder={t.dialog.patientSearchPlaceholder}
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    className="pr-10"
                    autoComplete="off"
                  />

                  <button
                    type="button"
                    onClick={() => setIsPatientListOpen((prev) => !prev)}
                    className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isPatientListOpen && "rotate-180",
                      )}
                    />
                  </button>
                </div>
              </div>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isPatientListOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <div className="rounded-md border">
                    {filteredPatients.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">
                        {t.dialog.noPatients}
                      </p>
                    ) : (
                      <ul className="max-h-[200px] overflow-auto">
                        {filteredPatients.map((patient) => (
                          <li key={patient._id}>
                            <button
                              type="button"
                              onClick={() => {
                                handlePatientSelect(patient._id);
                                setIsPatientListOpen(false);
                                setPatientSearch(patient.fullName);
                              }}
                              className={cn(
                                "flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                                patientId === patient._id &&
                                  patientSearch.trim() !== "" &&
                                  "bg-accent",
                              )}
                            >
                              <span>{patient.fullName}</span>
                              {patientId === patient._id &&
                                patientSearch.trim() !== "" && (
                                  <Check className="h-4 w-4" />
                                )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.dialog.startTimeLabel}</Label>
              <DateTimePicker
                date={startDate}
                setDate={setStartDate}
                disabledDates={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                minTime={new Date()} // Restrict time if today
              />
              <input
                type="hidden"
                name="start"
                value={startDate?.toISOString() || ""}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.dialog.endTimeLabel}</Label>
              <DateTimePicker
                date={endDate}
                setDate={setEndDate}
                disabledDates={(date) => {
                  if (!startDate) return false;
                  const startDay = new Date(startDate);
                  startDay.setHours(0, 0, 0, 0);
                  return date < startDay;
                }}
                minTime={startDate} // Restrict time if same day
                minTimeExclusive={true}
              />
              <input
                type="hidden"
                name="end"
                value={endDate?.toISOString() || ""}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.dialog.createButton}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

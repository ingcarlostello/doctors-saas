"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { CalendarView } from "@/components/google-calendar/CalendarView";
import { useNamespace } from "@/components/TranslationProvider";

export default function CalendarPage() {
  const { t } = useNamespace("calendar");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.noEvents}</p>
        </div>
        <CalendarView />
      </div>
    </DashboardLayout>
  );
}

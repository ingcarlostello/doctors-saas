"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useNamespace } from "@/components/TranslationProvider";

export function HeroSection() {
  const { t } = useNamespace("landing");
  const { t: dashboardT } = useNamespace("dashboard");

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-muted-foreground">{t.hero.badge}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t.hero.title}
            <br />
            <span className="text-muted-foreground">{t.hero.titleHighlight}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            {t.hero.description}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/demo">
                {t.hero.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base bg-transparent" asChild>
              <Link href="#how-it-works">
                <Play className="mr-2 h-4 w-4" />
                {t.hero.ctaSecondary}
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mt-16 sm:mt-20">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-warning/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
              <span className="ml-2 text-xs text-muted-foreground">Zenticare Dashboard</span>
            </div>
            <div className="aspect-[16/9] bg-muted/20 p-4 sm:p-8">
              <div className="grid h-full grid-cols-12 gap-4">
                <div className="col-span-3 hidden rounded-lg border border-border bg-card p-4 lg:block">
                  <div className="space-y-3">
                    <div className="h-8 w-20 rounded bg-primary/10" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded bg-muted" />
                          <div className="h-3 flex-1 rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-span-12 space-y-4 lg:col-span-9">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: dashboardT.stats.revenueRecovered, value: "$12,450", color: "bg-success/10 border-success/20" },
                      { label: dashboardT.stats.noShowsPrevented, value: "47", color: "bg-primary/10 border-primary/20" },
                      { label: dashboardT.stats.pendingRecalls, value: "23", color: "bg-warning/10 border-warning/20" },
                    ].map((stat) => (
                      <div key={stat.label} className={`rounded-lg border p-3 sm:p-4 ${stat.color}`}>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                        <div className="mt-1 text-lg font-semibold sm:text-xl">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 rounded-lg border border-border bg-card p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-4 w-20 rounded bg-muted" />
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 7 }).map((_, day) => (
                        <div key={day} className="space-y-2">
                          <div className="h-3 w-full rounded bg-muted" />
                          {Array.from({ length: 4 }).map((_, slot) => {
                            // Deterministic pattern based on indices to avoid hydration mismatch
                            const pattern = (day + slot) % 3;
                            const colorClass = pattern === 0
                              ? "bg-success/20"
                              : pattern === 1
                                ? "bg-warning/20"
                                : "bg-muted";
                            return (
                              <div
                                key={slot}
                                className={`h-8 w-full rounded ${colorClass}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 left-1/2 h-[200px] w-[80%] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </div>
    </section>
  )
}

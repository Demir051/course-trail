"use client";

import Link from "next/link";
import {
  BookmarkCheck,
  Lock,
  NotebookPen,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";
import type { Profile } from "@/types/database";

export function LandingPage({ profile }: { profile?: Profile | null }) {
  const t = useT();

  const features = [
    {
      icon: PlayCircle,
      title: t.landing.feature1Title,
      body: t.landing.feature1Body,
    },
    {
      icon: NotebookPen,
      title: t.landing.feature2Title,
      body: t.landing.feature2Body,
    },
    {
      icon: BookmarkCheck,
      title: t.landing.feature3Title,
      body: t.landing.feature3Body,
    },
    {
      icon: Lock,
      title: t.landing.feature4Title,
      body: t.landing.feature4Body,
    },
  ];

  const steps = [
    { title: t.landing.step1Title, body: t.landing.step1Body },
    { title: t.landing.step2Title, body: t.landing.step2Body },
    { title: t.landing.step3Title, body: t.landing.step3Body },
  ];

  const faqs = [
    { q: t.landing.faq1Q, a: t.landing.faq1A },
    { q: t.landing.faq2Q, a: t.landing.faq2A },
    { q: t.landing.faq3Q, a: t.landing.faq3A },
    { q: t.landing.faq4Q, a: t.landing.faq4A },
  ];

  const privacyPoints = [
    t.landing.privacyPoint1,
    t.landing.privacyPoint2,
    t.landing.privacyPoint3,
    t.landing.privacyPoint4,
  ];

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader profile={profile} />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <p className="font-heading text-sm font-medium tracking-wide text-primary">
                {t.brand}
              </p>
              <h1 className="font-heading text-3xl leading-tight tracking-tight text-balance sm:text-5xl lg:text-[3.25rem]">
                {t.landing.headline}
              </h1>
              <p className="max-w-xl text-base text-muted-foreground text-pretty sm:text-lg">
                {t.landing.support}
              </p>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button
                  size="lg"
                  className="min-h-11 w-full sm:w-auto"
                  render={<Link href="/register" />}
                >
                  {t.landing.ctaStart}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-11 w-full sm:w-auto"
                  render={<Link href="/discover" />}
                >
                  {t.landing.ctaBrowse}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{t.tagline}</p>
            </div>

            <div className="relative animate-in fade-in zoom-in-95 duration-700 delay-150">
              <div className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-background to-accent/40 p-5">
                  <div className="mb-4 flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{t.landing.previewCourse}</span>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-800 dark:text-amber-200">
                      62% {t.landing.complete}
                    </span>
                  </div>
                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[62%] rounded-full bg-amber-500 transition-all duration-1000" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                      {t.landing.previewLesson}
                      <div className="text-xs text-muted-foreground">
                        {t.landing.resumeAt} 12:10
                      </div>
                    </div>
                    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-muted-foreground">
                      {t.landing.previewNote}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border/60 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-heading text-3xl tracking-tight">
                {t.landing.featuresTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t.landing.featuresSubtitle}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-border/70 bg-card/70 p-6"
                >
                  <feature.icon className="mb-3 size-5 text-primary" aria-hidden />
                  <h3 className="font-heading text-xl">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="space-y-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <h3 className="font-heading text-xl">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="privacy" className="border-t border-border/60 py-20">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" aria-hidden />
                {t.landing.privacyBadge}
              </div>
              <h2 className="font-heading text-3xl tracking-tight">
                {t.landing.privacyTitle}
              </h2>
              <p className="text-muted-foreground">{t.landing.privacyBody}</p>
            </div>
            <ul className="space-y-2 rounded-2xl border border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
              {privacyPoints.map((point) => (
                <li key={point}>✓ {point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className="border-t border-border/60 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="mb-8 text-center font-heading text-3xl tracking-tight">
              {t.landing.faqTitle}
            </h2>
            <div className="space-y-4">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-border/70 bg-card/60 px-5 py-4"
                >
                  <summary className="cursor-pointer list-none font-medium marker:content-none">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-heading text-3xl tracking-tight">
              {t.landing.ctaTitle}
            </h2>
            <p className="mt-3 text-muted-foreground">{t.landing.ctaBody}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Button
                size="lg"
                className="min-h-11 w-full sm:w-auto"
                render={<Link href="/register" />}
              >
                {t.landing.ctaCreate}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
                render={<Link href="/login" />}
              >
                {t.landing.ctaLogin}
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {t.brand}. {t.tagline}
      </footer>
    </div>
  );
}

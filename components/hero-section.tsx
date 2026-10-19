"use client";

import { ModuleSearchBar } from "@/components/search/module-search-bar";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center pt-24 pb-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 text-center sm:px-6 lg:px-8 xl:px-12">
        <h1 className="mb-8 text-5xl font-bold tracking-tight text-balance sm:text-6xl md:text-7xl lg:text-8xl">
          <span className="text-foreground">Get the </span>
          <span className="text-secondary">Tea</span>
          <span className="text-foreground"> on </span>
          <span className="text-primary">KIT</span>
          <span className="text-foreground"> modules</span>
        </h1>

        <p className="mx-auto mb-14 max-w-2xl text-xl text-pretty text-muted-foreground sm:text-2xl md:text-3xl">
          Honest reviews from students, for students.
        </p>

        <div className="max-w-3xl mx-auto">
          <ModuleSearchBar />
        </div>
      </div>
    </section>
  );
}

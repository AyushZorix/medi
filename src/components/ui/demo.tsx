"use client";

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import heroImage from "../../../image.png";

import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative flex h-screen w-full flex-col items-start justify-end">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 w-full px-4 pb-16 sm:px-8 sm:pb-24 lg:px-16 lg:pb-32">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="w-full space-y-4 sm:w-1/2">
            <h1 className="text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Your <span className="text-primary">Path</span> to the U.S.,
              <br />
              <span className="text-white">Clearly Defined.</span>
            </h1>
            <Button
              className="rounded-none py-0 pr-0 text-lg font-normal text-black"
              asChild
            >
              <Link to="/sign-in">
                Get started
                <span className="border-l border-neutral-500 p-3">
                  <ArrowRight />
                </span>
              </Link>
            </Button>
          </div>
          <div className="w-full sm:w-1/2">
            <p className="text-base italic text-primary sm:text-right md:text-2xl">
              We turn your U.S. plans into clear, winning visa strategies. From your first
              application to final approval, we&apos;re with you every step of the way.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

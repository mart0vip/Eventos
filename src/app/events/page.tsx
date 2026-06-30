"use client";

import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventsContent from "@/components/EventsContent";

export default function EventsPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center bg-cream">
            <span className="text-5xl animate-bounce">🐴</span>
          </div>
        }
      >
        <EventsContent />
      </Suspense>
      <Footer />
    </>
  );
}
